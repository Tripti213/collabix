import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import api from '../utils/api';
import socket from '../utils/socket';

const ACTIVITY_ICONS = {
  task_created: '✅',
  task_moved: '🔀',
  task_completed: '🎉',
  task_deleted: '🗑',
  comment_added: '💬',
  member_added: '👥',
  member_removed: '👤',
  project_created: '🚀',
  file_uploaded: '📎',
};

const ACTIVITY_COLORS = {
  task_created: '#6366f1',
  task_moved: '#3b82f6',
  task_completed: '#22c55e',
  task_deleted: '#ef4444',
  comment_added: '#f59e0b',
  member_added: '#8b5cf6',
  project_created: '#ec4899',
  file_uploaded: '#06b6d4',
};

export default function ActivityPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/activity/feed')
      .then(res => setActivities(res.data))
      .finally(() => setLoading(false));

    socket.on('activity:new', () => {
      api.get('/activity/feed').then(res => setActivities(res.data));
    });
    return () => socket.off('activity:new');
  }, []);

  const filtered = filter === 'all' ? activities
    : activities.filter(a => a.type === filter);

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'task_created', label: 'Created' },
    { id: 'task_completed', label: 'Completed' },
    { id: 'task_moved', label: 'Moved' },
    { id: 'comment_added', label: 'Comments' },
    { id: 'member_added', label: 'Members' },
  ];

  // Group by date
  const grouped = filtered.reduce((acc, activity) => {
    const date = new Date(activity.createdAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    if (!acc[date]) acc[date] = [];
    acc[date].push(activity);
    return acc;
  }, {});

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>⚡ Activity Feed</h1>
          <p className="subtitle">Everything happening across your projects</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        {filters.map(f => (
          <button key={f.id} className={`filter-btn ${filter === f.id ? 'active' : ''}`}
            onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-screen" style={{ height: 300 }}><div className="spinner"></div></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">⚡</div>
          <h3>No activity yet</h3>
          <p>Start creating tasks and collaborating to see your activity feed</p>
        </div>
      ) : (
        <div className="activity-feed">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date} className="activity-group">
              <div className="activity-date-label">{date}</div>
              <div className="activity-list">
                {items.map((activity, i) => (
                  <div key={activity._id || i} className="activity-item">
                    <div className="activity-timeline-dot"
                      style={{ background: ACTIVITY_COLORS[activity.type] || '#6366f1' }}>
                      <span>{ACTIVITY_ICONS[activity.type] || '●'}</span>
                    </div>
                    <div className="activity-content">
                      <div className="activity-user">
                        <div className="activity-avatar">
                          {activity.user?.avatar
                            ? <img src={activity.user.avatar} alt="" />
                            : activity.user?.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="activity-message">{activity.message}</div>
                          {activity.project && (
                            <div className="activity-project">
                              <span className="activity-project-dot"
                                style={{ background: activity.project?.color || '#6366f1' }}></span>
                              {activity.project?.name}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="activity-time">
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}