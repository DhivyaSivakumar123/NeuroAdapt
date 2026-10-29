import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { apiClient } from '../../lib/apiClient';
import { Meeting, MeetingListResponse, CreateMeetingPayload } from '../../types/meeting';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  Video,
  Calendar,
  Clock,
  Plus,
  Link2,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  Edit2,
  Sparkles,
  Users,
  Radio,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';

export const TeacherMeetings: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Mathematics');
  const [meetingLink, setMeetingLink] = useState('');
  const [meetingDate, setMeetingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('01:00 PM');
  const [endTime, setEndTime] = useState('02:00 PM');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const subjectOptions = [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Computer Science',
    'English Language Arts',
    'General Study Room',
  ];

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const data = await apiClient<MeetingListResponse>('/meetings');
      if (data && data.meetings) {
        setMeetings(data.meetings);
      }
    } catch (err) {
      console.error('Failed to fetch meetings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleCopyLink = (link: string, id: string) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim() || !meetingLink.trim()) {
      setFormError('Please enter a session title and meeting link.');
      return;
    }

    try {
      setSubmitting(true);
      const payload: CreateMeetingPayload = {
        title: title.trim(),
        subject,
        meeting_link: meetingLink.trim(),
        meeting_date: meetingDate,
        start_time: startTime,
        end_time: endTime,
        status: 'upcoming',
        description: description.trim() || undefined,
      };

      await apiClient<Meeting>('/meetings', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // Reset form & reload
      setTitle('');
      setMeetingLink('');
      setDescription('');
      setIsCreateModalOpen(false);
      await fetchMeetings();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create meeting.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'upcoming' | 'live' | 'completed') => {
    try {
      await apiClient<Meeting>(`/meetings/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      await fetchMeetings();
    } catch (err) {
      console.error('Failed to update meeting status:', err);
    }
  };

  const handleDeleteMeeting = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this live meeting?')) return;
    try {
      await apiClient(`/meetings/${id}`, { method: 'DELETE' });
      await fetchMeetings();
    } catch (err) {
      console.error('Failed to delete meeting:', err);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todaysMeetings = meetings.filter((m) => m.meeting_date === todayStr);
  const liveMeeting = meetings.find((m) => m.status === 'live');

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 font-sans text-slate-900 pb-16">
      {/* ── HEADER BANNER ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#171927] via-[#1e2238] to-[#292e48] p-6 sm:p-8 text-white shadow-2xl shadow-indigo-950/20 border border-slate-700/50">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-300 hover:text-white transition-colors cursor-pointer mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Teacher Dashboard
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/60 border border-indigo-400/40 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                <Video className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Live Classroom & Meetings
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 font-medium">
                  Schedule Google Meet, Zoom, and virtual tutoring sessions for today's curriculum
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="primary"
              onClick={() => setIsCreateModalOpen(true)}
              className="py-3 px-5 text-xs font-extrabold bg-[#4f46e5] hover:bg-indigo-700 shadow-md shadow-indigo-500/30 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Live Meeting</span>
            </Button>
          </div>
        </div>

        {/* Quick Stat Highlights */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-700/60">
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-3">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Live Sessions</p>
              <p className="text-base font-extrabold text-white">{liveMeeting ? '1 Active' : '0 Active'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-3">
            <Calendar className="w-5 h-5 text-indigo-400" />
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Scheduled Today</p>
              <p className="text-base font-extrabold text-white">{todaysMeetings.length} Meetings</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-3">
            <Users className="w-5 h-5 text-amber-400" />
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Target Scope</p>
              <p className="text-base font-extrabold text-white">All Class Students</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── SCHEDULED MEETINGS TIMELINE WITH TIME PRIORITY ─────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#4f46e5]" />
            <h2 className="text-lg font-extrabold text-slate-900">Today's Prioritized Schedule</h2>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Sorted by Earliest Start Time
          </span>
        </div>

        {loading ? (
          <div className="space-y-3">
            <div className="h-28 bg-white rounded-3xl animate-pulse border border-slate-100" />
            <div className="h-28 bg-white rounded-3xl animate-pulse border border-slate-100" />
          </div>
        ) : meetings.length === 0 ? (
          <Card glass className="p-8 text-center space-y-3 border-dashed border-2 border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Video className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-800">No Meetings Scheduled Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Schedule your first Google Meet session. It will immediately appear on the Student Dashboard with time priority.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-2 text-xs"
            >
              + Schedule Meeting
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {meetings.map((meeting) => {
              const isLive = meeting.status === 'live';
              const isCompleted = meeting.status === 'completed';

              return (
                <div
                  key={meeting.id}
                  className={`bg-white rounded-3xl p-5 border transition-all flex flex-col justify-between space-y-4 shadow-sm ${
                    isLive
                      ? 'border-emerald-400 ring-2 ring-emerald-300/40 shadow-emerald-500/10'
                      : isCompleted
                      ? 'border-slate-200 opacity-75'
                      : 'border-slate-200/80 hover:border-indigo-300'
                  }`}
                >
                  {/* Card Top: Subject Badge & Status */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {meeting.subject}
                      </span>

                      {isLive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 animate-pulse border border-emerald-300">
                          <span className="w-2 h-2 rounded-full bg-emerald-600" /> LIVE NOW
                        </span>
                      ) : isCompleted ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
                          Completed
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Upcoming
                        </span>
                      )}
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug line-clamp-2">
                        {meeting.title}
                      </h3>
                      {meeting.description && (
                        <p className="text-xs text-slate-500 font-medium mt-1 line-clamp-2">
                          {meeting.description}
                        </p>
                      )}
                    </div>

                    {/* Time and Date Tag */}
                    <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{meeting.start_time} - {meeting.end_time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Date: {meeting.meeting_date}</span>
                      </div>
                    </div>

                    {/* Google Meet Link Bar */}
                    <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs font-semibold text-indigo-900">
                      <span className="truncate flex-1 text-[11px] text-indigo-700 font-mono">
                        {meeting.meeting_link}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyLink(meeting.meeting_link, meeting.id)}
                        className="p-1 rounded-lg hover:bg-white text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                        title="Copy Link"
                      >
                        {copiedId === meeting.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <a
                      href={meeting.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 rounded-xl bg-[#4f46e5] hover:bg-indigo-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Launch Google Meet</span>
                    </a>

                    <div className="grid grid-cols-2 gap-2">
                      {!isLive && !isCompleted && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(meeting.id, 'live')}
                          className="py-1.5 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          Mark Live
                        </button>
                      )}
                      {isLive && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(meeting.id, 'completed')}
                          className="py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          Mark Done
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteMeeting(meeting.id)}
                        className="py-1.5 px-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── CREATE MEETING MODAL ───────────────────────────────────────── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                    Schedule Live Meeting
                  </h2>
                  <p className="text-xs text-slate-500">Provide Google Meet or Zoom class link</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateMeeting} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Session Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Higher Math Part-2 Solution & Live Walkthrough"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    {subjectOptions.map((subj) => (
                      <option key={subj} value={subj}>
                        {subj}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                  </input>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Start Time *</label>
                  <input
                    type="text"
                    placeholder="01:00 PM"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">End Time *</label>
                  <input
                    type="text"
                    placeholder="02:00 PM"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Google Meet / Meeting Link *
                </label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="meet.google.com/abc-defg-hij or zoom.us/j/..."
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    required
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description / Topic Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Chapter 4 questions discussion and interactive exercise review."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={submitting}
                  className="bg-[#4f46e5] hover:bg-indigo-700 text-white font-bold"
                >
                  Save & Publish Live Class
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
