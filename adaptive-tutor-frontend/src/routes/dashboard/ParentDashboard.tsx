import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useDashboard } from '../../hooks/useDashboard';
import { NeedsAttentionList } from './NeedsAttentionList';
import { AddStudentModal } from '../../components/modals/AddStudentModal';
import { FlaggedStudent, RosterStudent } from '../../types/dashboard';
import { Meeting, MeetingListResponse } from '../../types/meeting';
import { apiClient } from '../../lib/apiClient';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton, SkeletonCard } from '../../components/ui/Skeleton';
import {
  Users,
  Heart,
  GraduationCap,
  ChevronRight,
  Activity,
  UserPlus,
  ShieldCheck,
  Video,
  Clock,
  ExternalLink,
} from 'lucide-react';

export const ParentDashboard: React.FC = () => {
  const { profile } = useAuth();
  const { fetchFlaggedStudents, fetchRoster, createStudent, searchStudents, assignStudentToParent } = useDashboard();
  const navigate = useNavigate();

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

  // Calculate average family focus
  const avgFocus =
    roster.length > 0
      ? Math.round(
          (roster.reduce((acc, s) => acc + (s.latest_score ?? 1.0), 0) / roster.length) * 100
        )
      : null;

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 font-sans">
      {/* 1. Header Section */}
      <div className="flex items-center justify-between border-b border-[#deded6] pb-4 flex-wrap gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#1a1c19] flex items-center gap-2.5 tracking-tight">
            <Users className="w-6 h-6 sm:w-7 sm:h-7 text-[#32617d]" />
            Parent Family Overview
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Monitor linked children's real-time engagement and select a student to view detailed analytics
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="h-10 min-h-[44px] px-4 rounded-xl bg-[#32617d] hover:bg-[#284f67] text-white font-extrabold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-[0.98]"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Child Profile</span>
        </button>
      </div>

      {/* 2. Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card glass className="p-5 border border-[#deded6] bg-white rounded-2xl shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              Linked Learners
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#e8f0fe] text-[#32617d] flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-8 w-16 my-1" />
          ) : (
            <p className="text-2xl font-extrabold text-[#1a1c19]">{roster.length}</p>
          )}
          <p className="text-xs text-slate-500 font-medium">Active Enrolled Children</p>
        </Card>

        <Card glass className="p-5 border border-[#deded6] bg-white rounded-2xl shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              Average Engagement
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#eef5e9] text-[#486730] flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-8 w-20 my-1" />
          ) : (
            <p className="text-2xl font-extrabold text-[#1a1c19]">
              {avgFocus !== null ? `${avgFocus}%` : '—'}
            </p>
          )}
          <p className="text-xs text-slate-500 font-medium">Real-Time Cognitive Attention</p>
        </Card>

        <Card glass className="p-5 border border-[#deded6] bg-white rounded-2xl shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              Family Learning State
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#f3e5f5] text-purple-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-8 w-28 my-1" />
          ) : (
            <p className="text-2xl font-extrabold text-[#1a1c19]">
              {flagged.length === 0 ? 'Steady Flow' : `${flagged.length} In Pause`}
            </p>
          )}
          <p className="text-xs text-slate-500 font-medium">
            {flagged.length === 0 ? 'All learners supported calmly' : 'Accommodations offered'}
          </p>
        </Card>
      </div>

      {/* 3. Main Content: Linked Children & Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Linked Children Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-[#1a1c19] flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#32617d]" />
              <span>Linked Children</span>
            </h3>
            <span className="text-xs font-bold text-slate-500">
              {loading ? 'Loading...' : `${roster.length} Child(ren) Linked`}
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SkeletonCard lines={3} />
              <SkeletonCard lines={3} />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {roster.length > 0 ? (
                roster.map((student) => {
                  const focusPercent = Math.round((student.latest_score ?? 1.0) * 100);
                  return (
                    <Card
                      key={student.student_id}
                      glass
                      className="p-5 hover:shadow-md transition-all cursor-pointer border border-[#deded6] hover:border-[#32617d] group space-y-4 bg-white rounded-2xl"
                      onClick={() => navigate(`/dashboard/student/${student.student_id}`)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-[#e8f0fe] text-[#32617d] flex items-center justify-center font-extrabold text-sm shadow-2xs flex-shrink-0 group-hover:scale-105 transition-transform">
                            {student.student_name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm text-[#1a1c19] group-hover:text-[#32617d] transition-colors leading-tight">
                              {student.student_name}
                            </h4>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                              {student.grade_level || 'Grade 5'} • Active Learner
                            </p>
                          </div>
                        </div>
                        {student.classification === 'trigger_intervention' ? (
                          <Badge variant="danger" size="sm">Break Suggested</Badge>
                        ) : student.classification === 'flag_monitor' ? (
                          <Badge variant="warning" size="sm">Mild Pause</Badge>
                        ) : (
                          <Badge variant="success" size="sm">Great Focus</Badge>
                        )}
                      </div>

                      {/* Focus Progress Bar */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                            <Activity className="w-3.5 h-3.5 text-[#32617d]" />
                            <span>Cognitive Focus</span>
                          </span>
                          <span className="font-extrabold text-slate-900">{focusPercent}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              focusPercent < 45
                                ? 'bg-rose-500'
                                : focusPercent < 70
                                ? 'bg-amber-500'
                                : 'bg-[#486730]'
                            }`}
                            style={{ width: `${Math.max(10, Math.min(100, focusPercent))}%` }}
                          />
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#ecece4] flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium text-[11px]">Real-time Telemetry</span>
                        <span className="font-extrabold text-[#32617d] flex items-center group-hover:translate-x-0.5 transition-transform">
                          View Insights <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                        </span>
                      </div>
                    </Card>
                  );
                })
              ) : (
                <Card glass className="p-8 text-center text-slate-500 space-y-4 col-span-2 border-dashed border-2 border-[#deded6] rounded-2xl bg-white">
                  <div className="w-12 h-12 rounded-2xl bg-[#e8f0fe] text-[#32617d] flex items-center justify-center mx-auto">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-extrabold text-[#1a1c19]">No Children Linked Yet</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Create or link your child's profile to monitor their personalized learning journey and focus trends.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(true)}
                    className="h-10 min-h-[44px] px-4 rounded-xl bg-[#32617d] hover:bg-[#284f67] text-white font-extrabold text-xs inline-flex items-center gap-1.5 mx-auto shadow-xs transition-all"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Add / Link Child</span>
                  </button>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Side Panel: Support & Guidance */}
        <div className="space-y-6">
          {loading ? (
            <SkeletonCard lines={2} />
          ) : (
            <NeedsAttentionList
              flaggedStudents={flagged}
              onSelectStudent={(id) => navigate(`/dashboard/student/${id}`)}
            />
          )}

          {/* Today's Live Sessions */}
          <div className="bg-white rounded-2xl border border-[#deded6] p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-[#32617d]" />
                <h4 className="text-sm font-extrabold text-[#1a1c19]">Today's Live Classes</h4>
              </div>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {meetings.length} Scheduled
              </span>
            </div>

            {meetings.length > 0 ? (
              <div className="space-y-2.5">
                {meetings.slice(0, 2).map((m) => (
                  <div key={m.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                        {m.subject}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" /> {m.start_time}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 truncate">{m.title}</p>
                    <a
                      href={m.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#32617d] hover:underline pt-0.5"
                    >
                      <ExternalLink className="w-3 h-3" /> Join Session
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 font-medium py-2">
                No live classes scheduled for today.
              </p>
            )}
          </div>

          <Card glass className="p-6 space-y-3 bg-[#fafaf7] border border-[#deded6] rounded-2xl shadow-2xs">
            <div className="flex items-center gap-2 text-[#32617d]">
              <Heart className="w-5 h-5 text-[#32617d]" />
              <h4 className="text-sm font-extrabold text-[#1a1c19]">Supportive Guidance</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Click on any child's card to view their complete real-time engagement trajectory chart, intervention history, and personalized learning insights.
            </p>
          </Card>
        </div>
      </div>

      <AddStudentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={loadData}
        role="parent"
        onCreateStudent={createStudent}
        onSearchStudents={searchStudents}
        onAssignStudent={assignStudentToParent}
        existingStudentIds={roster.map((s) => s.student_id)}
      />
    </div>
  );
};
