const router = require('express').Router();
const Task = require('../models/Task');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

// Get tasks for project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId, isArchived: false })
      .populate('assignees', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort('order');
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create task
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, project, columnId, assignees, priority, labels, dueDate, coverColor } = req.body;
    const proj = await Project.findById(project);
    if (!proj) return res.status(404).json({ message: 'Project not found' });

    const taskCount = await Task.countDocuments({ project, columnId });
    const task = await Task.create({
      title, description, project, columnId, assignees, priority, labels, dueDate, coverColor,
      createdBy: req.user._id, order: taskCount
    });
    await task.populate('assignees', 'name email avatar');
    await task.populate('createdBy', 'name email avatar');

    // Notify assignees
    if (assignees?.length) {
      for (const uid of assignees) {
        if (uid.toString() !== req.user._id.toString()) {
          await Notification.create({
            recipient: uid, sender: req.user._id, type: 'task_assigned',
            title: 'Task Assigned', message: `${req.user.name} assigned you to "${title}"`,
            link: `/projects/${project}`, data: { taskId: task._id }
          });
          const socketId = global.connectedUsers?.get(uid.toString());
          if (socketId) req.io.to(socketId).emit('notification:new', { message: `You've been assigned to "${title}"` });
        }
      }
    }

    req.io.to(`project:${project}`).emit('task:created', task);
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update task
router.put('/:id', auth, async (req, res) => {
  try {
    const oldTask = await Task.findById(req.params.id);
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('assignees', 'name email avatar')
      .populate('createdBy', 'name email avatar');
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Notify new assignees
    if (req.body.assignees) {
      const oldAssignees = (oldTask.assignees || []).map(a => a.toString());
      const newAssignees = req.body.assignees.filter(a => !oldAssignees.includes(a.toString()));
      for (const uid of newAssignees) {
        if (uid.toString() !== req.user._id.toString()) {
          await Notification.create({
            recipient: uid, sender: req.user._id, type: 'task_assigned',
            title: 'Task Assigned', message: `${req.user.name} assigned you to "${task.title}"`,
            link: `/projects/${task.project}`, data: { taskId: task._id }
          });
          const socketId = global.connectedUsers?.get(uid.toString());
          if (socketId) req.io.to(socketId).emit('notification:new', { message: `Assigned to "${task.title}"` });
        }
      }
    }

    req.io.to(`project:${task.project}`).emit('task:updated', task);
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Move task (column change + reorder)
router.put('/:id/move', auth, async (req, res) => {
  try {
    const { columnId, order } = req.body;
    const task = await Task.findByIdAndUpdate(req.params.id, { columnId, order }, { new: true })
      .populate('assignees', 'name email avatar').populate('createdBy', 'name email avatar');
    req.io.to(`project:${task.project}`).emit('task:moved', task);
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete task
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    req.io.to(`project:${task.project}`).emit('task:deleted', req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
