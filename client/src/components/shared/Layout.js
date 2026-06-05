import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Toast from './Toast';
import { useNotifications } from '../../context/NotificationContext';
import api from '../../utils/api';

export default function Layout({ children }) {
  const { toast } = useNotifications();
  const [projects, setProjects] = useState([]);
  const location = useLocation();

  useEffect(() => {
    api.get('/projects').then(res => setProjects(res.data)).catch(() => {});
  }, [location.pathname]);

  return (
    <div className="app-layout">
      <Sidebar projects={projects} />
      <div className="app-main">
        <main className="main-content">{children}</main>
      </div>
      {toast && <Toast message={toast} />}
    </div>
  );
}