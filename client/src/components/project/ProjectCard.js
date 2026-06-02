import React from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

export default function ProjectCard({ project, onClick, onDelete }) {
  const { user } = useAuth();
  const isOwner = project.owner._id === user?._id;

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this project?')) return;
    await api.delete(`/projects/${project._id}`);
    onDelete(project._id);
  };

  return (
    <div className="project-card" onClick={onClick} style={{ '--proj-color': project.color }}>
      <div className="project-card-accent"></div>
      <div className="project-card-body">
        <div className="project-card-top">
          <h3>{project.name}</h3>
          {isOwner && (
            <button className="icon-btn danger" onClick={handleDelete} title="Delete">🗑</button>
          )}
        </div>
        {project.description && <p className="project-desc">{project.description}</p>}
        <div className="project-card-footer">
          <div className="member-stack">
            {project.members.slice(0,4).map(m => (
              <div key={m.user._id} className="member-avatar" title={m.user.name}>
                {m.user.avatar ? <img src={m.user.avatar} alt="" /> : m.user.name[0].toUpperCase()}
              </div>
            ))}
            {project.members.length > 4 && <div className="member-avatar extra">+{project.members.length - 4}</div>}
          </div>
          <span className="proj-owner-badge">{isOwner ? 'Owner' : 'Member'}</span>
        </div>
      </div>
    </div>
  );
}
