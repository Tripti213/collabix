const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['task_created','task_moved','task_completed','task_deleted','comment_added','member_added','member_removed','project_created','file_uploaded'],
    required: true
  },
  message: { type: String, required: true },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('Activity', ActivitySchema);