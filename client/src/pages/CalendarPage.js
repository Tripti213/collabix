import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, isToday, isPast, addMonths, subMonths } from 'date-fns';
import api from '../utils/api';

const PRIORITY_COLORS = {
  urgent: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#22c55e'
};

export default function CalendarPage() {
  const [tasks, setTasks] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('calendar'); // calendar | list
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/tasks/due/all')
      .then(res => setTasks(res.data))
      .finally(() => setLoading(false));
  }, []);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const getTasksForDay = (day) =>
    tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), day));

  const overdueTasks = tasks.filter(t => t.dueDate && isPast(new Date(t.dueDate)) && t.columnId !== 'done');
  const upcomingTasks = tasks.filter(t => {
    if (!t.dueDate) return false;
    const due = new Date(t.dueDate);
    const now = new Date();
    const in7 = new Date(); in7.setDate(in7.getDate() + 7);
    return due >= now && due <= in7;
  });

  const selectedTasks = selectedDay ? getTasksForDay(selectedDay) : [];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>📅 Calendar</h1>
          <p className="subtitle">All your task deadlines in one view</p>
        </div>
        <div className="page-header-actions">
          <div className="view-toggle">
            <button className={`view-tab ${view === 'calendar' ? 'active' : ''}`} onClick={() => setView('calendar')}>📅 Calendar</button>
            <button className={`view-tab ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>📋 List</button>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="calendar-summary">
        <div className="cal-summary-card overdue">
          <div className="cal-summary-num">{overdueTasks.length}</div>
          <div className="cal-summary-label">Overdue</div>
        </div>
        <div className="cal-summary-card upcoming">
          <div className="cal-summary-num">{upcomingTasks.length}</div>
          <div className="cal-summary-label">Due this week</div>
        </div>
        <div className="cal-summary-card total">
          <div className="cal-summary-num">{tasks.length}</div>
          <div className="cal-summary-label">Total with deadlines</div>
        </div>
      </div>

      {view === 'calendar' ? (
        <div className="calendar-layout">
          {/* Calendar */}
          <div className="calendar-main">
            {/* Month nav */}
            <div className="calendar-nav">
              <button className="btn-secondary sm" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>←</button>
              <h2>{format(currentDate, 'MMMM yyyy')}</h2>
              <button className="btn-secondary sm" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>→</button>
              <button className="btn-secondary sm" onClick={() => setCurrentDate(new Date())}>Today</button>
            </div>

            {/* Day headers */}
            <div className="calendar-grid">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                <div key={d} className="calendar-day-header">{d}</div>
              ))}

              {/* Days */}
              {days.map((day, i) => {
                const dayTasks = getTasksForDay(day);
                const isSelected = selectedDay && isSameDay(day, selectedDay);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const hasOverdue = dayTasks.some(t => t.columnId !== 'done');

                return (
                  <div key={i}
                    className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday(day) ? 'today' : ''} ${isSelected ? 'selected' : ''} ${dayTasks.length > 0 ? 'has-tasks' : ''}`}
                    onClick={() => setSelectedDay(isSameDay(day, selectedDay) ? null : day)}>
                    <div className="calendar-day-num">{format(day, 'd')}</div>
                    <div className="calendar-day-tasks">
                      {dayTasks.slice(0, 3).map((t, j) => (
                        <div key={j} className={`cal-task-chip ${t.columnId === 'done' ? 'done' : isPast(new Date(t.dueDate)) ? 'overdue' : ''}`}
                          style={{ borderLeftColor: PRIORITY_COLORS[t.priority] }}
                          onClick={(e) => { e.stopPropagation(); navigate(`/projects/${t.project?._id || t.project}`); }}>
                          {t.title}
                        </div>
                      ))}
                      {dayTasks.length > 3 && (
                        <div className="cal-more">+{dayTasks.length - 3} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected day panel */}
          <div className="calendar-side">
            {selectedDay ? (
              <>
                <h3>{format(selectedDay, 'EEEE, MMM d')}</h3>
                {selectedTasks.length === 0 ? (
                  <div className="cal-no-tasks">No tasks due this day 🎉</div>
                ) : (
                  <div className="cal-task-list">
                    {selectedTasks.map((t, i) => (
                      <div key={i} className="cal-task-card"
                        onClick={() => navigate(`/projects/${t.project?._id || t.project}`)}>
                        <div className="cal-task-priority" style={{ background: PRIORITY_COLORS[t.priority] }}></div>
                        <div className="cal-task-info">
                          <div className="cal-task-title">{t.title}</div>
                          <div className="cal-task-project">{t.project?.name}</div>
                          <div className={`cal-task-status ${t.columnId}`}>{t.columnId}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="cal-select-hint">
                <div style={{ fontSize: 32 }}>📅</div>
                <p>Click a day to see tasks due</p>
              </div>
            )}

            {/* Upcoming */}
            {overdueTasks.length > 0 && (
              <div className="cal-overdue-section">
                <div className="section-label" style={{ color: '#ef4444' }}>⚠️ OVERDUE</div>
                {overdueTasks.slice(0, 5).map((t, i) => (
                  <div key={i} className="cal-task-card overdue"
                    onClick={() => navigate(`/projects/${t.project?._id || t.project}`)}>
                    <div className="cal-task-priority" style={{ background: '#ef4444' }}></div>
                    <div className="cal-task-info">
                      <div className="cal-task-title">{t.title}</div>
                      <div className="cal-task-project">{t.project?.name}</div>
                      <div className="cal-task-due">Due {format(new Date(t.dueDate), 'MMM d')}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* List view */
        <div className="task-due-list">
          {['overdue', 'today', 'this_week', 'later'].map(section => {
            const sectionTasks = tasks.filter(t => {
              if (!t.dueDate) return false;
              const due = new Date(t.dueDate);
              const now = new Date(); now.setHours(0,0,0,0);
              const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
              const nextWeek = new Date(now); nextWeek.setDate(nextWeek.getDate() + 7);
              if (section === 'overdue') return due < now && t.columnId !== 'done';
              if (section === 'today') return isSameDay(due, new Date());
              if (section === 'this_week') return due >= tomorrow && due <= nextWeek;
              if (section === 'later') return due > nextWeek;
              return false;
            });
            if (sectionTasks.length === 0) return null;
            const labels = { overdue: '⚠️ Overdue', today: '📌 Due Today', this_week: '📅 This Week', later: '🔮 Later' };
            return (
              <div key={section} className="due-section">
                <div className="due-section-label">{labels[section]}</div>
                {sectionTasks.map((t, i) => (
                  <div key={i} className="due-task-row"
                    onClick={() => navigate(`/projects/${t.project?._id || t.project}`)}>
                    <div className="due-priority-dot" style={{ background: PRIORITY_COLORS[t.priority] }}></div>
                    <div className="due-task-info">
                      <div className="due-task-title">{t.title}</div>
                      <div className="due-task-meta">
                        <span className="due-project-name">{t.project?.name}</span>
                        <span className="due-date-chip">{format(new Date(t.dueDate), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                    <span className={`role-badge ${t.columnId}`}>{t.columnId}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}