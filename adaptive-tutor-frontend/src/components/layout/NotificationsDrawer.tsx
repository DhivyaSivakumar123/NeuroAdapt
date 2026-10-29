import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  X,
  Video,
  BookOpen,
  CheckCircle2,
  Sparkles,
  Calendar,
  ExternalLink,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { MeetingListResponse, Meeting } from '../../types/meeting';

export interface AppNotification {
  id: string;
  category: 'Meetings' | 'Topics' | 'Subjects';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
}

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'All' | 'Meetings' | 'Topics' | 'Subjects'>('All');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    // Generate initial dynamic notifications from meetings & catalog updates
    const fetchNotificationsData = async () => {
      try {
        const meetingsRes = await apiClient<MeetingListResponse>('/meetings');
        const meetingList: Meeting[] = meetingsRes?.meetings || [];

        const meetingNotifications: AppNotification[] = meetingList.map((m) => ({
          id: `meet-${m.id}`,
          category: 'Meetings',
          title: `Live Class: ${m.title}`,
          description: `${m.subject} session scheduled for ${m.meeting_date || 'today'} (${m.start_time} - ${m.end_time})`,
          timestamp: m.start_time || 'Just now',
          read: false,
          actionUrl: m.meeting_link,
          actionText: 'Join Google Meet',
        }));

        const defaultNotifications: AppNotification[] = [
          ...meetingNotifications,
          {
            id: 'topic-1',
            category: 'Topics',
            title: 'New Topic Unlocked: Whole Number Operations',
            description: 'Practice multi-digit arithmetic and friendly estimation heuristics.',
            timestamp: '10m ago',
            read: false,
            actionUrl: '/task',
            actionText: 'Start Topic',
          },
          {
            id: 'topic-2',
            category: 'Topics',
            title: 'Topic Progress Updated: Photosynthesis & Energy Cycles',
            description: 'Chloroplasts and ATP cellular respiration questions added to life science.',
            timestamp: '1h ago',
            read: false,
            actionUrl: '/task',
            actionText: 'Practice Now',
          },
          {
            id: 'subject-1',
            category: 'Subjects',
            title: 'Curriculum Update: 14 Subjects Available',
            description: 'Grounded OpenStax biology, algebra, physics, and computer science available.',
            timestamp: '2h ago',
            read: false,
            actionUrl: '/subjects',
            actionText: 'Browse Catalog',
          },
          {
            id: 'subject-2',
            category: 'Subjects',
            title: 'Subject Progress Milestone: Mathematics',
            description: 'You completed 3 key topics in arithmetic and pre-algebra!',
            timestamp: 'Yesterday',
            read: true,
            actionUrl: '/dashboard',
            actionText: 'View Metrics',
          },
        ];

        setNotifications(defaultNotifications);
      } catch (err) {
        console.error('Failed to load notifications:', err);
      }
    };

    fetchNotificationsData();
  }, []);

  if (!isOpen) return null;

  const filtered = notifications.filter(
    (n) => activeTab === 'All' || n.category === activeTab
  );
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const toggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const handleAction = (n: AppNotification) => {
    toggleRead(n.id);
    if (n.actionUrl) {
      if (n.actionUrl.startsWith('http')) {
        window.open(n.actionUrl, '_blank');
      } else {
        navigate(n.actionUrl);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      {/* Backdrop click dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Container */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between z-10 font-sans border-l border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-900 text-white">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                Notifications
                {unreadCount > 0 && (
                  <span className="text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Live class meets, topic & subject progress updates
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Category Tabs */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {(['All', 'Meetings', 'Topics', 'Subjects'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="text-[11px] font-bold text-indigo-600 hover:underline whitespace-nowrap ml-2"
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Notifications List Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Bell className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-700">No updates in {activeTab}</p>
              <p className="text-xs text-slate-400 font-medium">Check back for live meeting alerts & topic progress.</p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all duration-150 flex flex-col space-y-2.5 relative ${
                  !item.read
                    ? 'bg-slate-50/80 border-slate-300/80 shadow-xs'
                    : 'bg-white border-slate-100 opacity-80'
                }`}
              >
                {!item.read && (
                  <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-rose-500" />
                )}

                <div className="flex items-center gap-2">
                  {item.category === 'Meetings' && (
                    <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                      <Video className="w-3.5 h-3.5" />
                    </span>
                  )}
                  {item.category === 'Topics' && (
                    <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                      <BookOpen className="w-3.5 h-3.5" />
                    </span>
                  )}
                  {item.category === 'Subjects' && (
                    <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                      <Sparkles className="w-3.5 h-3.5" />
                    </span>
                  )}

                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                    {item.category} • {item.timestamp}
                  </span>
                </div>

                <div className="space-y-0.5 pr-4">
                  <h4 className="text-xs font-extrabold text-slate-900 leading-snug">
                    {item.title}
                  </h4>
                  <p className="text-[11px] font-medium text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {item.actionText && (
                  <div className="pt-1 flex items-center justify-between border-t border-slate-100/80">
                    <button
                      type="button"
                      onClick={() => handleAction(item)}
                      className="text-[11px] font-extrabold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer"
                    >
                      <span>{item.actionText}</span>
                      {item.actionUrl?.startsWith('http') ? (
                        <ExternalLink className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleRead(item.id)}
                      className="text-[10px] font-bold text-slate-400 hover:text-slate-600"
                    >
                      {item.read ? 'Mark unread' : 'Mark read'}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>Clarity AI Notifications</span>
          <button
            type="button"
            onClick={onClose}
            className="font-bold text-slate-800 hover:underline"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
