const router = require('express').Router();
const Activity = require('../models/Activity');
const auth = require('../middleware/auth');
const Project = require('../models/Project');

// Get activity for a project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const activities = await Activity.find({ project: req.params.projectId })
      .populate('user', 'name email avatar')
      .sort('-createdAt')
      .limit(50);
    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all activity across all user's projects
router.get('/feed', auth, async (req, res) => {
  try {
    const { data: memberRows } = { data: [] };
    // Get projects user belongs to
    const Project = require('../models/Project');
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
      isArchived: false
    }).select('_id');

    const projectIds = projects.map(p => p._id);

    const activities = await Activity.find({ project: { $in: projectIds } })
      .populate('user', 'name email avatar')
      .populate('project', 'name color')
      .sort('-createdAt')
      .limit(100);

    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

// DELETE all activity for a project (owner only)
router.delete('/project/:projectId', auth, async (req, res) => {
  try {
    const Project = require('../models/Project');
    const project = await Project.findById(req.params.projectId).select('owner');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Only the project owner can clear activity' });

    const result = await Activity.deleteMany({ project: req.params.projectId });
    console.log(`Cleared ${result.deletedCount} activities for project ${req.params.projectId}`);
    res.json({ message: `Cleared ${result.deletedCount} activities`, count: result.deletedCount });
  } catch (err) {
    console.error('Clear activity error:', err.message);
    res.status(500).json({ message: err.message });
  }
});