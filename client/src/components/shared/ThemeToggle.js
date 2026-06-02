import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
 
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef();
 
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
 
  const themes = [
    { id: 'dark',  label: 'Dark',  icon: '🌙' },
    { id: 'black', label: 'Black', icon: '⬛' },
    { id: 'light', label: 'Light', icon: '☀️' },
  ];
 
  const current = themes.find(t => t.id === theme);
 
  return (
    <div className="theme-toggle-wrap" ref={ref}>
      <button className="theme-toggle-btn" onClick={() => setOpen(!open)} title="Change theme">
        <span>{current.icon}</span>
      </button>
      {open && (
        <div className="theme-dropdown">
          {themes.map(t => (
            <button key={t.id}
              className={`theme-option ${theme === t.id ? 'active' : ''}`}
              onClick={() => { toggleTheme(t.id); setOpen(false); }}>
              <span>{t.icon}</span>
              <span>{t.label}</span>
              {theme === t.id && <span className="theme-check">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}