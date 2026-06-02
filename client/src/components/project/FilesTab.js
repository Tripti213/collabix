import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const FILE_ICONS = {
  'image/': '🖼️', 'application/pdf': '📄',
  'application/msword': '📝', 'text/': '📃',
  'video/': '🎬', 'application/zip': '🗜️',
};

function getFileIcon(type) {
  for (const [key, icon] of Object.entries(FILE_ICONS)) {
    if (type?.startsWith(key)) return icon;
  }
  return '📎';
}

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function FilesTab({ projectId }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get(`/files/project/${projectId}`)
      .then(res => setFiles(res.data))
      .finally(() => setLoading(false));
  }, [projectId]);

  const filtered = files.filter(f => {
    if (filter === 'images') return f.type?.startsWith('image/');
    if (filter === 'docs') return !f.type?.startsWith('image/') && !f.type?.startsWith('video/');
    if (filter === 'videos') return f.type?.startsWith('video/');
    return true;
  });

  if (loading) return <div className="files-loading"><div className="spinner"></div></div>;

  return (
    <div className="files-tab">
      <div className="files-header">
        <h3>Project Files <span className="col-count">{files.length}</span></h3>
        <div className="file-filters">
          {['all', 'images', 'docs', 'videos'].map(f => (
            <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state" style={{ padding: '40px' }}>
          <div className="empty-icon">📁</div>
          <h3>No files yet</h3>
          <p>Upload files inside any task to see them here</p>
        </div>
      ) : (
        <>
          {/* Image grid */}
          {filter !== 'docs' && filter !== 'videos' && (
            <div className="files-image-grid">
              {filtered.filter(f => f.type?.startsWith('image/')).map((f, i) => (
                <div key={i} className="files-image-card">
                  <a href={f.url} target="_blank" rel="noreferrer">
                    <img src={f.url} alt={f.name} />
                  </a>
                  <div className="files-image-info">
                    <span className="files-image-name">{f.name}</span>
                    <span className="files-task-name">in: {f.taskTitle}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Non-image list */}
          <div className="files-list">
            {filtered.filter(f => !f.type?.startsWith('image/')).map((f, i) => (
              <div key={i} className="files-list-row">
                <span className="file-icon-lg">{getFileIcon(f.type)}</span>
                <div className="files-list-info">
                  <a href={f.url} target="_blank" rel="noreferrer" className="file-name">{f.name}</a>
                  <span className="files-task-name">in task: <strong>{f.taskTitle}</strong></span>
                </div>
                <span className="file-size">{formatSize(f.size)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}