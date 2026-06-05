import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import api from '../utils/api';
import socket from '../utils/socket';
import TaskCard from '../components/task/TaskCard';
import TaskModal from '../components/task/TaskModal';
import CreateTaskModal from '../components/task/CreateTaskModal';
import ProjectHeader from '../components/project/ProjectHeader';
import MembersModal from '../components/project/MembersModal';
import FilesTab from '../components/project/FilesTab';

// Safe column parser — handles string, array, or undefined
function parseColumns(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return []; }
  }
  return [];
}

export default function ProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [createColumn, setCreateColumn] = useState(null);
  const [showMembers, setShowMembers] = useState(false);
  const [activeView, setActiveView] = useState('board');

  const fetchData = useCallback(async () => {
    try {
      const [projRes, taskRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks/project/${id}`)
      ]);
      setProject(projRes.data);
      setTasks(taskRes.data);
    } catch (err) {
      if (err.response?.status === 403 || err.response?.status === 404) navigate('/dashboard');
    } finally { setLoading(false); }
  }, [id, navigate]);

  useEffect(() => {
    fetchData();
    socket.emit('join_project', id);

    socket.on('task:created', (task) => setTasks(prev => [...prev, task]));
    socket.on('task:updated', (task) => {
      console.log('task:updated received:', task._id);
      setTasks(prev => prev.map(t => t._id === task._id ? task : t));
      setSelectedTask(prev => prev?._id === task._id ? task : prev);
    });
    socket.on('task:moved', (task) => setTasks(prev => prev.map(t => t._id === task._id ? task : t)));
    socket.on('task:deleted', (taskId) => {
      setTasks(prev => prev.filter(t => t._id !== taskId));
      setSelectedTask(prev => prev?._id === taskId ? null : prev);
    });
    socket.on('project:updated', (proj) => setProject(proj));

    return () => {
      socket.emit('leave_project', id);
      ['task:created','task:updated','task:moved','task:deleted','project:updated'].forEach(e => socket.off(e));
    };
  }, [id, fetchData]);

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    setTasks(prev => prev.map(t => t._id === draggableId
      ? { ...t, columnId: destination.droppableId, order: destination.index } : t));

    try {
      await api.put(`/tasks/${draggableId}/move`, {
        columnId: destination.droppableId,
        order: destination.index
      });
    } catch (err) {
      console.error('Move failed:', err.message);
      fetchData(); // revert on error
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
  if (!project) return null;

  const columns = parseColumns(project.columns);

  return (
    <div className="project-page">
      <ProjectHeader
        project={project}
        activeView={activeView}
        onViewChange={setActiveView}
        onMembersClick={() => setShowMembers(true)}
        onProjectUpdated={setProject}
      />

      {activeView === 'files' ? (
        <div style={{ padding: '24px 32px' }}>
          <FilesTab projectId={id} />
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="board">
            {columns
              .sort((a, b) => a.order - b.order)
              .map(col => {
                const colTasks = tasks
                  .filter(t => t.columnId === col.id)
                  .sort((a, b) => a.order - b.order);

                return (
                  <div key={col.id} className="column">
                    <div className="column-header" style={{ '--col-color': col.color }}>
                      <div className="col-title">
                        <span className="col-dot"></span>
                        <span>{col.name}</span>
                        <span className="col-count">{colTasks.length}</span>
                      </div>
                      <button className="col-add-btn" onClick={() => setCreateColumn(col.id)}>+</button>
                    </div>

                    <Droppable droppableId={col.id} isDropDisabled={false}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`column-body ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                        >
                          {colTasks.map((task, index) => (
                            <Draggable key={task._id} draggableId={task._id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                >
                                  <TaskCard
                                    task={task}
                                    isDragging={snapshot.isDragging}
                                    onClick={() => setSelectedTask(task)}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                          <button className="add-task-btn" onClick={() => setCreateColumn(col.id)}>
                            + Add task
                          </button>
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
          </div>
        </DragDropContext>
      )}

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          project={{ ...project, columns }}
          onClose={() => setSelectedTask(null)}
          onUpdated={(task) => {
            setTasks(prev => prev.map(t => t._id === task._id ? task : t));
            setSelectedTask(task);
          }}
          onDeleted={(taskId) => {
            setTasks(prev => prev.filter(t => t._id !== taskId));
            setSelectedTask(null);
          }}
        />
      )}

      {createColumn && (
        <CreateTaskModal
          columnId={createColumn}
          projectId={id}
          project={project}
          onClose={() => setCreateColumn(null)}
          onCreate={(task) => {
            setTasks(prev => [...prev, task]);
            setCreateColumn(null);
          }}
        />
      )}

      {showMembers && (
        <MembersModal
          project={project}
          onClose={() => setShowMembers(false)}
          onUpdated={setProject}
        />
      )}
    </div>
  );
}