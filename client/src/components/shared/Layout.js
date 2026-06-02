import React from 'react';
import Navbar from './Navbar';
import Toast from './Toast';
import { useNotifications } from '../../context/NotificationContext';
 
export default function Layout({ children }) {
  const { toast } = useNotifications();
  return (
    <div className="layout">
      <Navbar />
      <main className="main-content">{children}</main>
      {toast && <Toast message={toast} />}
    </div>
  );
}
 