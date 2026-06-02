import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import api from '../../utils/api';
import socket from '../../utils/socket';
import { useAuth } from '../../context/AuthContext';
import CommentSection from './CommentSection';
import FileUpload from './FileUpload';

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const PRIORITY_COLORS = { urgent:'#ef4444', high:'#f97316', medium:'#f59e0b', low:'#22c55e' };
const TABS = ['details', 'files', 'comments'];

export default function TaskModal({ task: initialTask, project, onClose, onUpdated, onDeleted }) {
  const { user } = useAuth();
  const [task, setTask] = useState(initialTask);
  const [activeTab, setActiveTab] = useState('details');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: initialTask.title,
    description: initialTask.description || '',
    priority: initialTask.priority,
    dueDate: initialTask.dueDate ? format(new Date(initialTask.dueDate), 'yyyy-MM-dd') : '',
    labels: initialTask.labels?.join(', ') || '',
    assignees: initialTask.assignees?.map(a => a._id) || []
  });
  const [saving, setSaving] = useState(false);
  const [checklist, setChecklist] = useState(initialTask.checklist || []);
  const [newCheck, setNewCheck] = useState('');
  const [memberSearch, setMemberSearch] = useState('');

  useEffect(() => {
    socket.on('task:updated', (updated) => {
      if (updated._id === task._id) {
        setTask(updated);
        setChecklist(updated.checklist || []);
        onUpdated(updated);
      }
    });
    return () => socket.off('task:updated');
  }, [task._id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const labels = form.labels ? form.labels.split(',').map(l => l.trim()).filter(Boolean) : [];
      const res = await api.put(`/tasks/${task._id}`, { ...form, labels, dueDate: form.dueDate || null });
      setTask(res.data);
      onUpdated(res.data);
      setEditing(false);
    } finally { setSaving(false); }
  };

  const toggleAssignee = (userId) => {
    setForm(prev => ({
      ...prev,
      assignees: prev.assignees.includes(userId)
        ? prev.assignees.filter(id => id !== userId)
        : [...prev.assignees, userId]
    }));
    if (!editing) setEditing(true);
  };

  const toggleCheck = async (index) => {
    const updated = checklist.map((c, i) => i === index ? { ...c, completed: !c.completed } : c);
    setChecklist(updated);
    const res = await api.put(`/tasks/${task._id}`, { checklist: updated });
    setTask(res.data); onUpdated(res.data);
  };

  const addCheck = async () => {
    if (!newCheck.trim()) return;
    const updated = [...checklist, { text: newCheck, completed: false }];
    setChecklist(updated); setNewCheck('');
    const res = await api.put(`/tasks/${task._id}`, { checklist: updated });
    setTask(res.data); onUpdated(res.data);
  };

  const removeCheck = async (index) => {
    const updated = checklist.filter((_, i) => i !== index);
    setChecklist(updated);
    const res = await api.put(`/tasks/${task._id}`, { checklist: updated });
    setTask(res.data); onUpdated(res.data);
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this task?')) return;
    await api.delete(`/tasks/${task._id}`);
    onDeleted(task._id);
  };

  const handleFileUpdated = (updatedTask) => {
    setTask(updatedTask);
    onUpdated(updatedTask);
  };

  const completedChecks = checklist.filter(c => c.completed).length;
  const filteredMembers = project.members.filter(m =>
    !memberSearch || m.user.name.toLowerCase().includes(memberSearch.toLowerCase())
  );
  const columns = typeof project.columns === 'string' ? JSON.parse(project.columns) : (project.columns || []);

  return (
    <div className="modal-overlay task-modal-overlay" onClick={onClose}>
      <div className="task-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="task-modal-header">
          <div className="task-modal-tabs">
            {TABS.map(tab => (
              <button key={tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}>
                {tab === 'details' && '📋 Details'}
                {tab === 'files' && `📎 Files ${task.attachments?.length ? `(${task.attachments.length})` : ''}`}
                {tab === 'comments' && '💬 Comments'}
              </button>
            ))}
          </div>
          <div className="task-modal-actions">
            {activeTab === 'details' && !editing && <button className="btn-secondary sm" onClick={() => setEditing(true)}>✏️ Edit</button>}
            {activeTab === 'details' && editing && <button className="btn-primary sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : '💾 Save'}</button>}
            {activeTab === 'details' && editing && <button className="btn-secondary sm" onClick={() => setEditing(false)}>Cancel</button>}
            <button className="btn-danger sm" onClick={handleDelete}>🗑 Delete</button>
            <button className="icon-btn close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="task-modal-body">
          <div className="task-modal-left">
            {task.coverColor && <div className="task-modal-cover" style={{ background: task.coverColor }}></div>}

            {/* Title */}
            {editing ? (
              <input className="task-title-input" value={form.title}
                onChange={e => setForm({...form, title: e.target.value})} />
            ) : (
              <h2 className="task-modal-title">{task.title}</h2>
            )}

            {/* Badges */}
            <div className="task-modal-badges">
              <span className="priority-chip large" style={{ color: PRIORITY_COLORS[task.priority], borderColor: PRIORITY_COLORS[task.priority] }}>
                ● {task.priority}
              </span>
              {task.dueDate && (
                <span className={`due-badge ${new Date(task.dueDate) < new Date() ? 'overdue' : ''}`}>
                  📅 {format(new Date(task.dueDate), 'MMM d, yyyy')}
                </span>
              )}
              {task.labels?.map(l => <span key={l} className="label-chip">{l}</span>)}
            </div>

            {/* DETAILS TAB */}
            {activeTab === 'details' && (
              <>
                <div className="section">
                  <div className="section-label">Description</div>
                  {editing ? (
                    <textarea className="task-desc-input" value={form.description}
                      onChange={e => setForm({...form, description: e.target.value})}
                      placeholder="Add a description..." rows={4} />
                  ) : (
                    <p className="task-desc">{task.description || <span className="muted">No description added</span>}</p>
                  )}
                </div>

                {editing && (
                  <div className="edit-fields">
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
                      <input value={form.labels} onChange={e => setForm({...form, labels: e.target.value})} placeholder="design, frontend, bug" />
                    </div>
                  </div>
                )}

                {/* Checklist */}
                <div className="section">
                  <div className="section-label">
                    Checklist {checklist.length > 0 && <span className="muted">({completedChecks}/{checklist.length})</span>}
                  </div>
                  {checklist.length > 0 && (
                    <div className="checklist-progress">
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${(completedChecks/checklist.length)*100}%` }}></div>
                      </div>
                      <span>{Math.round((completedChecks/checklist.length)*100)}%</span>
                    </div>
                  )}
                  {checklist.map((item, idx) => (
                    <div key={idx} className="checklist-item">
                      <input type="checkbox" checked={item.completed} onChange={() => toggleCheck(idx)} />
                      <span className={item.completed ? 'checked' : ''}>{item.text}</span>
                      <button className="icon-btn xs" onClick={() => removeCheck(idx)}>✕</button>
                    </div>
                  ))}
                  <div className="checklist-add">
                    <input value={newCheck} onChange={e => setNewCheck(e.target.value)}
                      placeholder="Add checklist item..."
                      onKeyDown={e => e.key === 'Enter' && addCheck()} />
                    <button className="btn-secondary sm" onClick={addCheck}>Add</button>
                  </div>
                </div>
              </>
            )}

            {/* FILES TAB */}
            {activeTab === 'files' && (
              <div className="section">
                <div className="section-label">Attachments</div>
                <FileUpload task={task} projectId={project._id} onUpdated={handleFileUpdated} />
              </div>
            )}

            {/* COMMENTS TAB */}
            {activeTab === 'comments' && (
              <div className="section">
                <div className="section-label">Comments</div>
                <CommentSection taskId={task._id} projectId={project._id} />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="task-modal-right">
            <div className="sidebar-section">
              <div className="section-label">Assignees</div>
              <input className="member-search" value={memberSearch}
                onChange={e => setMemberSearch(e.target.value)} placeholder="Search members..." />
              {filteredMembers.map(m => {
                const isAssigned = form.assignees.includes(m.user._id);
                return (
                  <div key={m.user._id} className={`assignee-row ${isAssigned ? 'assigned' : ''}`}
                    onClick={() => toggleAssignee(m.user._id)}>
                    <div className="member-avatar sm">
                      {m.user.avatar ? <img src={m.user.avatar} alt="" /> : m.user.name[0].toUpperCase()}
                    </div>
                    <span>{m.user.name}</span>
                    {isAssigned && <span className="check-mark">✓</span>}
                  </div>
                );
              })}
              {editing && (
                <button className="btn-primary sm" style={{marginTop:8, width:'100%'}} onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Assignees'}
                </button>
              )}
            </div>

            <div className="sidebar-section">
              <div className="section-label">Details</div>
              <div className="detail-row"><span>Created by</span><span>{task.createdBy?.name}</span></div>
              <div className="detail-row"><span>Created</span><span>{format(new Date(task.createdAt), 'MMM d, yyyy')}</span></div>
              <div className="detail-row"><span>Column</span>
                <span>{columns.find(c => c.id === task.columnId)?.name || task.columnId}</span>
              </div>
              <div className="detail-row"><span>Attachments</span><span>{task.attachments?.length || 0}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}