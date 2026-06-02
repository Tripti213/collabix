import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import ProjectCard from '../components/project/ProjectCard';
import CreateProjectModal from '../components/project/CreateProjectModal';

export default function DashboardPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleProjectCreated = (project) => {
    setProjects(prev => [project, ...prev]);
    setShowCreate(false);
  };

  const handleProjectDeleted = (id) => {
    setProjects(prev => prev.filter(p => p._id !== id));
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="subtitle">Here's what's happening across your projects</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          + New Project
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-num">{projects.length}</div>
          <div className="stat-label">Projects</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{projects.filter(p => p.owner._id === user?._id).length}</div>
          <div className="stat-label">Owned</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{projects.filter(p => p.owner._id !== user?._id).length}</div>
          <div className="stat-label">Shared</div>
        </div>
      </div>

      {loading ? (
        <div className="projects-grid">
          {[1,2,3].map(i => <div key={i} className="skeleton-card"></div>)}
        </div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No projects yet</h3>
          <p>Create your first project to get started</p>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>Create Project</button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(p => (
            <ProjectCard key={p._id} project={p} onDelete={handleProjectDeleted}
              onClick={() => navigate(`/projects/${p._id}`)} />
          ))}
        </div>
      )}

      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} onCreate={handleProjectCreated} />}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
