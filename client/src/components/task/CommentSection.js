import React, { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import api from '../../utils/api';
import socket from '../../utils/socket';
import { useAuth } from '../../context/AuthContext';

// Renders comment text with @mentions highlighted
function CommentText({ content }) {
  const parts = content.split(/(@\w+)/g);
  return (
    <p className="comment-text">
      {parts.map((part, i) =>
        part.startsWith('@')
          ? <span key={i} className="mention-highlight">{part}</span>
          : part
      )}
    </p>
  );
}

export default function CommentSection({ taskId, projectId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');

  // Mention state
  const [members, setMembers] = useState([]);
  const [mentionSearch, setMentionSearch] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionedUsers, setMentionedUsers] = useState([]); // user ids to notify
  const [cursorPos, setCursorPos] = useState(0);
  const textareaRef = useRef();
  const mentionBoxRef = useRef();

  // Load project members for mention suggestions
  useEffect(() => {
    api.get(`/projects/${projectId}`).then(res => {
      setMembers(res.data.members?.map(m => m.user) || []);
    }).catch(() => {});
  }, [projectId]);

  // Load comments + socket
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

  // Close mention box when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (mentionBoxRef.current && !mentionBoxRef.current.contains(e.target)) {
        setShowMentions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Detect @ typing
  const handleContentChange = (e) => {
    const val = e.target.value;
    const pos = e.target.selectionStart;
    setContent(val);
    setCursorPos(pos);

    // Find if we're typing after an @
    const textUpToCursor = val.slice(0, pos);
    const atMatch = textUpToCursor.match(/@(\w*)$/);

    if (atMatch) {
      setMentionSearch(atMatch[1].toLowerCase());
      setShowMentions(true);
    } else {
      setShowMentions(false);
      setMentionSearch('');
    }
  };

  // Filter members by search
  const filteredMembers = members.filter(m =>
    m._id !== user?._id &&
    (mentionSearch === '' || m.name.toLowerCase().includes(mentionSearch))
  );

  // Insert mention into textarea
  const insertMention = (member) => {
    const textUpToCursor = content.slice(0, cursorPos);
    const atIndex = textUpToCursor.lastIndexOf('@');
    const before = content.slice(0, atIndex);
    const after = content.slice(cursorPos);
    const newContent = `${before}@${member.name} ${after}`;

    setContent(newContent);
    setShowMentions(false);
    setMentionSearch('');

    // Track mentioned user IDs for notification
    if (!mentionedUsers.includes(member._id)) {
      setMentionedUsers(prev => [...prev, member._id]);
    }

    // Refocus textarea
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = atIndex + member.name.length + 2;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    try {
      await api.post('/comments', {
        content,
        taskId,
        mentions: mentionedUsers  // send to backend for notifications
      });
      setContent('');
      setMentionedUsers([]);
    } finally { setLoading(false); }
  };

  const handleEdit = async (id) => {
    await api.put(`/comments/${id}`, { content: editContent });
    setEditingId(null);
    setEditContent('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete comment?')) return;
    await api.delete(`/comments/${id}`);
  };

  const handleKeyDown = (e) => {
    if (showMentions && filteredMembers.length > 0) {
      // Let Enter select first mention
      if (e.key === 'Enter' && showMentions) {
        e.preventDefault();
        insertMention(filteredMembers[0]);
        return;
      }
      if (e.key === 'Escape') {
        setShowMentions(false);
        return;
      }
    }
    // Submit on Enter (without shift)
    if (e.key === 'Enter' && !e.shiftKey && !showMentions) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="comments">
      {/* Comment list */}
      {comments.length === 0 && (
        <div className="comments-empty">No comments yet — be the first!</div>
      )}

      {comments.map(c => (
        <div key={c._id} className="comment">
          <div className="comment-avatar">
            {c.author?.avatar
              ? <img src={c.author.avatar} alt="" />
              : c.author?.name?.[0]?.toUpperCase()}
          </div>
          <div className="comment-content">
            <div className="comment-header">
              <span className="comment-author">{c.author?.name}</span>
              <span className="comment-time">
                {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
              </span>
              {c.isEdited && <span className="edited-tag">(edited)</span>}
            </div>

            {editingId === c._id ? (
              <div className="comment-edit">
                <textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  rows={2}
                  autoFocus
                />
                <div className="comment-edit-actions">
                  <button className="btn-primary sm" onClick={() => handleEdit(c._id)}>Save</button>
                  <button className="btn-secondary sm" onClick={() => { setEditingId(null); setEditContent(''); }}>Cancel</button>
                </div>
              </div>
            ) : (
              <CommentText content={c.content} />
            )}

            {c.author?._id === user?._id && editingId !== c._id && (
              <div className="comment-actions">
                <button className="text-btn" onClick={() => { setEditingId(c._id); setEditContent(c.content); }}>Edit</button>
                <button className="text-btn danger" onClick={() => handleDelete(c._id)}>Delete</button>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Comment input */}
      <form className="comment-form" onSubmit={handleSubmit}>
        <div className="comment-input-wrap">
          <div className="comment-avatar">{user?.name?.[0]?.toUpperCase()}</div>
          <div className="comment-textarea-wrap" ref={mentionBoxRef}>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              placeholder="Write a comment... type @ to mention someone"
              rows={2}
            />

            {/* Mention dropdown */}
            {showMentions && filteredMembers.length > 0 && (
              <div className="mention-dropdown">
                <div className="mention-dropdown-header">Mention a teammate</div>
                {filteredMembers.map(m => (
                  <div key={m._id} className="mention-option"
                    onMouseDown={(e) => { e.preventDefault(); insertMention(m); }}>
                    <div className="mention-avatar">
                      {m.avatar ? <img src={m.avatar} alt="" /> : m.name[0].toUpperCase()}
                    </div>
                    <div className="mention-info">
                      <div className="mention-name">{m.name}</div>
                      <div className="mention-email">{m.email}</div>
                    </div>
                    <span className="mention-tag">@{m.name.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="comment-form-footer">
          <span className="comment-hint">Enter to submit · Shift+Enter for new line · @ to mention</span>
          <button type="submit" className="btn-primary sm" disabled={loading || !content.trim()}>
            {loading ? '...' : 'Comment'}
          </button>
        </div>
      </form>
    </div>
  );
}