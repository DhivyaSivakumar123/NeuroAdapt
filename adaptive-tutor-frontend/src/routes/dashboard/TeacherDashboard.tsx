import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useDashboard } from '../../hooks/useDashboard';
import { NeedsAttentionList } from './NeedsAttentionList';
import { ClassAnalytics } from './ClassAnalytics';
import { TaskCatalog } from './TaskCatalog';
import { AddStudentModal } from '../../components/modals/AddStudentModal';
import { FlaggedStudent, RosterStudent } from '../../types/dashboard';
import { Meeting, MeetingListResponse } from '../../types/meeting';
import { apiClient } from '../../lib/apiClient';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { SkeletonCard } from '../../components/ui/Skeleton';
import {
  Users,
  ChevronRight,
  Activity,
  UserPlus,
  BarChart3,
  BookOpen,
  Clock,
  Video,
  ExternalLink,
} from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const { profile } = useAuth();
  const {
    fetchFlaggedStudents,
    fetchRoster,
    createStudent,
    searchStudents,
    assignStudentToTeacher,
  } = useDashboard();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'roster' | 'analytics' | 'catalog'>('roster');
  const [flagged, setFlagged] = useState<FlaggedStudent[]>([]);
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetchFlaggedStudents(),
      fetchRoster(),
      apiClient<MeetingListResponse>('/meetings').catch(() => null),
    ])
      .then(([flaggedData, rosterData, meetingData]) => {
        if (flaggedData && flaggedData.flagged) {
          setFlagged(flaggedData.flagged);
        }
        if (rosterData && rosterData.students) {
          setRoster(rosterData.students);
        }
        if (meetingData && meetingData.meetings) {
          setMeetings(meetingData.meetings);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      apiClient<MeetingListResponse>('/meetings')
        .then((meetingData) => {
          if (meetingData && meetingData.meetings) {
            setMeetings(meetingData.meetings);
          }
        })
        .catch(() => {});
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchFlaggedStudents, fetchRoster]);

  const activeOrUpcomingMeeting =
    meetings.find((m) => m.status === 'live') ||
    meetings.find((m) => m.status === 'upcoming') ||
    meetings[0];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans text-slate-900 select-none pb-12">
      {/* ── TAB NAVIGATION BAR ───────────────────────────────────────────── */}
      <div className="flex border border-slate-200/80 gap-1.5 bg-white/80 p-1.5 rounded-2xl w-fit flex-wrap shadow-xs">
        <button
          onClick={() => setActiveTab('roster')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'roster'
              ? 'bg-[#4f46e5] text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Class Roster ({roster.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-[#4f46e5] text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Telemetry Analytics</span>
        </button>
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'catalog'
              ? 'bg-[#4f46e5] text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Curriculum Library</span>
        </button>
      </div>

      {/* ── CLASS ROSTER TAB (WITH INTEGRATED MEETING CARD) ──────────────── */}
      {activeTab === 'roster' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column: Assigned Students Roster */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>Class Roster</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Monitor active learners and inspect real-time focus levels
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddModalOpen(true)}
                className="bg-[#4f46e5] hover:bg-indigo-700 text-white font-bold text-xs"
              >
                <UserPlus className="w-4 h-4 mr-1.5" /> Enroll Student
              </Button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SkeletonCard lines={3} />
                <SkeletonCard lines={3} />
              </div>
            ) : roster.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {roster.map((student) => (
                  <Card
                    key={student.student_id}
                    glass
                    className="p-5 hover:shadow-md transition-all cursor-pointer border border-slate-200 hover:border-indigo-400 group space-y-3.5 bg-white rounded-3xl"
                    onClick={() => navigate(`/dashboard/student/${student.student_id}`)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-extrabold text-sm shadow-xs">
                          {student.student_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {student.student_name}
                          </h4>
                          <p className="text-xs text-slate-500 font-medium">{student.grade_level || 'Grade 5'} • Active Learner</p>
                        </div>
                      </div>
                      {student.classification === 'trigger_intervention' ? (
                        <Badge variant="danger" size="sm">Support Prompt Triggered</Badge>
                      ) : student.classification === 'flag_monitor' ? (
                        <Badge variant="warning" size="sm">Mild Pause</Badge>
                      ) : (
                        <Badge variant="success" size="sm">High Focus</Badge>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                      <span className="flex items-center gap-1.5 font-medium text-slate-700">
                        <Activity className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Focus Level:</span> <span className="font-extrabold text-slate-900">{Math.round((student.latest_score ?? 1.0) * 100)}%</span>
                      </span>
                      <span className="font-bold text-indigo-600 flex items-center group-hover:translate-x-0.5 transition-transform">
                        <span>Inspect Profile</span> <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card glass className="p-12 text-center text-slate-500 space-y-4 border-dashed border-2 border-slate-200 bg-white rounded-3xl">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                  <Users className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-bold text-slate-800">No Assigned Students Found</p>
                  <p className="text-xs max-w-sm mx-auto text-slate-600">
                    Enroll new students or link existing accounts to your class roster to begin real-time engagement telemetry tracking.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsAddModalOpen(true)}
                  className="mx-auto bg-[#4f46e5] hover:bg-indigo-700 text-white font-bold"
                >
                  <UserPlus className="w-4 h-4 mr-1.5" /> Enroll Student
                </Button>
              </Card>
            )}
          </div>

          {/* Right Column: Live Class Meeting Card + Attention List */}
          <div className="space-y-5">
            {/* Live Class & Google Meet Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-indigo-600" /> Today's Live Class
                </span>
                {activeOrUpcomingMeeting ? (
                  <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {activeOrUpcomingMeeting.start_time} - {activeOrUpcomingMeeting.end_time}
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">
                    No Live Classes
                  </span>
                )}
              </div>

              <div className={`rounded-2xl p-4 flex flex-col items-center text-center space-y-2 ${
                activeOrUpcomingMeeting?.status === 'live'
                  ? 'bg-emerald-50/80 border border-emerald-200'
                  : 'bg-indigo-50/50 border border-indigo-100'
              }`}>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  activeOrUpcomingMeeting?.status === 'live'
                    ? 'bg-emerald-600 text-white animate-pulse'
                    : 'bg-white text-indigo-600 shadow-xs'
                }`}>
                  <Video className="w-5 h-5" />
                </div>
                <span className={`text-xs font-extrabold ${
                  activeOrUpcomingMeeting?.status === 'live' ? 'text-emerald-900' : 'text-indigo-900'
                }`}>
                  {activeOrUpcomingMeeting?.status === 'live' ? 'Session Active (LIVE NOW)' : 'Scheduled Virtual Classroom'}
                </span>
              </div>

              {activeOrUpcomingMeeting ? (
                <div className="space-y-1 text-xs">
                  <p className="font-extrabold text-slate-900 truncate">
                    Class: {activeOrUpcomingMeeting.title}
                  </p>
                  <p className="font-medium text-slate-500 truncate">
                    Subject: {activeOrUpcomingMeeting.subject}
                  </p>
                  <p className="font-semibold text-indigo-600 truncate text-[11px] pt-1 font-mono">
                    {activeOrUpcomingMeeting.meeting_link}
                  </p>
                </div>
              ) : (
                <div className="text-center py-2 text-xs text-slate-500">
                  No meetings scheduled for today. Click below to schedule a Google Meet session.
                </div>
              )}

              <div className="space-y-2 pt-1">
                {activeOrUpcomingMeeting && (
                  <a
                    href={activeOrUpcomingMeeting.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 rounded-2xl bg-[#4f46e5] hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Launch Google Meet</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => navigate('/meetings')}
                  className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition-all cursor-pointer active:scale-98"
                >
                  📅 Schedule / Manage Meetings ({meetings.length})
                </button>
              </div>
            </div>

            {/* Needs Attention List */}
            {loading ? (
              <SkeletonCard lines={2} />
            ) : (
              <NeedsAttentionList
                flaggedStudents={flagged}
                onSelectStudent={(id) => navigate(`/dashboard/student/${id}`)}
              />
            )}
          </div>
        </div>
      )}

      {/* ── OTHER TABS (ANALYTICS, CATALOG) ──────────────────────────────── */}
      {activeTab === 'analytics' && <ClassAnalytics />}
      {activeTab === 'catalog' && <TaskCatalog />}

      <AddStudentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={loadData}
        role="teacher"
        onCreateStudent={createStudent}
        onSearchStudents={searchStudents}
        onAssignStudent={assignStudentToTeacher}
        existingStudentIds={roster.map((s) => s.student_id)}
      />
    </div>
  );
};
