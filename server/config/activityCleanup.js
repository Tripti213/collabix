const Activity = require('../models/Activity');

const KEEP_PER_PROJECT = 100;   // max activities per project
const DELETE_OLDER_THAN_DAYS = 30; // delete activities older than this

async function cleanupActivities() {
  try {
    console.log('Running activity cleanup...');

    // 1. Delete activities older than 30 days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - DELETE_OLDER_THAN_DAYS);

    const oldDeleted = await Activity.deleteMany({
      createdAt: { $lt: cutoffDate }
    });
    console.log(`Deleted ${oldDeleted.deletedCount} old activities (>${DELETE_OLDER_THAN_DAYS} days)`);

    // 2. Per project — keep only latest 500
    const projects = await Activity.distinct('project');

    let trimCount = 0;
    for (const projectId of projects) {
      const count = await Activity.countDocuments({ project: projectId });
      if (count > KEEP_PER_PROJECT) {
        // Find the 500th most recent activity
        const cutoff = await Activity.find({ project: projectId })
          .sort('-createdAt')
          .skip(KEEP_PER_PROJECT)
          .limit(1)
          .select('createdAt');

        if (cutoff.length > 0) {
          const result = await Activity.deleteMany({
            project: projectId,
            createdAt: { $lte: cutoff[0].createdAt }
          });
          trimCount += result.deletedCount;
        }
      }
    }

    console.log(`Trimmed ${trimCount} excess activities across ${projects.length} projects`);
    console.log('Activity cleanup complete.');
  } catch (err) {
    console.error('Activity cleanup error:', err.message);
  }
}

// Run cleanup every 24 hours
function scheduleCleanup() {
  // Run once on startup after 10 seconds
  setTimeout(cleanupActivities, 10000);

  // Then every 24 hours
  setInterval(cleanupActivities, 24 * 60 * 60 * 1000);
}

module.exports = { scheduleCleanup, cleanupActivities };