const router = require('express').Router();
const Task = require('../models/Task');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const Activity = require('../models/Activity');
const auth = require('../middleware/auth');
const redis = require('../config/redis');

async function logActivity(projectId, userId, type, message, meta = {}) {
  try {
    const doc = await Activity.create({ project: projectId, user: userId, type, message, meta });
    console.log('Activity logged:', type, '| id:', doc._id);
  } catch (e) {
    console.error('Activity log FAILED:', type, '| error:', e.message);
  }
}

async function isProjectOwner(projectId, userId) {
  const project = await Project.findById(projectId).select('owner');
  return project?.owner.toString() === userId.toString();
}

// GET tasks for project — cached
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const cacheKey = `tasks:project:${req.params.projectId}`;
    const cached = await redis.get(cacheKey);
    if (cached) return res.json(cached);

    const tasks = await Task.find({ project: req.params.projectId, isArchived: false })
      .populate('assignees', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort('order').lean();

    await redis.set(cacheKey, tasks, 60); // cache 1 min
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/calendar/:projectId', auth, async (req, res) => {
  try {
    const tasks = await Task.find({
      project: req.params.projectId,
      dueDate: { $exists: true, $ne: null },
      isArchived: false
    }).populate('assignees', 'name email avatar').populate('createdBy', 'name email avatar');
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/due/all', auth, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
      isArchived: false
    }).select('_id name color');

    const projectIds = projects.map(p => p._id);
    const tasks = await Task.find({
      project: { $in: projectIds },
      dueDate: { $exists: true, $ne: null },
      isArchived: false
    }).populate('assignees', 'name email avatar')
      .populate('project', 'name color')
      .sort('dueDate');

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, description, project, columnId, assignees, priority, labels, dueDate, coverColor } = req.body;

    const owner = await isProjectOwner(project, req.user._id);
    const finalAssignees = owner ? (assignees || []) : [];

    const taskCount = await Task.countDocuments({ project, columnId });
    const task = await Task.create({
      title, description, project, columnId,
      assignees: finalAssignees,
      priority, labels, dueDate, coverColor,
      createdBy: req.user._id, order: taskCount
    });
    await task.populate('assignees', 'name email avatar');
    await task.populate('createdBy', 'name email avatar');

    if (owner && finalAssignees.length) {
      for (const uid of finalAssignees) {
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

    await logActivity(project, req.user._id, 'task_created', `${req.user.name} created task "${title}"`, { taskId: task._id, taskTitle: title });

    // Invalidate tasks cache
    await redis.del(`tasks:project:${project}`);

    req.io.to(`project:${project}`).emit('task:created', task);
    req.io.to(`project:${project}`).emit('activity:new', { type: 'task_created', message: `${req.user.name} created "${title}"` });
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const oldTask = await Task.findById(req.params.id);
    if (!oldTask) return res.status(404).json({ message: 'Task not found' });

    const owner = await isProjectOwner(oldTask.project, req.user._id);

    if (req.body.assignees !== undefined && !owner)
      return res.status(403).json({ message: 'Only the project owner can assign tasks' });

    if (req.body.checklist !== undefined && !owner)
      return res.status(403).json({ message: 'Only the project owner can update the checklist' });

    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('assignees', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    if (req.body.assignees && owner) {
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

    if (req.body.columnId === 'done' && oldTask.columnId !== 'done') {
      await logActivity(task.project, req.user._id, 'task_completed', `${req.user.name} completed "${task.title}"`, { taskId: task._id });
      req.io.to(`project:${task.project}`).emit('activity:new', { type: 'task_completed', message: `${req.user.name} completed "${task.title}"` });
    }

    // Invalidate cache
    await redis.del(`tasks:project:${task.project}`);

    req.io.to(`project:${task.project}`).emit('task:updated', task);
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/move', auth, async (req, res) => {
  try {
    const { columnId, order } = req.body;
    const oldTask = await Task.findById(req.params.id);
    if (!oldTask) return res.status(404).json({ message: 'Task not found' });

    // Block moving OUT of done
    if (oldTask.columnId === 'done' && columnId !== 'done') {
      return res.status(403).json({ message: 'Completed tasks cannot be moved back' });
    }

    // Only owner can move task TO done
    if (columnId === 'done' && oldTask.columnId !== 'done') {
      const owner = await isProjectOwner(oldTask.project, req.user._id);
      if (!owner) return res.status(403).json({ message: 'Only the project owner can mark tasks as Done' });
    }

    const task = await Task.findByIdAndUpdate(req.params.id, { columnId, order }, { new: true })
      .populate('assignees', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    if (oldTask.columnId !== columnId) {
      if (columnId === 'done') {
        await logActivity(task.project, req.user._id, 'task_completed', `${req.user.name} completed "${task.title}"`, { taskId: task._id });
        req.io.to(`project:${task.project}`).emit('activity:new', { type: 'task_completed', message: `${req.user.name} completed "${task.title}"` });
      } else {
        await logActivity(task.project, req.user._id, 'task_moved', `${req.user.name} moved "${task.title}" to ${columnId}`, { taskId: task._id });
        req.io.to(`project:${task.project}`).emit('activity:new', { type: 'task_moved', message: `${req.user.name} moved "${task.title}"` });
      }
    }

    // Invalidate cache
    await redis.del(`tasks:project:${task.project}`);

    req.io.to(`project:${task.project}`).emit('task:moved', task);
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    await logActivity(task.project, req.user._id, 'task_deleted', `${req.user.name} deleted task "${task.title}"`, {});

    // Invalidate cache
    await redis.del(`tasks:project:${task.project}`);

    req.io.to(`project:${task.project}`).emit('task:deleted', req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;