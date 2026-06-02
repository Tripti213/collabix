const router = require('express').Router();
const { upload, cloudinary } = require('../config/cloudinary');
const Task = require('../models/Task');
const Project = require('../models/Project');
const auth = require('../middleware/auth');

// Upload file to a project (stored in task or project-level)
router.post('/upload/:projectId', auth, upload.array('files', 10), async (req, res) => {
  try {
    const files = req.files.map(f => ({
      name: f.originalname,
      url: f.path,
      publicId: f.filename,
      type: f.mimetype,
      size: f.size,
      uploadedBy: req.user._id,
      uploadedAt: new Date(),
    }));
    res.json({ files });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Attach uploaded files to a task
router.post('/attach/:taskId', auth, async (req, res) => {
  try {
    const { files } = req.body;
    const task = await Task.findByIdAndUpdate(
      req.params.taskId,
      { $push: { attachments: { $each: files } } },
      { new: true }
    ).populate('assignees', 'name email avatar')
     .populate('createdBy', 'name email avatar');

    console.log('Emitting task:updated to project:', task.project.toString()); // debug
    req.io.to(`project:${task.project.toString()}`).emit('task:updated', task);
    res.json(task);
  } catch (err) {
    console.error('ATTACH ERROR:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// DELETE file — removes from Cloudinary AND from task
router.delete('/task/:taskId/file/:index', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const index = parseInt(req.params.index);
    if (isNaN(index) || index < 0 || index >= task.attachments.length) {
      return res.status(400).json({ message: 'Invalid file index' });
    }

    const file = task.attachments[index];
    console.log('=== DELETE FILE DEBUG ===');
    console.log('Full file object:', JSON.stringify(file, null, 2));
    console.log('publicId:', file.publicId);
    console.log('url:', file.url);
    console.log('type:', file.type);

    // Try to delete from Cloudinary
    try {
      // Extract correct publicId from URL if stored publicId is wrong
      let publicId = file.publicId;

      // If publicId looks like a full path with folder, use it directly
      // If not, extract from URL
      if (!publicId && file.url) {
        // Extract from Cloudinary URL like:
        // https://res.cloudinary.com/cloud_name/image/upload/v123/folder/filename.jpg
        const urlParts = file.url.split('/');
        const uploadIndex = urlParts.indexOf('upload');
        if (uploadIndex !== -1) {
          // Get everything after /upload/v{version}/
          const afterUpload = urlParts.slice(uploadIndex + 2).join('/');
          // Remove file extension
          publicId = afterUpload.replace(/\.[^/.]+$/, '');
        }
      }

      console.log('Using publicId for deletion:', publicId);

      const resourceType = file.type?.startsWith('video/') ? 'video'
        : file.type?.startsWith('image/') ? 'image'
        : 'raw';

      console.log('Resource type:', resourceType);

      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
        invalidate: true,
      });

      console.log('Cloudinary delete result:', result);

      if (result.result !== 'ok' && result.result !== 'not found') {
        console.warn('Unexpected Cloudinary result:', result);
      }
    } catch (cloudErr) {
      console.error('Cloudinary delete error:', cloudErr);
    }

    // Always remove from DB regardless of Cloudinary result
    task.attachments.splice(index, 1);
    await task.save();

    await task.populate('assignees', 'name email avatar');
    await task.populate('createdBy', 'name email avatar');

    req.io.to(`project:${task.project.toString()}`).emit('task:updated', task);
    res.json(task);
  } catch (err) {
    console.error('DELETE FILE ERROR:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// GET all files for a project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId })
      .select('title attachments');

    const files = tasks
      .filter(t => t.attachments && t.attachments.length > 0)
      .flatMap(t =>
        t.attachments.map(a => ({
          ...a.toObject(),
          taskTitle: t.title,
          taskId: t._id
        }))
      );

    res.json(files);
  } catch (err) {
    console.error('FILES ERROR:', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;