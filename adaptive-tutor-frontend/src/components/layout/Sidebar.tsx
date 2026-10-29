import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutGrid, BookOpen, Calendar, MessageSquare, Settings, LogOut, Brain, Video } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, logout } = useAuth();

  const isStudent = profile?.role === 'student';
  const isTeacher = profile?.role === 'teacher';

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutGrid,
      path: '/dashboard',
    },
    ...(isStudent
      ? [
          {
            id: 'task',
            label: 'Subject Card selection',
            icon: BookOpen,
            path: '/task',
          },
        ]
      : []),
    ...(isTeacher
      ? [
          {
            id: 'meetings',
            label: 'Schedule Meetings & Live Classes',
            icon: Video,
            path: '/meetings',
          },
        ]
      : []),
    {
      id: 'calendar',
      label: 'Learning Calendar',
      icon: Calendar,
      path: '/calendar',
    },
    ...(isStudent
      ? [
          {
            id: 'chatbot',
            label: 'AI Tutor Chatbot',
            icon: MessageSquare,
            path: '/chatbot',
          },
        ]
      : []),
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <aside className="fixed left-4 top-4 bottom-4 z-40 w-16 sm:w-20 bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-3xl shadow-xl shadow-slate-300/30 flex flex-col items-center justify-between py-5 select-none transition-all">
      {/* Top Brand Logo */}
      <div className="flex flex-col items-center gap-6 w-full">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/20 hover:scale-105 transition-all cursor-pointer"
          title="Clarity Adaptive Tutor"
        >
          <Brain className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Navigation Items */}
        <nav className="flex flex-col items-center gap-3 w-full px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              (item.id === 'dashboard' && location.pathname === '/dashboard') ||
              (item.id === 'task' && location.pathname.startsWith('/task')) ||
              (item.id === 'meetings' && location.pathname.startsWith('/meetings')) ||
              (item.id === 'calendar' && location.pathname === '/calendar') ||
              (item.id === 'chatbot' && location.pathname === '/chatbot');

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.path)}
                className={`group relative w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/30 ring-2 ring-slate-400/30'
                    : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100/80'
                }`}
                title={item.label}
              >
                <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />

                {/* Tooltip on Hover */}
                <span className="absolute left-16 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg z-50">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Settings & Logout */}
      <div className="flex flex-col items-center gap-3 w-full px-2">
        {/* Settings */}
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className={`group relative w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
            location.pathname === '/profile'
              ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/30'
              : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
          }`}
          title="Settings"
        >
          <Settings className="w-5 h-5 transition-transform group-hover:scale-110" />
          <span className="absolute left-16 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg z-50">
            Settings
          </span>
        </button>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          className="group relative w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer active:scale-95"
          title="Logout"
        >
          <LogOut className="w-5 h-5 transition-transform group-hover:scale-110" />
          <span className="absolute left-16 px-3 py-1.5 rounded-xl bg-rose-900 text-white text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg z-50">
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
};
