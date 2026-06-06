import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../components/shared/ThemeToggle';

const FEATURES = [
  { icon: '🗂', title: 'Kanban Boards', desc: 'Drag and drop tasks across customizable columns. Visualize your entire workflow instantly.' },
  { icon: '⚡', title: 'Real-time Sync', desc: 'WebSocket-powered live updates. Every change appears instantly for all team members.' },
  { icon: '💬', title: 'Comments & Mentions', desc: 'Discuss tasks inline, @mention teammates, keep all communication in context.' },
  { icon: '📎', title: 'File Sharing', desc: 'Upload images and documents directly to tasks. Stored securely in the cloud.' },
  { icon: '📊', title: 'Analytics', desc: 'Track productivity, completion rates, and task trends with beautiful visual charts.' },
  { icon: '📅', title: 'Calendar View', desc: 'See all deadlines on a calendar. Spot overdue tasks and upcoming due dates.' },
  { icon: '🔔', title: 'Smart Notifications', desc: 'Get notified about assignments, comments, and project invites in real-time.' },
  { icon: '🌙', title: 'Dark / Light Themes', desc: 'Three beautiful themes — Dark, Black, and Light. Switch anytime from the sidebar.' },
];

const STEPS = [
  { num: '01', title: 'Create a project', desc: 'Set up your workspace in seconds. Add a name, pick a color, write a description.' },
  { num: '02', title: 'Invite your team', desc: 'Search teammates by name or email and add them instantly with role-based access.' },
  { num: '03', title: 'Add & assign tasks', desc: 'Create tasks with priorities, due dates, labels and assign them to members.' },
  { num: '04', title: 'Ship it', desc: 'Track progress on the board, monitor analytics, and hit every deadline.' },
];

export default function HomePage() {
  const heroRef = useRef();

  useEffect(() => {
    // Animate elements on load
    const el = heroRef.current;
    if (el) {
      el.style.opacity = 0;
      el.style.transform = 'translateY(30px)';
      requestAnimationFrame(() => {
        el.style.transition = 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1)';
        el.style.opacity = 1;
        el.style.transform = 'translateY(0)';
      });
    }
  }, []);

  return (
    <div className="home-page">

      {/* ── Navbar ── */}
      <nav className="home-nav">
        <div className="home-nav-inner">
          <Link to="/" className="home-logo">
            <span className="home-logo-icon">⬡</span>
            <span className="home-logo-text">Collabix</span>
          </Link>
          <div className="home-nav-links">
            <a href="#features" className="home-nav-link">Features</a>
            <a href="#how" className="home-nav-link">How it works</a>
            <Link to="/login" className="home-nav-signin">Sign in</Link>
            <Link to="/register" className="home-nav-cta">Get started →</Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="home-hero">
        <div className="hero-bg-glow"></div>
        <div className="hero-bg-grid"></div>
        <div ref={heroRef} className="hero-content">
          <div className="hero-badge">
            <span className="hero-badge-dot"></span>
            Real-time collaboration for modern teams
          </div>
          <h1 className="hero-title">
            Manage projects.<br />
            <span className="hero-gradient-text">Ship faster together.</span>
          </h1>
          <p className="hero-desc">
            Collabix brings your team's work into one place 
          </p>
          <div className="hero-cta-group">
            <Link to="/register" className="hero-btn-primary">
              Start for free
              <span className="hero-btn-arrow">→</span>
            </Link>
            <Link to="/login" className="hero-btn-secondary">
              Sign in to workspace
            </Link>
          </div>
          <div className="hero-social-proof">
            <div className="hero-avatars">
              {['A','B','C','D','E'].map((l, i) => (
                <div key={i} className="hero-avatar" style={{ background: ['#6366f1','#ec4899','#f59e0b','#22c55e','#3b82f6'][i] }}>
                  {l}
                </div>
              ))}
            </div>
            <span>Join teams already using Collabix</span>
          </div>
        </div>

        {/* Mock board preview */}
        <div className="hero-preview">
          <div className="preview-window">
            <div className="preview-titlebar">
              <span className="preview-dot red"></span>
              <span className="preview-dot yellow"></span>
              <span className="preview-dot green"></span>
              <span className="preview-url">collabix.app/projects/website-redesign</span>
            </div>
            <div className="preview-board">
              {[
                { col: 'To Do', color: '#64748b', tasks: ['Design mockups', 'API endpoints', 'User research'] },
                { col: 'In Progress', color: '#6366f1', tasks: ['Auth system', 'Dashboard UI'] },
                { col: 'Done', color: '#22c55e', tasks: ['Setup DB', 'Deploy server'] },
              ].map((col, i) => (
                <div key={i} className="preview-column">
                  <div className="preview-col-header">
                    <span className="preview-col-dot" style={{ background: col.color }}></span>
                    <span>{col.col}</span>
                    <span className="preview-col-count">{col.tasks.length}</span>
                  </div>
                  {col.tasks.map((t, j) => (
                    <div key={j} className="preview-task">
                      <div className="preview-task-title">{t}</div>
                      <div className="preview-task-meta">
                        <div className="preview-task-avatar">A</div>
                        <div className="preview-task-priority" style={{ background: ['#ef4444','#f59e0b','#22c55e'][j % 3] }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <div className="home-stats-bar">
        {[
          { num: '∞', label: 'Projects' },
          { num: '👥', label: 'Team members' },
          { num: '⚡', label: 'Real-time updates' },
          { num: '🔒', label: 'Secure & private' },
        ].map((s, i) => (
          <div key={i} className="home-stat-item">
            <div className="home-stat-num">{s.num}</div>
            <div className="home-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Features ── */}
      <section className="home-section" id="features">
        <div className="home-section-inner">
          <div className="section-eyebrow">Features</div>
          <h2 className="section-heading">Everything your team needs</h2>
          <p className="section-subheading">Built for modern teams who move fast and collaborate closely.</p>
          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="feature-card" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="feature-card-icon">{f.icon}</div>
                <h3 className="feature-card-title">{f.title}</h3>
                <p className="feature-card-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="home-section home-alt-section" id="how">
        <div className="home-section-inner">
          <div className="section-eyebrow">How it works</div>
          <h2 className="section-heading">Up and running in minutes</h2>
          <div className="steps-grid">
            {STEPS.map((s, i) => (
              <div key={i} className="step-card">
                <div className="step-number">{s.num}</div>
                <h3 className="step-title">{s.title}</h3>
                <p className="step-desc">{s.desc}</p>
                {i < STEPS.length - 1 && <div className="step-connector">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="home-final-cta">
        <div className="final-cta-glow"></div>
        <h2>Ready to build something great?</h2>
        <p>Start for free. No credit card required.</p>
        <Link to="/register" className="hero-btn-primary large">
          Create your workspace →
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer className="home-footer">
        <div className="home-footer-inner">
          <Link to="/" className="home-logo">
            <span className="home-logo-icon">⬡</span>
            <span className="home-logo-text">Collabix</span>
          </Link>
          <p className="home-footer-copy">
            Built with MERN Stack · Socket.io · Cloudinary · MongoDB Atlas
          </p>
          <div className="home-footer-links">
            <Link to="/login">Sign in</Link>
            <Link to="/register">Register</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}