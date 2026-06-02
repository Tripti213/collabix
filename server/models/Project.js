const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  color: { type: String, default: '#6366f1' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['admin', 'member', 'viewer'], default: 'member' },
    joinedAt: { type: Date, default: Date.now }
  }],
  columns: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    order: { type: Number, default: 0 },
    color: { type: String, default: '#64748b' }
  }],
  isArchived: { type: Boolean, default: false },
  dueDate: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Project', ProjectSchema);
