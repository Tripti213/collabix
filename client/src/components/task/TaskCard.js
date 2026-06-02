import React from 'react';
import { format } from 'date-fns';

const PRIORITY_CONFIG = {
  urgent: { color: '#ef4444', label: 'Urgent' },
  high:   { color: '#f97316', label: 'High' },
  medium: { color: '#f59e0b', label: 'Medium' },
  low:    { color: '#22c55e', label: 'Low' },
};

export default function TaskCard({ task, isDragging, onClick }) {
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const completedChecks = task.checklist?.filter(c => c.completed).length || 0;
  const totalChecks = task.checklist?.length || 0;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
  const attachCount = task.attachments?.length || 0;

  return (
    <div className={`task-card ${isDragging ? 'dragging' : ''}`} onClick={onClick}>
      {task.coverColor && <div className="task-cover" style={{ background: task.coverColor }}></div>}
      <div className="task-card-body">
        {task.labels?.length > 0 && (
          <div className="task-labels">
            {task.labels.map(l => <span key={l} className="label-chip">{l}</span>)}
          </div>
        )}
        <div className="task-title">{task.title}</div>
        <div className="task-meta">
          <span className="priority-chip" style={{ color: priority.color, borderColor: priority.color }}>
            {priority.label}
          </span>
          {task.dueDate && (
            <span className={`due-date ${isOverdue ? 'overdue' : ''}`}>
              📅 {format(new Date(task.dueDate), 'MMM d')}
            </span>
          )}
        </div>
        <div className="task-footer">
          <div className="task-assignees">
            {task.assignees?.slice(0, 3).map(a => (
              <div key={a._id} className="member-avatar xs" title={a.name}>
                {a.avatar ? <img src={a.avatar} alt="" /> : a.name[0].toUpperCase()}
              </div>
            ))}
          </div>
          <div className="task-indicators">
            {totalChecks > 0 && (
              <span className={`checklist-badge ${completedChecks === totalChecks ? 'done' : ''}`}>
                ✓ {completedChecks}/{totalChecks}
              </span>
            )}
            {attachCount > 0 && (
              <span className="attachment-badge">📎 {attachCount}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}