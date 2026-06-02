const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  columnId: { type: String, required: true },
  order: { type: Number, default: 0 },
  assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  labels: [{ type: String }],
  dueDate: { type: Date },
  attachments: [{ name: String, url: String, uploadedAt: { type: Date, default: Date.now } }],
  checklist: [{
    text: { type: String, required: true },
    completed: { type: Boolean, default: false }
  }],
  isArchived: { type: Boolean, default: false },
  coverColor: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);
