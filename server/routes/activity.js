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