import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import api from '../../utils/api';
import socket from '../../utils/socket';
import { useAuth } from '../../context/AuthContext';

export default function CommentSection({ taskId, projectId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    api.get(`/comments/task/${taskId}`).then(res => setComments(res.data));

    socket.on('comment:added', ({ taskId: tid, comment }) => {
      if (tid === taskId) setComments(prev => [...prev, comment]);
    });
    socket.on('comment:updated', ({ taskId: tid, comment }) => {
      if (tid === taskId) setComments(prev => prev.map(c => c._id === comment._id ? comment : c));
    });
    socket.on('comment:deleted', ({ taskId: tid, commentId }) => {
      if (tid === taskId) setComments(prev => prev.filter(c => c._id !== commentId));
    });

    return () => {
      socket.off('comment:added');
      socket.off('comment:updated');
      socket.off('comment:deleted');
    };
  }, [taskId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    try {
      await api.post('/comments', { content, taskId });
      setContent('');
    } finally { setLoading(false); }
  };

  const handleEdit = async (id) => {
    await api.put(`/comments/${id}`, { content: editContent });
    setEditingId(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete comment?')) return;
    await api.delete(`/comments/${id}`);
  };

  return (
    <div className="comments">
      {comments.map(c => (
        <div key={c._id} className="comment">
          <div className="comment-avatar">
            {c.author?.avatar ? <img src={c.author.avatar} alt="" /> : c.author?.name?.[0]?.toUpperCase()}
          </div>
          <div className="comment-content">
            <div className="comment-header">
              <span className="comment-author">{c.author?.name}</span>
              <span className="comment-time">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
              {c.isEdited && <span className="edited-tag">(edited)</span>}
            </div>
            {editingId === c._id ? (
              <div className="comment-edit">
                <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={2} />
                <div className="comment-edit-actions">
                  <button className="btn-primary sm" onClick={() => handleEdit(c._id)}>Save</button>
                  <button className="btn-secondary sm" onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              <p className="comment-text">{c.content}</p>
            )}
            {c.author?._id === user?._id && !editingId && (
              <div className="comment-actions">
                <button className="text-btn" onClick={() => { setEditingId(c._id); setEditContent(c.content); }}>Edit</button>
                <button className="text-btn danger" onClick={() => handleDelete(c._id)}>Delete</button>
              </div>
            )}
          </div>
        </div>
      ))}
      <form className="comment-form" onSubmit={handleSubmit}>
        <div className="comment-input-wrap">
          <div className="comment-avatar">{user?.name?.[0]?.toUpperCase()}</div>
          <textarea value={content} onChange={e => setContent(e.target.value)}
            placeholder="Write a comment..." rows={2}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }}} />
        </div>
        <button type="submit" className="btn-primary sm" disabled={loading || !content.trim()}>
          {loading ? '...' : 'Comment'}
        </button>
      </form>
    </div>
  );
}
