import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import socket from '../utils/socket';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!user) return;
    api.get('/notifications').then(res => setNotifications(res.data));

    socket.on('notification:new', (data) => {
      setToast(data.message);
      setTimeout(() => setToast(null), 4000);
      api.get('/notifications').then(res => setNotifications(res.data));
    });

    return () => socket.off('notification:new');
  }, [user]);

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`);
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
  };

  const markAllRead = async () => {
    await api.put('/notifications/mark-all-read');
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markRead, markAllRead, toast }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
