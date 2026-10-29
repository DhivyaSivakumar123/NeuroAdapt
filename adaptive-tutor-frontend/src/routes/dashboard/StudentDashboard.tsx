import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTasks } from '../../hooks/useTasks';
import { useTheme } from '../../context/ThemeContext';
import { TaskCatalogResponse } from '../../types/task';
import { Meeting, MeetingListResponse } from '../../types/meeting';
import { apiClient } from '../../lib/apiClient';
import { NotificationsDrawer } from '../../components/layout/NotificationsDrawer';
import {
  BookOpen,
  Trophy,
  Award,
  Flame,
  Clock,
  Video,
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  Plus,
  Edit2,
  Check,
  Search,
  MessageSquare,
  Bell,
  ArrowUpRight,
  TrendingDown,
  ExternalLink,
} from 'lucide-react';

interface StudentMetricsResponse {
  total_tasks: number;
  subjects_count: number;
  completed_count: number | null;
  completed_subjects_count?: number;
  streak_days: number | null;
  modalities_count: number;
  avg_performance_score: number | null;
  highest_score: number | null;
  lowest_score: number | null;
  questions_attended?: number;
  questions_skipped?: number;
  weekly_activity: Record<string, { study: number; exam: number }>;
  has_weekly_activity: boolean;
}

