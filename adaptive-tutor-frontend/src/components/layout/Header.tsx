import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { AccessibilitySettingsModal } from '../modals/AccessibilitySettingsModal';
import { NotificationsDrawer } from './NotificationsDrawer';
import { Search, Bell, MessageSquare, Sliders, LogOut } from 'lucide-react';

export const Header: React.FC = () => {
  const { profile, logout } = useAuth();
  const { currentTheme, availableThemes, setTheme, activeConfig } = useTheme();
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isStudent = profile?.role === 'student';

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/[\s_.-]+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/dashboard?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const ActiveIcon = activeConfig.icon;

  return (
    <>
      <header className="w-full bg-[#f0f3fa] px-4 sm:px-6 pt-4 pb-2 flex flex-col md:flex-row md:items-center justify-between gap-4 select-none header-surface">
        {/* Left Side: Greeting & Activity Summary */}
        <div className="flex flex-col text-left space-y-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Hello, {profile?.display_name || 'Learner'}!
            </h1>
            <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ActiveIcon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-semibold flex flex-wrap items-center gap-1.5">
            <span>You have today <strong className="text-slate-800">1 active session</strong> & <strong className="text-slate-800">3 tasks</strong></span>
            <span className="hidden sm:inline">•</span>
            <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full text-[11px]">
              Theme: {activeConfig.name}
            </span>
          </p>
        </div>

        {/* Right Side: Mode SVG Theme Selector + Search + Icons + Profile */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Global Mode Theme Selector Pill */}
          <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-full shadow-xs">
            {availableThemes.map((t) => {
              const Icon = t.icon;
              const isActive = currentTheme === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTheme(t.key)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    isActive
                      ? `${t.activeColor} scale-105 shadow-xs`
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:scale-105'
                  }`}
                  title={`${t.name}: ${t.description}`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>

          {/* Rounded Pill Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              type="text"
              placeholder="Search Anything..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-44 sm:w-64 pl-4 pr-11 py-2 rounded-full bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm transition-all"
            />
            <button
              type="submit"
              className="absolute right-1 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-indigo-600 transition-colors cursor-pointer"
              title="Search"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Student AI Tutor Chat Button */}
          {isStudent && (
            <button
              type="button"
              onClick={() => navigate('/chatbot')}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center shadow-xs transition-all cursor-pointer active:scale-95"
              title="AI Tutor Chat"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          )}

          {/* Notification Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsNotificationsOpen(true)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center shadow-xs transition-all cursor-pointer active:scale-95"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>
          </div>

          {/* Sensory Controls Trigger */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="h-9 sm:h-10 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-full text-slate-700 font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
            title="Sensory & Accessibility Controls"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden lg:inline text-[11px]">Sensory Controls</span>
          </button>

          {/* User Profile Avatar Link */}
          {profile && (
            <Link
              to="/profile"
              className="flex items-center gap-2 p-1 pl-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-full shadow-xs transition-all group"
            >
              <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black group-hover:bg-slate-800 transition-colors">
                {getInitials(profile.display_name)}
              </div>
              <span className="text-xs font-extrabold text-slate-800 hidden sm:inline max-w-[100px] truncate pr-2">
                {profile.display_name}
              </span>
            </Link>
          )}

          {/* Logout Button */}
          <button
            type="button"
            onClick={logout}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-500 hover:text-rose-600 flex items-center justify-center transition-all cursor-pointer active:scale-95"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <AccessibilitySettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </>
  );
};
