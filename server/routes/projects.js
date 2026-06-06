const router = require('express').Router();
const Project = require('../models/Project');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const Activity = require('../models/Activity');
const auth = require('../middleware/auth');

const DEFAULT_COLUMNS = [
  { id: 'todo',       name: 'To Do',       order: 0, color: '#64748b' },
  { id: 'inprogress', name: 'In Progress', order: 1, color: '#3b82f6' },
  { id: 'review',     name: 'In Review',   order: 2, color: '#f59e0b' },
  { id: 'done',       name: 'Done',        order: 3, color: '#22c55e' },
];

async function getFullProject(projectId) {
  const project = await Project.findById(projectId)
    .populate('owner', 'name email avatar')
    .populate('members.user', 'name email avatar');
  return project;
}

// GET all projects for user
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
      isArchived: false
    }).populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .sort('-createdAt');
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create project
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, color, dueDate } = req.body;
    const project = await Project.create({
      name, description, color, dueDate,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }],
      columns: DEFAULT_COLUMNS
    });
    await project.populate('owner', 'name email avatar');
    await project.populate('members.user', 'name email avatar');

    // Log activity
    await Activity.create({
      project: project._id,
      user: req.user._id,
      type: 'project_created',
      message: `${req.user.name} created project "${name}"`,
      meta: { projectId: project._id }
    });

    req.io.emit('project:created', project);
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single project
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await getFullProject(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const isMember = project.members.some(m => m.user._id.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: 'Access denied' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update project
router.put('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Not found' });
    if (project.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Forbidden' });

    const updated = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    req.io.to(`project:${req.params.id}`).emit('project:updated', updated);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST add member
router.post('/:id/members', auth, async (req, res) => {
  try {
    const { userId, role = 'member' } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Not found' });
    if (project.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Forbidden' });

    const exists = project.members.some(m => m.user.toString() === userId);
    if (exists) return res.status(400).json({ message: 'Already a member' });

    project.members.push({ user: userId, role });
    await project.save();
    await project.populate('members.user', 'name email avatar');
    await project.populate('owner', 'name email avatar');

    // Notify new member
    await Notification.create({
      recipient: userId, sender: req.user._id,
      type: 'project_invite', title: 'Project Invitation',
      message: `${req.user.name} added you to project "${project.name}"`,
      link: `/projects/${project._id}`
    });
    const socketId = global.connectedUsers?.get(userId);
    if (socketId) req.io.to(socketId).emit('notification:new', {
      message: `You've been added to ${project.name}`
    });

    // Log activity
    await Activity.create({
      project: req.params.id,
      user: req.user._id,
      type: 'member_added',
      message: `${req.user.name} added a new member to the project`,
      meta: { userId }
    });
    req.io.to(`project:${req.params.id}`).emit('activity:new', {
      type: 'member_added',
      message: `${req.user.name} added a member`
    });

    req.io.to(`project:${req.params.id}`).emit('project:updated', project);
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE remove member
router.delete('/:id/members/:userId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (project.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Forbidden' });

    project.members = project.members.filter(m => m.user.toString() !== req.params.userId);
    await project.save();
    await project.populate('members.user', 'name email avatar');
    await project.populate('owner', 'name email avatar');

    // Log activity
    await Activity.create({
      project: req.params.id,
      user: req.user._id,
      type: 'member_removed',
      message: `${req.user.name} removed a member from the project`,
      meta: { userId: req.params.userId }
    });
    req.io.to(`project:${req.params.id}`).emit('activity:new', {
      type: 'member_removed',
      message: `${req.user.name} removed a member`
    });

    req.io.to(`project:${req.params.id}`).emit('project:updated', project);
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE project
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Not found' });
    if (project.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Forbidden' });

    await Task.deleteMany({ project: req.params.id });
    await Project.findByIdAndDelete(req.params.id);
    req.io.emit('project:deleted', req.params.id);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;