const router = require('express').Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');
const Project = require('../models/Project');
const Comment = require('../models/Comment');
const Activity = require('../models/Activity');

router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Not found' });

    const tasks = await Task.find({ project: projectId, isArchived: false })
      .populate('assignees', 'name avatar');

    // Basic counts
    const total = tasks.length;
    const done = tasks.filter(t => t.columnId === 'done').length;
    const inProgress = tasks.filter(t => t.columnId === 'inprogress').length;
    const inReview = tasks.filter(t => t.columnId === 'review').length;
    const todo = tasks.filter(t => t.columnId === 'todo').length;
    const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.columnId !== 'done').length;

    // Priority breakdown
    const byPriority = {
      urgent: tasks.filter(t => t.priority === 'urgent').length,
      high: tasks.filter(t => t.priority === 'high').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      low: tasks.filter(t => t.priority === 'low').length,
    };

    // Tasks per member
    const memberMap = {};
    tasks.forEach(task => {
      (task.assignees || []).forEach(a => {
        if (!memberMap[a._id]) memberMap[a._id] = { name: a.name, avatar: a.avatar, total: 0, done: 0 };
        memberMap[a._id].total++;
        if (task.columnId === 'done') memberMap[a._id].done++;
      });
    });
    const byMember = Object.values(memberMap).sort((a, b) => b.total - a.total);

    // Completion trend — last 7 days
    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const completed = await Activity.countDocuments({
        project: projectId,
        type: 'task_completed',
        createdAt: { $gte: date, $lt: nextDate }
      });

      const created = await Activity.countDocuments({
        project: projectId,
        type: 'task_created',
        createdAt: { $gte: date, $lt: nextDate }
      });

      trend.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        completed,
        created,
      });
    }

    // Comments count
    const taskIds = tasks.map(t => t._id);
    const commentsCount = await Comment.countDocuments({ task: { $in: taskIds } });

    res.json({
      total, done, inProgress, inReview, todo, overdue,
      completionRate: total > 0 ? Math.round((done / total) * 100) : 0,
      byPriority, byMember, trend, commentsCount,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;