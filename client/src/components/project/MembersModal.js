import React, { useState } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export default function MembersModal({ project, onClose, onUpdated }) {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const isOwner = project.owner._id === user?._id;

  const handleSearch = async (e) => {
    setSearch(e.target.value);
    if (e.target.value.length < 2) { setResults([]); return; }
    const res = await api.get(`/users/search?q=${e.target.value}`);
    setResults(res.data.filter(u => !project.members.some(m => m.user._id === u._id)));
  };

  const addMember = async (userId) => {
    setLoading(true);
    try {
      const res = await api.post(`/projects/${project._id}/members`, { userId });
      onUpdated(res.data);
      setSearch(''); setResults([]);
    } finally { setLoading(false); }
  };

  const removeMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    const res = await api.delete(`/projects/${project._id}/members/${userId}`);
    onUpdated(res.data);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Members ({project.members.length})</h2>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        {isOwner && (
          <div className="form-group" style={{ position: 'relative' }}>
            <label>Add member</label>
            <input value={search} onChange={handleSearch} placeholder="Search by name or email..." />
            {results.length > 0 && (
              <div className="search-dropdown">
                {results.map(u => (
                  <div key={u._id} className="search-result" onClick={() => addMember(u._id)}>
                    <div className="member-avatar sm">{u.name[0].toUpperCase()}</div>
                    <div>
                      <div className="sr-name">{u.name}</div>
                      <div className="sr-email">{u.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="members-list">
          {project.members.map(m => (
            <div key={m.user._id} className="member-row">
              <div className="member-avatar">{m.user.avatar ? <img src={m.user.avatar} alt="" /> : m.user.name[0].toUpperCase()}</div>
              <div className="member-info">
                <div className="member-name">{m.user.name} {m.user._id === project.owner._id && <span className="owner-tag">Owner</span>}</div>
                <div className="member-email">{m.user.email}</div>
              </div>
              <span className={`role-badge ${m.role}`}>{m.role}</span>
              {isOwner && m.user._id !== project.owner._id && (
                <button className="icon-btn danger sm" onClick={() => removeMember(m.user._id)}>✕</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
