const router = require('express').Router();
const Comment = require('../models/Comment');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const Activity = require('../models/Activity');
const auth = require('../middleware/auth');

// GET comments for task
router.get('/task/:taskId', auth, async (req, res) => {
  try {
    const comments = await Comment.find({ task: req.params.taskId })
      .populate('author', 'name email avatar').sort('createdAt');
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST add comment
router.post('/', auth, async (req, res) => {
  try {
    const { content, taskId, mentions } = req.body;
    const comment = await Comment.create({
      content, task: taskId, author: req.user._id, mentions
    });
    await comment.populate('author', 'name email avatar');

    const task = await Task.findById(taskId).populate('assignees', '_id');

    // Notify assignees + mentioned users
    const notifySet = new Set();
    (task.assignees || []).forEach(a => notifySet.add(a._id.toString()));
    (mentions || []).forEach(m => notifySet.add(m.toString()));
    notifySet.delete(req.user._id.toString());

    for (const uid of notifySet) {
      await Notification.create({
        recipient: uid, sender: req.user._id, type: 'comment_added',
        title: 'New Comment',
        message: `${req.user.name} commented on a task`,
        link: `/projects/${task.project}`,
        data: { taskId }
      });
      const socketId = global.connectedUsers?.get(uid);
      if (socketId) req.io.to(socketId).emit('notification:new', { message: `${req.user.name} commented` });
    }

    // Log activity
    await Activity.create({
      project: task.project,
      user: req.user._id,
      type: 'comment_added',
      message: `${req.user.name} commented on a task`,
      meta: { taskId, commentId: comment._id }
    });
    req.io.to(`project:${task.project}`).emit('activity:new', {
      type: 'comment_added',
      message: `${req.user.name} commented`
    });

    req.io.to(`project:${task.project}`).emit('comment:added', { taskId, comment });
    res.status(201).json(comment);
  } catch (err) {
    console.error('COMMENT ERROR:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// PUT edit comment
router.put('/:id', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Not found' });
    if (comment.author.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Forbidden' });

    comment.content = req.body.content;
    comment.isEdited = true;
    await comment.save();
    await comment.populate('author', 'name email avatar');

    const task = await Task.findById(comment.task);
    req.io.to(`project:${task.project}`).emit('comment:updated', { taskId: comment.task, comment });
    res.json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE comment
router.delete('/:id', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Not found' });
    if (comment.author.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Forbidden' });

    const task = await Task.findById(comment.task);
    await Comment.findByIdAndDelete(req.params.id);
    req.io.to(`project:${task.project}`).emit('comment:deleted', {
      taskId: comment.task, commentId: req.params.id
    });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;