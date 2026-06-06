import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const PRIORITY_COLORS = {
  urgent: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#22c55e'
};

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className="analytics-stat-card" style={{ '--card-accent': color }}>
      <div className="analytics-stat-icon">{icon}</div>
      <div className="analytics-stat-value">{value}</div>
      <div className="analytics-stat-label">{label}</div>
      {sub && <div className="analytics-stat-sub">{sub}</div>}
    </div>
  );
}

function SimpleBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="simple-bar-row">
      <div className="simple-bar-label">{label}</div>
      <div className="simple-bar-track">
        <div className="simple-bar-fill" style={{ width: `${pct}%`, background: color || 'var(--accent)' }}></div>
      </div>
      <div className="simple-bar-value">{value}</div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/projects').then(res => {
      setProjects(res.data);
      if (res.data.length > 0) setSelected(res.data[0]._id);
    });
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    api.get(`/analytics/project/${selected}`)
      .then(res => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [selected]);

  const selectedProject = projects.find(p => p._id === selected);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>📊 Analytics</h1>
          <p className="subtitle">Track productivity and task trends</p>
        </div>
        {/* Project selector */}
        <select className="analytics-project-select"
          value={selected || ''}
          onChange={e => setSelected(e.target.value)}>
          {projects.map(p => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>
      </div>

      {projects.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>No projects yet</h3>
          <p>Create a project to see analytics</p>
          <button className="btn-primary" onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
        </div>
      )}

      {loading && (
        <div className="loading-screen" style={{ height: 300 }}>
          <div className="spinner"></div>
        </div>
      )}

      {!loading && data && (
        <div className="analytics-body">

          {/* Stat cards */}
          <div className="analytics-stats-row">
            <StatCard icon="📋" label="Total Tasks" value={data.total} color="var(--accent)" />
            <StatCard icon="✅" label="Completed" value={data.done} sub={`${data.completionRate}% done`} color="#22c55e" />
            <StatCard icon="⚡" label="In Progress" value={data.inProgress} color="#3b82f6" />
            <StatCard icon="🔍" label="In Review" value={data.inReview} color="#f59e0b" />
            <StatCard icon="📝" label="To Do" value={data.todo} color="#64748b" />
            <StatCard icon="⚠️" label="Overdue" value={data.overdue} color="#ef4444" />
          </div>

          <div className="analytics-grid">

            {/* Completion rate */}
            <div className="analytics-card">
              <div className="analytics-card-title">Completion Rate</div>
              <div className="completion-ring-wrap">
                <svg viewBox="0 0 120 120" className="completion-ring">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="var(--bg4)" strokeWidth="12" />
                  <circle cx="60" cy="60" r="50" fill="none"
                    stroke={data.completionRate > 70 ? '#22c55e' : data.completionRate > 40 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="12"
                    strokeDasharray={`${(data.completionRate / 100) * 314} 314`}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                    style={{ transition: 'stroke-dasharray 0.8s ease' }}
                  />
                  <text x="60" y="56" textAnchor="middle" className="ring-pct-text">{data.completionRate}%</text>
                  <text x="60" y="72" textAnchor="middle" className="ring-label-text">complete</text>
                </svg>
              </div>
              <div className="completion-breakdown">
                <div className="cb-row"><span>✅ Done</span><strong>{data.done}</strong></div>
                <div className="cb-row"><span>⚡ Active</span><strong>{data.inProgress + data.inReview}</strong></div>
                <div className="cb-row"><span>📝 Todo</span><strong>{data.todo}</strong></div>
                <div className="cb-row"><span>⚠️ Overdue</span><strong style={{color:'var(--danger)'}}>{data.overdue}</strong></div>
              </div>
            </div>

            {/* Priority breakdown */}
            <div className="analytics-card">
              <div className="analytics-card-title">Tasks by Priority</div>
              <div className="priority-bars">
                {Object.entries(data.byPriority).map(([p, count]) => (
                  <SimpleBar key={p}
                    label={p.charAt(0).toUpperCase() + p.slice(1)}
                    value={count}
                    max={data.total}
                    color={PRIORITY_COLORS[p]}
                  />
                ))}
              </div>
              <div className="priority-legend">
                {Object.entries(PRIORITY_COLORS).map(([p, c]) => (
                  <div key={p} className="priority-legend-item">
                    <span className="priority-legend-dot" style={{ background: c }}></span>
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 7-day trend */}
            <div className="analytics-card wide">
              <div className="analytics-card-title">7-Day Activity Trend</div>
              <div className="trend-chart">
                {data.trend.map((day, i) => {
                  const maxVal = Math.max(...data.trend.map(d => Math.max(d.completed, d.created)), 1);
                  return (
                    <div key={i} className="trend-day">
                      <div className="trend-bars">
                        <div className="trend-bar-wrap" title={`${day.created} created`}>
                          <div className="trend-bar created"
                            style={{ height: `${(day.created / maxVal) * 100}%` }}></div>
                        </div>
                        <div className="trend-bar-wrap" title={`${day.completed} completed`}>
                          <div className="trend-bar completed"
                            style={{ height: `${(day.completed / maxVal) * 100}%` }}></div>
                        </div>
                      </div>
                      <div className="trend-label">{day.date.split(',')[0]}</div>
                    </div>
                  );
                })}
              </div>
              <div className="trend-legend">
                <div className="trend-legend-item"><span className="trend-dot created"></span>Created</div>
                <div className="trend-legend-item"><span className="trend-dot completed"></span>Completed</div>
              </div>
            </div>

            {/* Team productivity */}
            <div className="analytics-card wide">
              <div className="analytics-card-title">Team Productivity</div>
              {data.byMember.length === 0 ? (
                <div className="analytics-empty">No assigned tasks yet</div>
              ) : (
                <div className="team-productivity">
                  {data.byMember.map((m, i) => (
                    <div key={i} className="team-member-row">
                      <div className="team-member-avatar">
                        {m.avatar ? <img src={m.avatar} alt="" /> : m.name[0].toUpperCase()}
                      </div>
                      <div className="team-member-info">
                        <div className="team-member-name">{m.name}</div>
                        <div className="team-member-bar-wrap">
                          <div className="team-member-bar"
                            style={{ width: `${data.total > 0 ? (m.total / data.total) * 100 : 0}%` }}></div>
                        </div>
                      </div>
                      <div className="team-member-stats">
                        <span className="team-tasks-total">{m.total} tasks</span>
                        <span className="team-tasks-done">{m.done} done</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Comments count */}
          <div className="analytics-footer-stat">
            💬 <strong>{data.commentsCount}</strong> total comments across all tasks in this project
          </div>

        </div>
      )}
    </div>
  );
}