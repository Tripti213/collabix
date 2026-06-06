import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import ThemeToggle from './ThemeToggle';

const NAV_ITEMS = [
  { icon: '⊞', label: 'Dashboard',     path: '/dashboard' },
  { icon: '📅', label: 'Calendar',      path: '/calendar' },
  { icon: '📊', label: 'Analytics',     path: '/analytics' },
  { icon: '⚡', label: 'Activity',      path: '/activity' },
  { icon: '🔔', label: 'Notifications', path: '/notifications' },
];

export default function Sidebar({ projects = [] }) {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [projectsExpanded, setProjectsExpanded] = useState(true);

  const isActive = (path) => location.pathname === path;

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>

      {/* Top: Logo + collapse */}
      <div className="sidebar-top">
        <Link to="/dashboard" className="sidebar-brand">
          <span className="sidebar-brand-icon">⬡</span>
          {!collapsed && <span className="sidebar-brand-name">Collabix</span>}
        </Link>
        <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {/* Main Nav */}
      <div className="sidebar-section">
        {!collapsed && <div className="sidebar-section-title">MENU</div>}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <Link key={item.path} to={item.path}
              className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
              title={collapsed ? item.label : ''}>
              <span className="sidebar-item-icon">{item.icon}</span>
              {!collapsed && <span className="sidebar-item-label">{item.label}</span>}
              {item.path === '/notifications' && unreadCount > 0 && (
                <span className={`sidebar-notif-badge ${collapsed ? 'collapsed' : ''}`}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </div>

      {/* Projects */}
      <div className="sidebar-section sidebar-projects-section">
        {!collapsed && (
          <div className="sidebar-section-title sidebar-projects-title"
            onClick={() => setProjectsExpanded(!projectsExpanded)}
            style={{ cursor: 'pointer' }}>
            <span>PROJECTS</span>
            <span style={{ fontSize: 10 }}>{projectsExpanded ? '▼' : '▶'}</span>
          </div>
        )}

        {(!collapsed && projectsExpanded) && (
          <div className="sidebar-projects-list">
            {projects.length === 0 ? (
              <div className="sidebar-empty-projects">No projects yet</div>
            ) : (
              projects.slice(0, 10).map(p => (
                <Link key={p._id} to={`/projects/${p._id}`}
                  className={`sidebar-project-item ${location.pathname === `/projects/${p._id}` ? 'active' : ''}`}>
                  <span className="sidebar-project-color" style={{ background: p.color }}></span>
                  <span className="sidebar-project-name">{p.name}</span>
                  <span className="sidebar-project-count">
                    {p.members?.length || 0}
                  </span>
                </Link>
              ))
            )}
            {/* <button className="sidebar-new-project" onClick={() => navigate('/dashboard')}>
              <span>+</span>
              {!collapsed && <span>New Project</span>}
            </button> */}
          </div>
        )}

        {/* Collapsed: just colored dots */}
        {collapsed && projects.slice(0, 6).map(p => (
          <Link key={p._id} to={`/projects/${p._id}`}
            className={`sidebar-item ${location.pathname === `/projects/${p._id}` ? 'active' : ''}`}
            title={p.name}>
            <span className="sidebar-project-dot-icon" style={{ background: p.color }}></span>
          </Link>
        ))}
      </div>

      {/* Bottom: Theme + User */}
      <div className="sidebar-bottom">
        {!collapsed && (
          <div className="sidebar-theme-row">
            <span className="sidebar-item-label">Theme</span>
            <ThemeToggle />
          </div>
        )}

        <div className="sidebar-user-row" title={collapsed ? `${user?.name}\n${user?.email}` : ''}>
          <div className="sidebar-user-avatar">
            {user?.avatar ? <img src={user.avatar} alt="" /> : user?.name?.[0]?.toUpperCase()}
          </div>
          {!collapsed && (
            <>
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{user?.name}</div>
                <div className="sidebar-user-email">{user?.email}</div>
              </div>
              <button className="sidebar-logout-btn"
                onClick={() => { logout(); navigate('/'); }}
                title="Sign out">
                Sign out
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}