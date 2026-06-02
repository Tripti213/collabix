import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import ThemeToggle from './ThemeToggle';
import { formatDistanceToNow } from 'date-fns';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const navigate = useNavigate();
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setShowNotifs(false);
        setShowUser(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const NOTIF_ICONS = {
    task_assigned: '📌',
    comment_added: '💬',
    project_invite: '👥',
    mention: '@',
    task_moved: '🔀',
  };

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="nav-logo">
        <span className="logo-icon">⬡</span>
        <span className="logo-text">Collabix</span>
      </Link>

      <div className="nav-right" ref={ref}>
        <ThemeToggle />

        {/* Notifications */}
        <div className="notif-wrap">
          <button className="icon-btn nav-icon-btn" onClick={() => { setShowNotifs(!showNotifs); setShowUser(false); }}>
            🔔
            {unreadCount > 0 && <span className="badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
          </button>
          {showNotifs && (
            <div className="dropdown notif-dropdown">
              <div className="dropdown-header">
                <span>Notifications</span>
                {unreadCount > 0 && <button className="text-btn" onClick={markAllRead}>Mark all read</button>}
              </div>
              <div className="notif-list">
                {notifications.length === 0 ? (
                  <div className="notif-empty">You're all caught up! 🎉</div>
                ) : notifications.slice(0, 15).map(n => (
                  <div key={n._id} className={`notif-item ${!n.isRead ? 'unread' : ''}`}
                    onClick={() => { markRead(n._id); if (n.link) navigate(n.link); setShowNotifs(false); }}>
                    <div className="notif-icon">{NOTIF_ICONS[n.type] || '🔔'}</div>
                    <div className="notif-content">
                      <div className="notif-title">{n.title}</div>
                      <div className="notif-msg">{n.message}</div>
                      <div className="notif-time">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</div>
                    </div>
                    {!n.isRead && <div className="notif-dot"></div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="user-wrap">
          <button className="avatar-btn" onClick={() => { setShowUser(!showUser); setShowNotifs(false); }}>
            {user?.avatar ? <img src={user.avatar} alt="" /> : <span>{user?.name?.[0]?.toUpperCase()}</span>}
          </button>
          {showUser && (
            <div className="dropdown user-dropdown">
              <div className="dropdown-user-info">
                <div className="user-avatar-lg">
                  {user?.avatar ? <img src={user.avatar} alt="" /> : user?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="user-name">{user?.name}</div>
                  <div className="user-email">{user?.email}</div>
                </div>
              </div>
              <button className="dropdown-item danger" onClick={() => { logout(); navigate('/login'); }}>
                🚪 Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}