import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '../context/NotificationContext';

const NOTIF_ICONS = {
  task_assigned: '📌',
  comment_added: '💬',
  project_invite: '👥',
  mention: '@',
  task_moved: '🔀',
};

const NOTIF_COLORS = {
  task_assigned: '#6366f1',
  comment_added: '#f59e0b',
  project_invite: '#22c55e',
  mention: '#ec4899',
  task_moved: '#3b82f6',
};

export default function NotificationsPage() {
  const { notifications, markRead, markAllRead, unreadCount } = useNotifications();
  const navigate = useNavigate();

  const handleClick = (n) => {
    markRead(n._id);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>🔔 Notifications</h1>
          <p className="subtitle">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="btn-secondary" onClick={markAllRead}>
            ✓ Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔔</div>
          <h3>No notifications yet</h3>
          <p>You'll be notified when someone assigns you a task, comments, or invites you to a project.</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map(n => (
            <div key={n._id}
              className={`notification-row ${!n.isRead ? 'unread' : ''}`}
              onClick={() => handleClick(n)}>
              <div className="notification-icon-wrap"
                style={{ background: `${NOTIF_COLORS[n.type]}20`, border: `1px solid ${NOTIF_COLORS[n.type]}40` }}>
                <span>{NOTIF_ICONS[n.type] || '🔔'}</span>
              </div>
              <div className="notification-content">
                <div className="notification-title">{n.title}</div>
                <div className="notification-message">{n.message}</div>
                <div className="notification-time">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                </div>
              </div>
              {!n.isRead && <div className="notification-unread-dot"></div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}