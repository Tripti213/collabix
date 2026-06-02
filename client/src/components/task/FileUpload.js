import React, { useState, useRef } from 'react';
import api from '../../utils/api';

const FILE_ICONS = {
  'image/': '🖼️',
  'application/pdf': '📄',
  'application/msword': '📝',
  'application/vnd.openxmlformats': '📝',
  'text/': '📃',
  'video/': '🎬',
  'application/zip': '🗜️',
};

function getFileIcon(type) {
  for (const [key, icon] of Object.entries(FILE_ICONS)) {
    if (type?.startsWith(key)) return icon;
  }
  return '📎';
}

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function FileUpload({ task, projectId, onUpdated }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [deleting, setDeleting] = useState(null);
  const inputRef = useRef();

  const handleFiles = async (files) => {
    if (!files.length) return;
    setUploading(true);
    setProgress(10);
    try {
      const formData = new FormData();
      Array.from(files).forEach(f => formData.append('files', f));

      const uploadRes = await api.post(`/files/upload/${projectId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => setProgress(Math.round((e.loaded * 80) / e.total)),
      });

      setProgress(90);
      const attachRes = await api.post(`/files/attach/${task._id}`, {
        files: uploadRes.data.files
      });
      setProgress(100);
      onUpdated(attachRes.data);
      setTimeout(() => setProgress(0), 800);
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      alert('Upload failed: ' + msg);
      setProgress(0);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDelete = async (attachment, index) => {
    console.log('Delete called — index:', index, 'file:', attachment?.name);
    if (index === undefined || index === null) {
      alert('Error: could not identify file index');
      return;
    }
    if (!window.confirm('Delete this file?')) return;
    setDeleting(index);
    try {
      const res = await api.delete(`/files/task/${task._id}/file/${index}`);
      onUpdated(res.data);
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      alert('Delete failed: ' + msg);
    } finally {
      setDeleting(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const isImage = (type) => type?.startsWith('image/');

  // Preserve original indexes while separating image/non-image
  const images = task.attachments
    ?.map((file, i) => ({ file, i }))
    .filter(({ file }) => isImage(file.type)) || [];

  const nonImages = task.attachments
    ?.map((file, i) => ({ file, i }))
    .filter(({ file }) => !isImage(file.type)) || [];

  return (
    <div className="file-upload-section">
      {/* Drop Zone */}
      <div
        className={`drop-zone ${dragOver ? 'drag-over' : ''} ${uploading ? 'uploading' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" multiple hidden
          onChange={e => handleFiles(e.target.files)}
          accept="image/*,.pdf,.doc,.docx,.txt,.zip,.mp4" />

        {uploading ? (
          <div className="upload-progress">
            <div className="upload-spinner"></div>
            <span>Uploading... {progress}%</span>
            <div className="progress-bar-wrap">
              <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        ) : (
          <div className="drop-zone-content">
            <span className="drop-icon">📎</span>
            <span className="drop-text">Drop files here or <strong>click to upload</strong></span>
            <span className="drop-hint">Images, PDFs, Docs, Videos — up to 10MB each</span>
          </div>
        )}
      </div>

      {/* Attachments */}
      {task.attachments?.length > 0 && (
        <div className="attachments-list">

          {/* Image Gallery */}
          {images.length > 0 && (
            <div className="image-gallery">
              {images.map(({ file, i }) => (
                <div key={i} className="image-thumb-wrap">
                  <a href={file.url} target="_blank" rel="noreferrer">
                    <img src={file.url} alt={file.name} className="image-thumb" />
                  </a>
                  <button
                    className="thumb-delete"
                    onClick={(e) => { e.stopPropagation(); handleDelete(file, i); }}
                    disabled={deleting === i}
                  >
                    {deleting === i ? '...' : '✕'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Non-image files */}
          {nonImages.map(({ file, i }) => (
            <div key={i} className="attachment-row">
              <span className="file-icon">{getFileIcon(file.type)}</span>
              <div className="file-info">
                <a href={file.url} target="_blank" rel="noreferrer" className="file-name">
                  {file.name}
                </a>
                <span className="file-size">{formatSize(file.size)}</span>
              </div>
              <button
                className="icon-btn danger sm"
                onClick={(e) => { e.stopPropagation(); handleDelete(file, i); }}
                disabled={deleting === i}
              >
                {deleting === i ? '...' : '🗑'}
              </button>
            </div>
          ))}
        </div>
      )}

      {(!task.attachments || task.attachments.length === 0) && (
        <p className="muted" style={{ fontSize: 13, textAlign: 'center', marginTop: 8 }}>
          No files attached yet
        </p>
      )}
    </div>
  );
}