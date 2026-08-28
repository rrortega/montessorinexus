import React from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AdminLogin } from './AdminLogin';
import { AdminDashboard } from './AdminDashboard';

const AdminContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <AdminDashboard /> : <AdminLogin />;
};

export const AdminPage: React.FC = () => {
  return (
    <AuthProvider>
      <AdminContent />
    </AuthProvider>
  );
};

export default AdminPage;
