import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Plus,
  Video,
  ExternalLink,
  MapPin,
  CalendarCheck,
  X,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { apiClient } from '../../lib/apiClient';
import { Meeting, MeetingListResponse } from '../../types/meeting';
import { TaskCatalogResponse } from '../../types/task';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

interface CustomStudyEvent {
  id: string;
  title: string;
  subject: string;
  date: string; // YYYY-MM-DD
  time: string;
  location: string;
  type: 'study' | 'exam' | 'review';
}

export const LearningCalendar: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [catalog, setCatalog] = useState<TaskCatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Custom user-scheduled study events stored locally per student
  const [customEvents, setCustomEvents] = useState<CustomStudyEvent[]>(() => {
    try {
      const stored = localStorage.getItem(`student_calendar_events_${profile?.id || 'default'}`);
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  });

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalSubject, setModalSubject] = useState('Physics');
  const [modalDate, setModalDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [modalTime, setModalTime] = useState('10:00 AM - 11:30 AM');
  const [modalType, setModalType] = useState<'study' | 'exam' | 'review'>('study');
  const [modalError, setModalError] = useState<string | null>(null);

  // Save custom events to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`student_calendar_events_${profile?.id || 'default'}`, JSON.stringify(customEvents));
    } catch {}
  }, [customEvents, profile?.id]);

  // Fetch real meetings and task catalog from database
  const loadDatabaseSchedule = () => {
    setLoading(true);
    Promise.all([
      apiClient<MeetingListResponse>('/meetings').catch(() => null),
      apiClient<TaskCatalogResponse>('/tasks/catalog').catch(() => null),
    ])
      .then(([meetingData, catalogData]) => {
        if (meetingData && Array.isArray(meetingData.meetings)) {
          setMeetings(meetingData.meetings);
        }
        if (catalogData) {
          setCatalog(catalogData);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDatabaseSchedule();
    // Auto-poll meetings from DB every 10s for real-time live updates
    const interval = setInterval(loadDatabaseSchedule, 10000);
    return () => clearInterval(interval);
  }, []);

  const handlePrevMonth = () => {
    setCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleAddCustomEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTitle.trim()) {
      setModalError('Please enter a session title.');
      return;
    }

    const newEvt: CustomStudyEvent = {
      id: `custom-${Date.now()}`,
      title: modalTitle.trim(),
      subject: modalSubject,
      date: modalDate,
      time: modalTime,
      location: 'Personal Study & Review',
      type: modalType,
    };

    setCustomEvents((prev) => [newEvt, ...prev]);
    setModalTitle('');
    setModalError(null);
    setIsAddModalOpen(false);
  };

  // Calendar Math
  const currentYear = calendarDate.getFullYear();
  const currentMonth = calendarDate.getMonth();
  const monthNameYear = calendarDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun, 1 = Mon
  const startDayOffset = (firstDayOfMonth + 6) % 7; // Monday = 0, Sunday = 6
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const todayStr = new Date().toISOString().split('T')[0];

  interface CalendarGridCell {
    dayNumber: number;
    dateString: string; // YYYY-MM-DD
    isCurrentMonth: boolean;
    isToday: boolean;
    meetings: Meeting[];
    customEvents: CustomStudyEvent[];
  }

  const calendarGrid: CalendarGridCell[] = [];

  // Trailing previous month days
  const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
  const prevMonthYear = prevMonthDate.getFullYear();
  const prevMonthNum = String(prevMonthDate.getMonth() + 1).padStart(2, '0');

  for (let i = startDayOffset - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const dateString = `${prevMonthYear}-${prevMonthNum}-${String(day).padStart(2, '0')}`;
    calendarGrid.push({
      dayNumber: day,
      dateString,
      isCurrentMonth: false,
      isToday: dateString === todayStr,
      meetings: meetings.filter((m) => m.meeting_date === dateString),
      customEvents: customEvents.filter((e) => e.date === dateString),
    });
  }

  // Current month days
  const currMonthNum = String(currentMonth + 1).padStart(2, '0');
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    const dateString = `${currentYear}-${currMonthNum}-${String(d).padStart(2, '0')}`;
    calendarGrid.push({
      dayNumber: d,
      dateString,
      isCurrentMonth: true,
      isToday: dateString === todayStr,
      meetings: meetings.filter((m) => m.meeting_date === dateString),
      customEvents: customEvents.filter((e) => e.date === dateString),
    });
  }

  // Next month leading days to complete full grid (35 or 42)
  const nextMonthDate = new Date(currentYear, currentMonth + 1, 1);
  const nextMonthYear = nextMonthDate.getFullYear();
  const nextMonthNum = String(nextMonthDate.getMonth() + 1).padStart(2, '0');
  const totalSlots = calendarGrid.length <= 35 ? 35 : 42;
  const nextMonthDaysToAdd = totalSlots - calendarGrid.length;

  for (let d = 1; d <= nextMonthDaysToAdd; d++) {
    const dateString = `${nextMonthYear}-${nextMonthNum}-${String(d).padStart(2, '0')}`;
    calendarGrid.push({
      dayNumber: d,
      dateString,
      isCurrentMonth: false,
      isToday: dateString === todayStr,
      meetings: meetings.filter((m) => m.meeting_date === dateString),
      customEvents: customEvents.filter((e) => e.date === dateString),
    });
  }

  // Selected Day Items
  const selectedDayMeetings = meetings.filter((m) => m.meeting_date === selectedDateStr);
  const selectedDayCustomEvents = customEvents.filter((e) => e.date === selectedDateStr);

  const formatDisplayDate = (dStr: string) => {
    try {
      const [y, m, d] = dStr.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dStr;
    }
  };

  // Calculate subjects and topic counts from database catalog
  const subjectStats = React.useMemo(() => {
    if (!catalog?.subjects) return [];
    return catalog.subjects.map((subName) => {
      const subjectTasks = catalog.tasks?.filter((t) => t.subject?.toLowerCase() === subName?.toLowerCase()) || [];
      const topicsSet = new Set(subjectTasks.map((t) => t.skill_tag).filter(Boolean));
      return {
        name: subName,
        topicsCount: topicsSet.size || 1,
        tasksCount: subjectTasks.length,
      };
    });
  }, [catalog]);

  const subjectList = catalog?.subjects && catalog.subjects.length > 0
    ? catalog.subjects
    : [
        'Mathematics',
        'Physics',
        'Chemistry',
        'Biology',
        'Computer Science',
        'English Language Arts',
      ];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans text-slate-900 select-none pb-16">
      {/* ── HEADER BANNER ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-emerald-50 text-emerald-800">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <span>Learning Calendar & Schedule</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Real-time live classes, teacher meetings, and personalized study schedules synchronized with the database.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            onClick={() => {
              setModalDate(selectedDateStr || todayStr);
              setIsAddModalOpen(true);
            }}
            className="bg-[#2F5241] hover:bg-[#233f31] text-white flex items-center gap-2 text-xs py-2.5 px-4 rounded-2xl shadow-sm transition-all cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Add Study Schedule</span>
          </Button>
        </div>
      </div>

      {/* ── MAIN CALENDAR & SCHEDULE GRID ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Full Month Calendar View (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          {/* Header Controls */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-900">{monthNameYear}</h2>
              <p className="text-xs text-slate-500 font-medium">Click on any date to inspect scheduled sessions</p>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 p-1 rounded-2xl">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-2 rounded-xl text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCalendarDate(new Date())}
                className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2 rounded-xl text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 transition-colors cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-extrabold text-slate-400 uppercase tracking-wider">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>

          {/* Calendar Grid Matrix */}
          <div className="grid grid-cols-7 gap-2 text-xs">
            {calendarGrid.map((cell) => {
              const isSelected = cell.dateString === selectedDateStr;
              const hasLiveMeeting = cell.meetings.some((m) => m.status === 'live');
              const hasUpcomingMeeting = cell.meetings.some((m) => m.status === 'upcoming');
              const isPastDate = cell.dateString < todayStr;
              const isCompletedMeeting = isPastDate && cell.meetings.length > 0;
              const totalEvents = cell.meetings.length + cell.customEvents.length;

              return (
                <div
                  key={cell.dateString}
                  onClick={() => setSelectedDateStr(cell.dateString)}
                  className={`min-h-[86px] p-2 sm:p-2.5 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer ${
                    !cell.isCurrentMonth
                      ? 'border-slate-100 bg-slate-50/30 text-slate-400 opacity-60'
                      : isSelected
                      ? 'border-[#2F5241] bg-emerald-50/40 ring-2 ring-[#2F5241]/20 shadow-sm'
                      : isCompletedMeeting
                      ? 'border-emerald-200 bg-emerald-50/30'
                      : cell.isToday
                      ? 'border-indigo-300 bg-indigo-50/40 shadow-xs'
                      : 'border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-black text-xs sm:text-sm ${
                        cell.isToday
                          ? 'w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-extrabold'
                          : isSelected
                          ? 'text-[#2F5241] font-black'
                          : 'text-slate-800'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {totalEvents > 0 && (
                      <span className={`w-4 h-4 rounded-full text-white text-[9px] font-black flex items-center justify-center ${
                        isCompletedMeeting ? 'bg-emerald-600' : 'bg-slate-900'
                      }`}>
                        {totalEvents}
                      </span>
                    )}
                  </div>

                  {/* Day Content Badges */}
                  <div className="space-y-1 mt-1">
                    {hasLiveMeeting && (
                      <div className="flex items-center gap-1 text-[10px] font-black text-emerald-900 bg-emerald-200/90 px-1.5 py-0.5 rounded-md truncate animate-pulse">
                        <Video className="w-3 h-3 text-emerald-800 shrink-0" />
                        <span className="truncate">Live Class</span>
                      </div>
                    )}
                    {hasUpcomingMeeting && !hasLiveMeeting && (
                      <div className="flex items-center gap-1 text-[10px] font-extrabold text-indigo-900 bg-indigo-100 px-1.5 py-0.5 rounded-md truncate">
                        <Clock className="w-3 h-3 text-indigo-700 shrink-0" />
                        <span className="truncate">Class</span>
                      </div>
                    )}
                    {isCompletedMeeting && !hasLiveMeeting && !hasUpcomingMeeting && (
                      <div className="flex items-center gap-1 text-[9px] font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded-md truncate">
                        <span>✓ Completed</span>
                      </div>
                    )}
                    {cell.customEvents.slice(0, 1).map((evt) => (
                      <div
                        key={evt.id}
                        className={`text-[9px] font-bold px-1 py-0.5 rounded-md truncate ${
                          evt.type === 'exam'
                            ? 'text-amber-900 bg-amber-100'
                            : 'text-slate-700 bg-slate-100'
                        }`}
                      >
                        {evt.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Live Virtual Class
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Upcoming Meeting
              </span>
              <span className="flex items-center gap-1.5 font-bold text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> ✓ Completed Session
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Assessment / Study Plan
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Updated live with database</span>
          </div>
        </div>

        {/* Schedule Detail Sidebar (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-[#2F5241]" />
                  <span>Schedule for {formatDisplayDate(selectedDateStr)}</span>
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  {selectedDayMeetings.length + selectedDayCustomEvents.length} scheduled item(s)
                </p>
              </div>
            </div>

            {/* Scheduled Items List */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {/* 1. Database Meetings */}
              {selectedDayMeetings.map((m) => (
                <div
                  key={m.id}
                  className={`p-4 rounded-2xl border space-y-2 transition-all ${
                    m.status === 'live'
                      ? 'border-emerald-300 bg-emerald-50/70 shadow-sm'
                      : 'border-indigo-100 bg-indigo-50/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/90 text-indigo-900 shadow-2xs">
                      {m.subject}
                    </span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        m.status === 'live'
                          ? 'bg-emerald-600 text-white animate-pulse'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {m.status === 'live' ? '🔴 LIVE NOW' : m.status.toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-black text-slate-900 leading-snug">{m.title}</h4>
                    {m.description && (
                      <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{m.description}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {m.start_time} - {m.end_time}
                    </span>
                  </div>

                  <a
                    href={m.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 mt-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Join Google Meet Session</span>
                  </a>
                </div>
              ))}

              {/* 2. Custom User Study Schedule */}
              {selectedDayCustomEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/70 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                      {evt.subject}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{evt.type}</span>
                  </div>
                  <h4 className="text-xs font-extrabold text-slate-900">{evt.title}</h4>
                  <p className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" /> {evt.time}
                  </p>
                </div>
              ))}

              {/* Empty State */}
              {selectedDayMeetings.length === 0 && selectedDayCustomEvents.length === 0 && (
                <div className="text-center py-8 space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                    <CalendarIcon className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">No scheduled sessions for this day</p>
                  <p className="text-[11px] text-slate-400 max-w-[220px] mx-auto">
                    Classes scheduled by your teacher or custom study sessions will appear here automatically.
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Database Curriculum Subjects Overview */}
          {subjectStats.length > 0 && (
            <Card className="p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#2F5241]" />
                  <span>Available Curriculum Subjects ({subjectStats.length})</span>
                </h4>
                <button
                  type="button"
                  onClick={() => navigate('/task')}
                  className="text-[11px] font-bold text-emerald-800 hover:underline cursor-pointer"
                >
                  View Tasks
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {subjectStats.map((sub) => (
                  <span
                    key={sub.name}
                    className="text-[10px] font-extrabold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-xl border border-slate-200/60"
                  >
                    {sub.name} ({sub.topicsCount} topics)
                  </span>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* ── ADD STUDY SCHEDULE MODAL ─────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Add Study Schedule</h3>
                  <p className="text-xs text-slate-500 font-medium">Plan your personal review & practice time</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleAddCustomEvent} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-800">Session Title *</label>
                <input
                  type="text"
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  placeholder="e.g. Physics SSC Kinematics Self-Study"
                  className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#2F5241]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-800">Subject</label>
                  <select
                    value={modalSubject}
                    onChange={(e) => setModalSubject(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#2F5241] bg-white"
                  >
                    {subjectList.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-800">Schedule Date</label>
                  <input
                    type="date"
                    value={modalDate}
                    onChange={(e) => setModalDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#2F5241] bg-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-800">Time Window</label>
                  <input
                    type="text"
                    value={modalTime}
                    onChange={(e) => setModalTime(e.target.value)}
                    placeholder="e.g. 10:00 AM - 11:30 AM"
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#2F5241]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-800">Session Type</label>
                  <select
                    value={modalType}
                    onChange={(e) => setModalType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#2F5241] bg-white"
                  >
                    <option value="study">Self-Study</option>
                    <option value="exam">Assessment / Exam</option>
                    <option value="review">Practice Review</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-xs py-2 px-4 rounded-xl cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="bg-[#2F5241] hover:bg-[#233f31] text-white text-xs py-2 px-4 rounded-xl cursor-pointer shadow-xs"
                >
                  Add to Calendar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
