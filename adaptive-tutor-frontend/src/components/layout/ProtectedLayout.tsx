import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { UserRole } from '../../types/auth';

interface ProtectedLayoutProps {
  allowedRoles?: UserRole[];
}

export const ProtectedLayout: React.FC<ProtectedLayoutProps> = ({ allowedRoles }) => {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#f0f3fa] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4f46e5]"></div>
          <p className="text-sm font-medium text-slate-600">Authenticating session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    if (profile.role === 'student') {
      return <Navigate to="/task" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#f0f3fa] flex text-slate-900 font-sans antialiased">
      {/* Floating Vertical Sidebar */}
      <Sidebar />

      {/* Main Workspace with Left Margin for Sidebar */}
      <div className="flex-1 ml-16 sm:ml-24 flex flex-col min-h-screen overflow-x-hidden">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