export const StudentDashboard: React.FC = () => {
  const { profile } = useAuth();
  const { fetchTaskCatalog } = useTasks();
  const { currentTheme, availableThemes, setTheme } = useTheme();
  const navigate = useNavigate();

  const [catalog, setCatalog] = useState<TaskCatalogResponse | null>(null);
  const [metrics, setMetrics] = useState<StudentMetricsResponse | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [selectedMood, setSelectedMood] = useState<number>(1);
  const moods = ['😍', '🙂', '😐', '😕', '😫'];

  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const [newTodoTopic, setNewTodoTopic] = useState('');
  const [selectedTodoSubject, setSelectedTodoSubject] = useState('Physics');

  const existingSubjects = [
    'Chemistry',
    'Physics',
    'Calculus',
    'Statistics',
    'Biology',
    'Computer Science',
    'General',
  ];

  // Interactive Todo List with student-specific persistent storage
  const [todos, setTodos] = useState<Array<{ id: number; text: string; subject: string; done: boolean }>>(() => {
    try {
      const stored = localStorage.getItem(`student_todos_${profile?.id || 'default'}`);
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      { id: 1, text: "Newton's laws of motion review", subject: 'Physics', done: false },
      { id: 2, text: 'Algebra & Equations practice', subject: 'Calculus', done: false },
      { id: 3, text: 'Complete daily learning session', subject: 'General', done: false },
      { id: 4, text: 'Chemical reactions & equilibrium', subject: 'Chemistry', done: false },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem(`student_todos_${profile?.id || 'default'}`, JSON.stringify(todos));
    } catch {}
  }, [todos, profile?.id]);

  useEffect(() => {
    fetchTaskCatalog().then(setCatalog).catch(() => {});

    const loadMeetings = () => {
      apiClient<MeetingListResponse>('/meetings')
        .then((data) => {
          if (data && Array.isArray(data.meetings)) {
            setMeetings(data.meetings);
          }
        })
        .catch((err) => {
          console.error('Failed to load meetings in StudentDashboard:', err);
        });
    };

    loadMeetings();
    const interval = setInterval(loadMeetings, 10000); // Poll every 10s for real-time live class updates

    apiClient<StudentMetricsResponse>('/students/me/metrics')
      .then((data) => setMetrics(data))
      .catch((err) => console.error('Failed to fetch metrics:', err))
      .finally(() => setIsLoadingMetrics(false));

    return () => clearInterval(interval);
  }, [fetchTaskCatalog]);

  const toggleTodo = (id: number) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTopic.trim()) return;
    setTodos((prev) => [
      ...prev,
      {
        id: Date.now(),
        text: newTodoTopic.trim(),
        subject: selectedTodoSubject,
        done: false,
      },
    ]);
    setNewTodoTopic('');
    setSelectedTodoSubject('Physics');
    setIsAddingTodo(false);
  };

  const studentName = profile?.display_name || 'Student';
  const userInitials = profile?.display_name
    ? profile.display_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'ST';

  const todayDate = new Date();
  const upcomingExamDate = new Date(todayDate.getTime() + 14 * 24 * 60 * 60 * 1000);
  const upcomingExamStr = upcomingExamDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const activeTodosCount = todos.filter((t) => !t.done).length;

  // Interactive Month Calendar State for Exam Schedule
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number | null>(() => new Date().getDate());

  const handlePrevMonth = () => {
    setCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Build calendar matrix (Monday to Sunday)
  const currentYear = calendarDate.getFullYear();
  const currentMonth = calendarDate.getMonth();
  const monthNameYear = calendarDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun, 1 = Mon...
  const startDayOffset = (firstDayOfMonth + 6) % 7; // Monday = 0, Sunday = 6
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const calendarDays: Array<{
    day: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    hasExam: boolean;
    hasMeeting: boolean;
    isCompleted?: boolean;
    meetingTitle?: string;
    meetingTime?: string;
    meetingLink?: string;
    dateKey: string;
    dateStr?: string;
  }> = [];

  // Trailing days from previous month
  for (let i = startDayOffset - 1; i >= 0; i--) {
    calendarDays.push({
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
      isToday: false,
      hasExam: false,
      hasMeeting: false,
      isCompleted: false,
      dateKey: `prev-${daysInPrevMonth - i}`,
      dateStr: '',
    });
  }

  const isThisMonth = todayDate.getFullYear() === currentYear && todayDate.getMonth() === currentMonth;

  // Days in current month
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    const isToday = isThisMonth && todayDate.getDate() === d;
    const cellDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayMeetings = meetings.filter((m) => m.meeting_date === cellDateStr);
    const hasMeeting = dayMeetings.length > 0;
    const primaryMeeting = dayMeetings[0] || null;
    const hasExam = d === 15 || dayMeetings.some((m) => m.title?.toLowerCase().includes('exam') || m.title?.toLowerCase().includes('test'));
    const isPast = isThisMonth ? d < todayDate.getDate() : (calendarDate < new Date(todayDate.getFullYear(), todayDate.getMonth(), 1));
    const isCompleted = (hasExam || hasMeeting) && isPast;

    calendarDays.push({
      day: d,
      isCurrentMonth: true,
      isToday,
      hasExam,
      hasMeeting: Boolean(hasMeeting),
      isCompleted,
      meetingTitle: primaryMeeting?.title,
      meetingTime: primaryMeeting ? `${primaryMeeting.start_time} - ${primaryMeeting.end_time}` : undefined,
      meetingLink: primaryMeeting?.meeting_link,
      dateKey: `curr-${d}`,
      dateStr: cellDateStr,
    });
  }

  // Leading days from next month
  const totalSlots = calendarDays.length <= 35 ? 35 : 42;
  const nextMonthDaysToAdd = totalSlots - calendarDays.length;

  for (let d = 1; d <= nextMonthDaysToAdd; d++) {
    calendarDays.push({
      day: d,
      isCurrentMonth: false,
      isToday: false,
      hasExam: false,
      hasMeeting: false,
      isCompleted: false,
      dateKey: `next-${d}`,
      dateStr: '',
    });
  }

  const todayCellDateStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;
  const todayClassesCount = meetings.filter((m) => m.meeting_date === todayCellDateStr).length;

  // Real upcoming exam calculation
  const upcomingMeetingsList = meetings.filter((m) => {
    if (!m.meeting_date) return false;
    const mDate = new Date(m.meeting_date);
    return mDate >= new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());
  });
  const nextExam = upcomingMeetingsList.find((m) => m.title?.toLowerCase().includes('exam') || m.title?.toLowerCase().includes('test')) || upcomingMeetingsList[0];
  const nextExamTitle = nextExam ? nextExam.title : "Physics Mechanics Assessment";
  const nextExamDateStr = nextExam
    ? new Date(nextExam.meeting_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : upcomingExamStr;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans text-slate-800 select-none pb-12">
      {/* ── 1. HEADER ROW: GREETING & DYNAMIC REAL OVERVIEW BANNER ────────── */}
      <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-sm">
        {/* Left Greeting & Valuable Clean Overview */}
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Hello, {studentName} 👋
            </h1>
            <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs">
              Active Focus Mode
            </span>
          </div>

          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 px-3.5 py-1.5 rounded-full border border-slate-200/60">
              <Video className="w-3.5 h-3.5 text-indigo-600" />
              <span>{todayClassesCount} Live Class{todayClassesCount === 1 ? '' : 'es'} Today</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 px-3.5 py-1.5 rounded-full border border-slate-200/60">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>{activeTodosCount} Pending To-Dos</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-indigo-900 bg-indigo-50 border border-indigo-200 px-3.5 py-1.5 rounded-full">
              <CalendarIcon className="w-3.5 h-3.5 text-indigo-600" />
              <span>Next Assessment: <span className="font-black text-indigo-950">{nextExamTitle} ({nextExamDateStr})</span></span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-900 bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-full">
              <Flame className="w-3.5 h-3.5 text-amber-600" />
              <span>{Math.max(1, metrics?.streak_days ?? 1)} Day Streak</span>
            </div>
          </div>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/chatbot')}
            className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 shadow-md shadow-slate-900/10 transition-all cursor-pointer group"
            title="AI Tutor Chatbot"
          >
            <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>

          <button
            type="button"
            onClick={() => setIsNotificationsOpen(true)}
            className="w-11 h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 shadow-xs transition-all relative cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
          </button>
        </div>
      </div>

      {/* ── 2. TOP METRIC CARDS ROW (EXACTLY 3 CARDS WITH PROPER PADDING & MARGINS) ────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Total Courses (Available Subjects Count) */}
        <div
          onClick={() => navigate('/task')}
          className="bg-white rounded-3xl p-6 border border-slate-200/70 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-slate-700 font-extrabold text-xs">
              <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
                <BookOpen className="w-4 h-4" />
              </div>
              <span>Total Courses</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <span className="text-4xl font-black text-slate-900">
              {metrics ? metrics.subjects_count : (catalog?.subjects?.length ?? 14)}
            </span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              <span>Available Subjects</span>
            </div>
          </div>
        </div>

        {/* Card 2: Completed (Completed Subjects Count) */}
        <div
          onClick={() => navigate('/task')}
          className="bg-white rounded-3xl p-6 border border-slate-200/70 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-slate-700 font-extrabold text-xs">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
                <Trophy className="w-4 h-4" />
              </div>
              <span>Completed</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <span className="text-4xl font-black text-slate-900">
              {metrics?.completed_subjects_count ?? 0}
            </span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full">
              <span>Completed Subjects</span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Streak */}
        <div
          onClick={() => navigate('/task')}
          className="bg-white rounded-3xl p-6 border border-slate-200/70 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-slate-700 font-extrabold text-xs">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                <Flame className="w-4 h-4" />
              </div>
              <span>Total Streak</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <span className="text-4xl font-black text-slate-900">
              {Math.max(1, metrics?.streak_days ?? 1)} days
            </span>
            <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full">
              Active Focus
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. MAIN DASHBOARD CONTENT GRID (LEFT CONTENT + RIGHT FULL-HEIGHT PROFILE & TODO) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: 8 cols (lg) / 9 cols (xl) */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
          {/* Top Sub-Row: Time Spent (Increased Width) + Avg Performance Score */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            {/* Time Spent Bar Chart (Wider: 8 cols out of 12) */}
            <div className="md:col-span-8 bg-white rounded-3xl p-6 border border-slate-200/70 shadow-sm flex flex-col justify-between space-y-4 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-extrabold text-slate-900">Time Spent (Min)</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#2F5241]" /> Study
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#7D9F8D]" /> Exam
                    </span>
                  </div>
                </div>
              </div>

              {/* Bar Chart Graphics */}
              {(() => {
                // Helper to normalize values
                const toMins = (val: number) => Math.round(val);

                // Helper to format minutes to hours when >= 60 min (e.g. 600m -> 10h, 90m -> 1h 30m)
                const formatDuration = (totalMins: number): string => {
                  const absMins = Math.abs(totalMins);
                  if (absMins < 60) return `${absMins}m`;
                  const hours = Math.floor(absMins / 60);
                  const mins = Math.round(absMins % 60);
                  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
                };

                const activityData = metrics?.weekly_activity || {
                  Mon: { study: 10, exam: 0 },
                  Tue: { study: 15, exam: 0 },
                  Wed: { study: 0, exam: 0 },
                  Thu: { study: 0, exam: 0 },
                  Fri: { study: 0, exam: 0 },
                  Sat: { study: 5, exam: 0 },
                  Sun: { study: 10, exam: 0 },
                };

                const weeklyValues = Object.values(activityData).flatMap((d) => [toMins(d.study), toMins(d.exam)]);
                const maxVal = weeklyValues.length > 0 ? Math.max(...weeklyValues, 0) : 0;
                
                // Total study vs exam difference calculation
                const totalStudyMins = Object.values(activityData).reduce((acc, d) => acc + toMins(d.study), 0);
                const totalExamMins = Object.values(activityData).reduce((acc, d) => acc + toMins(d.exam), 0);
                const minsDiff = totalStudyMins - totalExamMins;
                const diffLabel = minsDiff >= 0
                  ? `+${formatDuration(minsDiff)} Study`
                  : `-${formatDuration(minsDiff)} Exam`;

                // Clean even Y-axis scale ticks calculation (e.g., 0, 5, 10, 15 OR 0, 100, 200, 300)
                let tickGap = 5;
                let maxMinutes = 15;
                if (maxVal <= 15) {
                  tickGap = 5;
                  maxMinutes = 15;
                } else if (maxVal <= 30) {
                  tickGap = 10;
                  maxMinutes = 30;
                } else if (maxVal <= 60) {
                  tickGap = 20;
                  maxMinutes = 60;
                } else if (maxVal <= 120) {
                  tickGap = 40;
                  maxMinutes = 120;
                } else if (maxVal <= 300) {
                  tickGap = 100;
                  maxMinutes = 300;
                } else {
                  tickGap = Math.ceil((maxVal / 3) / 10) * 10;
                  maxMinutes = tickGap * 3;
                }

                const ticks: number[] = [];
                for (let v = maxMinutes; v >= 0; v -= tickGap) {
                  ticks.push(v);
                }

                return (
                  <div className="pt-2 pb-2 space-y-3">
                    <div className="relative h-44 flex items-end justify-between pl-14 pr-3 border-b border-slate-100">
                      {/* Clean Grid Background Lines & Y-Axis Labels */}
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none py-1">
                        {ticks.map((t, idx) => (
                          <div key={idx} className="w-full flex items-center">
                            <span className="w-12 text-right pr-2 text-[10px] font-bold text-slate-400 select-none">
                              {formatDuration(t)}
                            </span>
                            <div className="flex-1 border-b border-slate-100/90" />
                          </div>
                        ))}
                      </div>

                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                        const rawData = activityData[day] || { study: 0, exam: 0 };
                        const studyMins = toMins(rawData.study);
                        const examMins = toMins(rawData.exam);
                        const dayDiff = studyMins - examMins;

                        const studyPct = studyMins > 0
                          ? `${Math.min(100, Math.round((studyMins / maxMinutes) * 100))}%`
                          : '0%';
                        const examPct = examMins > 0
                          ? `${Math.min(100, Math.round((examMins / maxMinutes) * 100))}%`
                          : '0%';
                        const hasActivity = studyMins > 0 || examMins > 0;

                        return (
                          <div key={day} className="relative flex flex-col items-center z-10 group cursor-pointer">
                            {/* Hover-Only Tooltip Card */}
                            {hasActivity && (
                              <div className="absolute -top-16 bg-white border border-slate-200 text-slate-800 text-[10px] font-bold px-2.5 py-1.5 rounded-xl shadow-lg flex flex-col items-start gap-0.5 z-30 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                <div className="flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#2F5241]" /> {formatDuration(studyMins)} Study
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#7D9F8D]" /> {formatDuration(examMins)} Exam
                                </div>
                                <div className="text-[9px] font-black text-emerald-700 border-t border-slate-100 pt-0.5 mt-0.5">
                                  Diff: {dayDiff >= 0 ? `+${formatDuration(dayDiff)}` : `-${formatDuration(dayDiff)}`}
                                </div>
                              </div>
                            )}

                            <div className="h-32 w-7 sm:w-8 flex flex-col-reverse justify-start rounded-t-xl overflow-hidden transition-all duration-300 group-hover:opacity-90 min-h-[4px]">
                              <div className="bg-[#2F5241] w-full transition-all duration-500 rounded-t-sm" style={{ height: studyPct }} />
                              {examPct !== '0%' && (
                                <div
                                  className="bg-[#7D9F8D] w-full border-b border-[#2F5241] transition-all duration-500"
                                  style={{
                                    height: examPct,
                                    backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.2) 3px, rgba(255,255,255,0.2) 6px)',
                                  }}
                                />
                              )}
                            </div>
                            <span className="text-[11px] font-bold text-slate-500 mt-2">{day}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Avg Performance Score Card (4 cols out of 12) */}
            {(() => {
              const attendedCount = metrics?.questions_attended ?? 0;
              const skippedCount = metrics?.questions_skipped ?? 0;
              const totalQuestions = attendedCount + skippedCount;
              const attendedPct = totalQuestions > 0 ? Math.round((attendedCount / totalQuestions) * 100) : 0;
              const skippedPct = totalQuestions > 0 ? Math.round((skippedCount / totalQuestions) * 100) : 0;

              return (
                <div className="md:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/70 shadow-sm flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-700">Avg performance score</h3>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-4xl font-black text-slate-900">
                        {metrics?.avg_performance_score ?? 0}%
                      </span>
                    </div>
                  </div>

                  {/* Detailed Attended and Skipped Metrics Breakdown */}
                  <div className="space-y-4 pt-3 border-t border-dashed border-slate-200">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-600 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#2F5241]" />
                          Attended Questions
                        </span>
                        <span className="text-slate-900 font-extrabold">
                          {attendedCount} <span className="text-[10px] text-slate-400 font-medium">({attendedPct}%)</span>
                        </span>
                      </div>
                      <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5">
                        <div
                          className="h-full bg-[#2F5241] rounded-full transition-all duration-500"
                          style={{ width: `${attendedPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-600 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                          Skipped Questions
                        </span>
                        <span className="text-slate-900 font-extrabold">
                          {skippedCount} <span className="text-[10px] text-slate-400 font-medium">({skippedPct}%)</span>
                        </span>
                      </div>
                      <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all duration-500"
                          style={{ width: `${skippedPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Bottom Sub-Row: Live Class (4 cols) + Exam Schedule (6 cols) + Mode Now / Mood (2 cols) */}
          <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            {/* Live Class Container (4 cols - STRICT DATE-SPECIFIC MEETING BINDING) */}
            {(() => {
              const selectedDayNum = selectedCalendarDay || todayDate.getDate();
              const selectedDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDayNum).padStart(2, '0')}`;
              const selectedDateMeetings = meetings.filter((m) => m.meeting_date === selectedDateStr);

              const formattedSelectedDate = new Date(currentYear, currentMonth, selectedDayNum).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              });

              const isMeetingOver = (meeting?: { end_time?: string; meeting_date?: string; status?: string }): boolean => {
                if (!meeting) return false;
                if (meeting.status === 'ended' || meeting.status === 'completed') return true;

                try {
                  const now = new Date();
                  if (meeting.meeting_date) {
                    const mDate = new Date(meeting.meeting_date);
                    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    const mDay = new Date(mDate.getFullYear(), mDate.getMonth(), mDate.getDate());
                    if (mDay < today) return true;
                  }

                  if (meeting.end_time) {
                    const timeStr = meeting.end_time.trim().toUpperCase();
                    const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
                    if (match) {
                      let hours = parseInt(match[1], 10);
                      const minutes = parseInt(match[2], 10);
                      const ampm = match[3];
                      if (ampm === 'PM' && hours < 12) hours += 12;
                      if (ampm === 'AM' && hours === 12) hours = 0;

                      const endDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
                      if (now > endDateTime) return true;
                    }
                  }
                } catch {}
                return false;
              };

              const activeOrUpcomingMeeting = selectedDateMeetings[0] || null;
              const meetingEnded = isMeetingOver(activeOrUpcomingMeeting);
              const isLive = activeOrUpcomingMeeting?.status === 'live' && !meetingEnded;

              return (
                <div className="w-full md:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/70 shadow-sm flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">Live Class</h3>
                      <p className="text-[11px] text-slate-500 font-medium">{formattedSelectedDate}</p>
                    </div>
                    {activeOrUpcomingMeeting ? (
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                        meetingEnded ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                      }`}>
                        <Clock className="w-3 h-3 text-indigo-500" />
                        {activeOrUpcomingMeeting.start_time} - {activeOrUpcomingMeeting.end_time}
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">
                        No Class Scheduled
                      </span>
                    )}
                  </div>

                  {/* Virtual Classroom Banner Container */}
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs min-h-[130px] group">
                    <img
                      src="/images/live_classroom_banner.png"
                      alt="Virtual Classroom Banner"
                      className={`w-full h-32 object-cover transition-all duration-300 ${
                        meetingEnded ? 'grayscale opacity-50' : 'group-hover:scale-105'
                      }`}
                    />
                    <div className={`absolute inset-0 flex flex-col items-center justify-center text-center p-3 transition-colors ${
                      isLive
                        ? 'bg-gradient-to-t from-slate-950/90 via-slate-900/60 to-emerald-950/40'
                        : meetingEnded
                        ? 'bg-slate-950/75'
                        : 'bg-gradient-to-t from-slate-950/85 via-slate-900/50 to-indigo-950/30'
                    }`}>
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-md mb-1 ${
                        isLive
                          ? 'bg-emerald-500 text-white animate-bounce ring-4 ring-emerald-400/30'
                          : meetingEnded
                          ? 'bg-slate-700/80 text-slate-300 border border-slate-600'
                          : 'bg-white/90 text-indigo-700 backdrop-blur-xs'
                      }`}>
                        <Video className="w-5 h-5" />
                      </div>
                      <span className={`text-xs font-black tracking-wide ${
                        isLive
                          ? 'text-emerald-300 drop-shadow-sm'
                          : meetingEnded
                          ? 'text-slate-300'
                          : 'text-white drop-shadow-sm'
                      }`}>
                        {isLive
                          ? '🔴 Live Session in Progress'
                          : meetingEnded
                          ? '✓ Session Completed'
                          : activeOrUpcomingMeeting
                          ? 'Virtual Classroom Session'
                          : `No Session Scheduled for ${formattedSelectedDate}`}
                      </span>
                    </div>
                  </div>

                  {activeOrUpcomingMeeting ? (
                    <div className="space-y-1 text-xs">
                      <p className="font-semibold text-slate-600 truncate">
                        Class: <span className="font-extrabold text-slate-900">{activeOrUpcomingMeeting.title}</span>
                      </p>
                      <p className="font-semibold text-slate-600 truncate">
                        Subject: <span className="font-medium text-slate-500">{activeOrUpcomingMeeting.subject}</span>
                      </p>
                      <p className="font-semibold text-slate-600 truncate">
                        Class link:{' '}
                        <span className={`font-bold underline underline-offset-2 font-mono text-[11px] ${
                          meetingEnded ? 'text-slate-400 line-through' : 'text-indigo-700'
                        }`}>
                          {activeOrUpcomingMeeting.meeting_link}
                        </span>
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-2 text-xs text-slate-500">
                      No live sessions scheduled for <span className="font-bold text-slate-800">{formattedSelectedDate}</span>. Select a highlighted date on the calendar matrix to view scheduled sessions.
                    </div>
                  )}

                  {activeOrUpcomingMeeting ? (
                    meetingEnded ? (
                      <button
                        type="button"
                        disabled
                        className="w-full py-3 rounded-2xl bg-slate-100 border border-slate-200 text-slate-400 font-extrabold text-xs cursor-not-allowed flex items-center justify-center gap-1.5 shadow-none"
                      >
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Session Completed</span>
                      </button>
                    ) : (
                      <a
                        href={activeOrUpcomingMeeting.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 rounded-2xl bg-[#4f46e5] hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Join Google Meet ({formattedSelectedDate})</span>
                      </a>
                    )
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigate('/task')}
                      className="w-full py-3 rounded-2xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-900 font-extrabold text-xs shadow-xs transition-all cursor-pointer active:scale-98"
                    >
                      Browse Practice Subjects
                    </button>
                  )}
                </div>
              );
            })()}

            {/* Exam Schedule Card (Dynamic interactive month view with COMPLETED HIGHLIGHTER) */}
            <div className="w-full md:col-span-6 bg-white rounded-3xl p-6 border border-slate-200/70 shadow-sm flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Exam schedule</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Click any date to inspect details</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200/80 px-2 py-1 rounded-xl shadow-2xs">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1 hover:bg-slate-200/70 rounded-lg text-slate-600 transition-colors cursor-pointer"
                    title="Previous month"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="min-w-[120px] text-center font-black text-slate-900">{monthNameYear}</span>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1 hover:bg-slate-200/70 rounded-lg text-slate-600 transition-colors cursor-pointer"
                    title="Next month"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-700 relative">
                {calendarDays.map((cell) => {
                  const isSelected = cell.isCurrentMonth && selectedCalendarDay === cell.day;

                  return (
                    <div
                      key={cell.dateKey}
                      onClick={() => cell.isCurrentMonth && setSelectedCalendarDay(cell.day)}
                      className={`py-2 rounded-xl flex items-center justify-center relative transition-all duration-150 ${
                        !cell.isCurrentMonth
                          ? 'text-slate-300 font-normal pointer-events-none'
                          : cell.isCompleted
                          ? 'bg-emerald-600 text-white font-black shadow-md cursor-pointer hover:scale-105 ring-2 ring-emerald-300/50'
                          : cell.hasExam
                          ? 'bg-slate-900 text-white font-black shadow-md cursor-pointer hover:scale-105'
                          : cell.hasMeeting
                          ? 'bg-indigo-600 text-white font-black shadow-md cursor-pointer hover:scale-105'
                          : cell.isToday
                          ? 'bg-indigo-50 text-indigo-700 font-extrabold border border-indigo-200 cursor-pointer hover:bg-indigo-100'
                          : isSelected
                          ? 'bg-slate-100 text-slate-900 font-black cursor-pointer ring-2 ring-slate-400'
                          : 'hover:bg-slate-100 text-slate-700 cursor-pointer'
                      }`}
                    >
                      {cell.day}

                      {/* Completed Highlighter Check Mark */}
                      {cell.isCompleted && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 text-slate-950 font-black text-[9px] flex items-center justify-center ring-1 ring-white shadow-2xs">
                          ✓
                        </span>
                      )}

                      {(cell.hasExam || cell.hasMeeting) && isSelected && (
                        <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-white border border-slate-200 p-2.5 rounded-xl shadow-xl text-left z-30 min-w-[160px] pointer-events-none">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <p className="text-[10px] font-black text-slate-900 truncate">
                              {cell.meetingTitle || (cell.hasExam ? 'Curriculum Assessment' : 'Live Session')}
                            </p>
                            {cell.isCompleted && (
                              <span className="text-[8px] font-black px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 shrink-0">
                                Completed
                              </span>
                            )}
                          </div>
                          <p className="text-[9px] font-semibold text-slate-400">
                            {cell.hasMeeting ? 'Live Google Meet' : 'Scheduled Assessment'}
                          </p>
                          <p className="text-[9px] font-bold text-indigo-600">
                            {cell.meetingTime || '11:00 AM - 01:00 PM'}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Status Indicator Legend with COMPLETED HIGHLIGHTER */}
              <div className="flex items-center justify-between pt-2 text-[10px] sm:text-[11px] text-slate-500 border-t border-slate-100 flex-wrap gap-2">
                <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-900" /> Assessment
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-indigo-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> Live Meeting
                </span>
                <span className="flex items-center gap-1.5 font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> ✓ Completed
                </span>
              </div>
            </div>

            {/* Mode now Global Theme Selector Card (Professional Vector SVG Icons) */}
            <div className="md:col-span-2 bg-white rounded-3xl p-4 border border-slate-200/70 shadow-sm flex flex-col items-center justify-between space-y-3">
              <span className="text-[11px] font-black text-slate-800 tracking-wider block text-center uppercase">
                MODE NOW
              </span>
              <div className="flex flex-col gap-2.5 items-center justify-center flex-1 my-auto w-full py-1">
                {availableThemes.map((t) => {
                  const Icon = t.icon;
                  const isActive = currentTheme === t.key;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setTheme(t.key)}
                      className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer shadow-2xs ${
                        isActive
                          ? `${t.activeColor} scale-105 shadow-xs`
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80 hover:scale-105'
                      }`}
                      title={`${t.name}: ${t.description}`}
                    >
                      <Icon className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LENGTHY VERTICAL CONTAINER (PROFILE AT TOP + TODO LIST BELOW) */}
        <div className="lg:col-span-4 xl:col-span-3 bg-white rounded-3xl border border-slate-200/70 shadow-sm flex flex-col divide-y divide-slate-100 overflow-hidden">
          {/* Top Section: Profile */}
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Profile</span>
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                title="Edit profile"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col items-center text-center space-y-3 py-1">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#2F5241] to-[#487A5F] text-white flex items-center justify-center font-black text-2xl ring-4 ring-emerald-100 shadow-md">
                {userInitials}
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-base text-slate-900">{studentName}</h4>
                <p className="text-xs font-semibold text-slate-500">
                  {profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : 'Student'} • Active Learner
                </p>
                <span className="inline-block mt-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-0.5 rounded-full capitalize">
                  {profile?.role || 'student'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="w-full py-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-extrabold text-xs transition-all cursor-pointer"
            >
              Manage Profile Settings
            </button>
          </div>

          {/* Bottom Section: Todo List */}
          <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900">Todo list</h3>
                <button
                  type="button"
                  onClick={() => setIsAddingTodo(!isAddingTodo)}
                  className="text-[10px] font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add Todo
                </button>
              </div>

              {/* Add Todo Input Form */}
              {isAddingTodo && (
                <form onSubmit={handleAddTodo} className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                      Topic Title
                    </label>
                    <input
                      type="text"
                      placeholder="Type any topic..."
                      value={newTodoTopic}
                      onChange={(e) => setNewTodoTopic(e.target.value)}
                      className="w-full text-[11px] p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-slate-800 bg-white"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                      Subject
                    </label>
                    <select
                      value={selectedTodoSubject}
                      onChange={(e) => setSelectedTodoSubject(e.target.value)}
                      className="w-full text-[11px] p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-slate-800 bg-white font-medium text-slate-800 cursor-pointer"
                    >
                      {existingSubjects.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingTodo(false)}
                      className="px-2.5 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 text-[10px] font-black text-white bg-slate-900 rounded-md"
                    >
                      Save Todo
                    </button>
                  </div>
                </form>
              )}

              {/* Todo List Items */}
              <div className="space-y-3 pt-1">
                {todos.map((todo) => (
                  <div
                    key={todo.id}
                    onClick={() => toggleTodo(todo.id)}
                    className="flex items-start gap-2.5 cursor-pointer group p-1.5 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div
                      className={`w-4 h-4 rounded-full border-2 mt-0.5 flex items-center justify-center transition-all flex-shrink-0 ${
                        todo.done
                          ? 'bg-slate-900 border-slate-900 text-white'
                          : 'border-slate-300 group-hover:border-slate-600'
                      }`}
                    >
                      {todo.done && <Check className="w-2.5 h-2.5" />}
                    </div>
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <p
                        className={`text-[11px] font-semibold leading-tight break-words ${
                          todo.done ? 'line-through text-slate-300' : 'text-slate-800'
                        }`}
                      >
                        {todo.text}
                      </p>
                      {todo.subject && (
                        <span className="inline-block text-[9px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          {todo.subject}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Drawer */}
      <NotificationsDrawer isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
    </div>
  );
};
