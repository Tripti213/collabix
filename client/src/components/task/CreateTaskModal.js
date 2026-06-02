import React, { useState } from 'react';
import api from '../../utils/api';

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const COVER_COLORS = ['','#6366f1','#ec4899','#f59e0b','#22c55e','#3b82f6','#ef4444'];

export default function CreateTaskModal({ columnId, projectId, project, onClose, onCreate }) {
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', dueDate: '', labels: '', coverColor: '', assignees: [] });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const labels = form.labels ? form.labels.split(',').map(l => l.trim()).filter(Boolean) : [];
      const res = await api.post('/tasks', {
        ...form, labels, project: projectId, columnId,
        dueDate: form.dueDate || undefined
      });
      onCreate(res.data);
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Task</h2>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Task Title *</label>
            <input value={form.title} onChange={e => setForm({...form, title: e.target.value})}
              placeholder="What needs to be done?" required autoFocus />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
              placeholder="Add more details..." rows={3} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Priority</label>
              <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Due Date</label>
              <input type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} />
            </div>
          </div>
          <div className="form-group">
            <label>Labels (comma separated)</label>
            <input value={form.labels} onChange={e => setForm({...form, labels: e.target.value})}
              placeholder="design, frontend, bug" />
          </div>
          <div className="form-group">
            <label>Cover Color</label>
            <div className="color-picker">
              {COVER_COLORS.map(c => (
                <button key={c} type="button"
                  className={`color-swatch ${form.coverColor === c ? 'selected' : ''} ${c === '' ? 'empty' : ''}`}
                  style={{ background: c || '#e5e7eb' }} onClick={() => setForm({...form, coverColor: c})} />
              ))}
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading || !form.title}>
              {loading ? 'Adding...' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
