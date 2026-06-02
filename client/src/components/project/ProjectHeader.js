import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProjectHeader({ project, activeView, onViewChange, onMembersClick }) {
  const navigate = useNavigate();

  return (
    <div className="project-header">
      <div className="project-header-left">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>← Back</button>
        <div className="project-title-area">
          <div className="project-color-dot" style={{ background: project.color }}></div>
          <div>
            <h1>{project.name}</h1>
            {project.description && <p className="project-subtitle">{project.description}</p>}
          </div>
        </div>
      </div>

      <div className="project-header-center">
        <div className="view-tabs">
          <button className={`view-tab ${activeView === 'board' ? 'active' : ''}`}
            onClick={() => onViewChange('board')}>
            🗂 Board
          </button>
          <button className={`view-tab ${activeView === 'files' ? 'active' : ''}`}
            onClick={() => onViewChange('files')}>
            📁 Files
          </button>
        </div>
      </div>

      <div className="project-header-right">
        <div className="member-stack">
          {project.members?.slice(0, 5).map(m => (
            <div key={m.user._id} className="member-avatar" title={`${m.user.name} (${m.role})`}>
              {m.user.avatar ? <img src={m.user.avatar} alt="" /> : m.user.name[0].toUpperCase()}
            </div>
          ))}
        </div>
        <button className="btn-secondary" onClick={onMembersClick}>👥 Members</button>
      </div>
    </div>
  );
}