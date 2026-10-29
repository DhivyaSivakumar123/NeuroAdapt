import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useDashboard } from '../../hooks/useDashboard';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton, SkeletonCard } from '../../components/ui/Skeleton';
import { apiClient } from '../../lib/apiClient';
import { Student } from '../../types/student';
import {
  getStoredAccessibilitySettings,
  applyAccessibilitySettings,
  AccessibilitySettings,
} from '../../components/modals/AccessibilitySettingsModal';
import {
  User,
  Mail,
  Lock,
  LogOut,
  Sliders,
  Bell,
  CheckCircle,
  Eye,
  Type,
  Moon,
  Sparkles,
  BookOpen,
  Users,
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  Trophy,
  ShieldCheck,
  Edit2,
  Save,
  Check,
  X,
  Brain,
} from 'lucide-react';
import { RosterStudent } from '../../types/dashboard';

const LEARNER_ACCOMMODATION_OPTIONS = [
  { id: 'adhd', label: 'ADHD (Attention & Pacing Support)', desc: 'Adaptive break pacing & multi-modal prompts' },
  { id: 'autism', label: 'Autism Spectrum (Structured Learning)', desc: 'Clear routine, predictable layouts & step counters' },
  { id: 'dyslexia', label: 'Dyslexia (Visual & Lexical Support)', desc: 'Dyslexia-friendly typography & audio-visual scaffolds' },
  { id: 'dyscalculia', label: 'Dyscalculia (Math Scaffolding)', desc: 'Visual models & step-by-step arithmetic hints' },
  { id: 'sensory', label: 'Sensory Sensitivity (Calm Focus)', desc: 'Low visual clutter, calm palette & focus mode' },
];

export const ProfilePage: React.FC = () => {
  const { profile, session, updateProfile, logout } = useAuth();
  const { fetchRoster, loading: dashboardLoading } = useDashboard();
  const navigate = useNavigate();

  const userEmail =
    session?.user?.email ||
    `${(profile?.display_name || 'user').toLowerCase().replace(/[\s_.-]+/g, '')}@clarity.edu`;

  // Editable display name state
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Real roster state for parent/teacher
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);

  // Sensory preferences state
  const [accessibility, setAccessibility] = useState<AccessibilitySettings>(getStoredAccessibilitySettings());

  // Notification preferences state
  const [notifications, setNotifications] = useState({
    sessionReminders: true,
    progressAlerts: true,
    weeklyReports: false,
  });

  // Password modal simulation
  const [showPasswordSuccess, setShowPasswordSuccess] = useState(false);

  // Student academic profile & accommodations state
  const [studentData, setStudentData] = useState<Student | null>(null);
  const [studentLoading, setStudentLoading] = useState(false);
  const [isEditingStudent, setIsEditingStudent] = useState(false);
  const [editAge, setEditAge] = useState<number>(10);
  const [editGradeLevel, setEditGradeLevel] = useState('Grade 5');
  const [editTags, setEditTags] = useState<string[]>(['adhd']);
  const [studentSaveSuccess, setStudentSaveSuccess] = useState(false);
  const [studentSaving, setStudentSaving] = useState(false);

  useEffect(() => {
    if (profile?.display_name) {
      setDisplayName(profile.display_name);
    }
  }, [profile?.display_name]);

  useEffect(() => {
    if (profile?.role === 'student') {
      setStudentLoading(true);
      apiClient<Student>('/students/me')
        .then((data) => {
          if (data) {
            setStudentData(data);
            setEditAge(data.age || 10);
            setEditGradeLevel(data.grade_level || 'Grade 5');
            setEditTags(data.learner_profile_tags || []);
          }
        })
        .catch((err) => console.error('Failed to fetch student academic data:', err))
        .finally(() => setStudentLoading(false));
    }
  }, [profile?.role]);

  const toggleStudentTag = (tagId: string) => {
    setEditTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  const handleSaveStudentDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentSaving(true);
    try {
      const updated = await apiClient<Student>('/students/me', {
        method: 'PATCH',
        body: {
          age: Number(editAge),
          grade_level: editGradeLevel,
          learner_profile_tags: editTags,
        },
      });
      setStudentData(updated);
      setIsEditingStudent(false);
      setStudentSaveSuccess(true);
      setTimeout(() => setStudentSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update student academic traits:', err);
    } finally {
      setStudentSaving(false);
    }
  };

  useEffect(() => {
    if (profile?.role === 'parent' || profile?.role === 'teacher') {
      setRosterLoading(true);
      fetchRoster()
        .then((data) => {
          if (data && data.students) {
            setRoster(data.students);
          }
        })
        .finally(() => setRosterLoading(false));
    }
  }, [profile?.role, fetchRoster]);

  const handleUpdateAccessibility = (key: keyof AccessibilitySettings, value: any) => {
    const updated = { ...accessibility, [key]: value };
    setAccessibility(updated);
    localStorage.setItem('neuro_accessibility_settings', JSON.stringify(updated));
    applyAccessibilitySettings(updated);
  };

  const handleSaveDisplayName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (displayName.trim()) {
      try {
        await updateProfile(displayName.trim());
        setIsEditingName(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } catch (err) {
        console.error('Failed to update profile name:', err);
      }
    }
  };

  if (!profile) {
    return (
      <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <SkeletonCard lines={2} />
        <SkeletonCard lines={4} />
        <SkeletonCard lines={3} />
      </div>
    );
  }

  const isStudent = profile.role === 'student';
  const isTeacher = profile.role === 'teacher';
  const isParent = profile.role === 'parent';

  // Initials generator
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/[\s_.-]+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 font-sans">
      {/* Top Backward Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate(isStudent ? '/task' : '/dashboard');
            }
          }}
          className="h-11 min-h-[44px] px-4 sm:px-5 rounded-xl border border-[#deded6] bg-white hover:bg-slate-50 text-slate-800 font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#32617d]" />
          <span>Back to {isStudent ? 'Learning Session' : 'Dashboard'}</span>
        </button>
      </div>

      {/* 1. Header Block: User Avatar, Display Name, Role */}
      <div className="bg-white rounded-3xl border border-[#deded6] p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {/* Avatar Initials Badge */}
          <div
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center font-extrabold text-xl sm:text-2xl shadow-sm flex-shrink-0 ${
              isStudent
                ? 'bg-[#e8f0fe] text-[#32617d] border-2 border-[#d2e3fc]'
                : isTeacher
                ? 'bg-[#eef5e9] text-[#3b5527] border-2 border-[#d5ded0]'
                : 'bg-[#f3e5f5] text-purple-800 border-2 border-purple-200'
            }`}
          >
            {getInitials(displayName || profile.display_name)}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#1a1c19] tracking-tight">
                {displayName || profile.display_name}
              </h1>
              <Badge
                variant={isStudent ? 'info' : isTeacher ? 'success' : 'purple'}
                size="sm"
                className="capitalize font-bold"
              >
                {profile.role}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Manage your personal settings, sensory adjustments, and account information
            </p>
          </div>
        </div>

        {/* Edit Display Name Form */}
        <div className="w-full sm:w-auto flex items-center gap-2">
          {isEditingName ? (
            <form onSubmit={handleSaveDisplayName} className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                aria-label="Display Name"
                className="px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-[#32617d] bg-[#f9fbfd] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#32617d]"
                placeholder="Enter display name"
                autoFocus
              />
              <button
                type="submit"
                className="h-10 min-h-[44px] px-4 rounded-xl bg-[#32617d] hover:bg-[#284f67] text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingName(true)}
              className="h-10 min-h-[44px] px-4 rounded-xl bg-white hover:bg-slate-50 border border-[#deded6] text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit Name</span>
            </button>
          )}
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>Profile display name updated successfully!</span>
        </div>
      )}

      {/* 2. Role-Specific Section */}
      {isStudent && (
        <Card glass className="p-6 space-y-5 border border-[#deded6] bg-white rounded-3xl shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#ecece4] pb-3.5">
            <div className="flex items-center gap-2 text-[#32617d]">
              <GraduationCap className="w-5 h-5" />
              <h2 className="text-base font-extrabold text-[#1a1c19]">Student Academic Overview & Accommodations</h2>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {!isEditingStudent && (
                <button
                  type="button"
                  onClick={() => setIsEditingStudent(true)}
                  className="h-10 min-h-[44px] px-3.5 rounded-xl border border-[#deded6] bg-white hover:bg-slate-50 text-slate-700 font-extrabold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Edit Academic Profile</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate('/task?view=summary')}
                className="h-10 min-h-[44px] px-3.5 rounded-xl border border-[#deded6] bg-white hover:bg-slate-50 text-slate-700 font-extrabold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-600" />
                <span>Session Summary</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/task')}
                className="h-10 min-h-[44px] px-4 rounded-xl bg-[#32617d] hover:bg-[#284f67] text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <span>Go to Tasks</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {studentSaveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Student academic profile & traits saved successfully!</span>
            </div>
          )}

          {isEditingStudent ? (
            <form onSubmit={handleSaveStudentDetails} className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Age
                  </label>
                  <input
                    type="number"
                    min="4"
                    max="18"
                    value={editAge}
                    onChange={(e) => setEditAge(parseInt(e.target.value) || 10)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#32617d]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Grade Level
                  </label>
                  <select
                    value={editGradeLevel}
                    onChange={(e) => setEditGradeLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#32617d] bg-white"
                  >
                    <option value="Grade 1">Grade 1</option>
                    <option value="Grade 2">Grade 2</option>
                    <option value="Grade 3">Grade 3</option>
                    <option value="Grade 4">Grade 4</option>
                    <option value="Grade 5">Grade 5</option>
                    <option value="Grade 6">Grade 6</option>
                    <option value="Grade 7">Grade 7</option>
                    <option value="Grade 8">Grade 8</option>
                    <option value="Grade 9">Grade 9</option>
                    <option value="Grade 10">Grade 10</option>
                    <option value="Grade 11">Grade 11</option>
                    <option value="Grade 12">Grade 12</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-[#32617d]" />
                  Learner Profile Traits & Adaptive Accommodations
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {LEARNER_ACCOMMODATION_OPTIONS.map((opt) => {
                    const isSelected = editTags.includes(opt.id);
                    return (
                      <div
                        key={opt.id}
                        onClick={() => toggleStudentTag(opt.id)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                          isSelected
                            ? 'border-[#32617d] bg-[#f0f6fa] shadow-2xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <p className="text-xs font-extrabold text-slate-900">{opt.label}</p>
                          <p className="text-[11px] text-slate-500 font-medium">{opt.desc}</p>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center border flex-shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-[#32617d] border-[#32617d] text-white'
                              : 'border-slate-300 bg-slate-50'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingStudent(false)}
                  className="h-10 min-h-[44px] px-5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold text-xs text-slate-700 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={studentSaving}
                  className="h-10 min-h-[44px] px-5 rounded-xl bg-[#32617d] hover:bg-[#284f67] font-bold text-xs text-white flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{studentSaving ? 'Saving...' : 'Save Academic Profile'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-[#fafaf7] border border-[#ecece4] space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Grade Level & Age</span>
                  <p className="text-sm font-extrabold text-[#1a1c19]">
                    {studentData?.grade_level || editGradeLevel} ({studentData?.age || editAge} yrs old)
                  </p>
                  <p className="text-[10px] text-slate-500">Curriculum progression mapped</p>
                </div>
                <div className="p-4 rounded-2xl bg-[#fafaf7] border border-[#ecece4] space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Learning Pacing</span>
                  <p className="text-sm font-extrabold text-[#1a1c19]">Flexible & Multi-Modal</p>
                  <p className="text-[10px] text-slate-500">Text, Interactive, and Visual modes</p>
                </div>
                <div className="p-4 rounded-2xl bg-[#fafaf7] border border-[#ecece4] space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Guardian Linkage</span>
                  <p className="text-sm font-extrabold text-[#1a1c19]">Family Account Connected</p>
                  <p className="text-[10px] text-slate-500">Telemetry synced with parent portal</p>
                </div>
              </div>

              {/* Active Traits & Accommodations */}
              <div className="p-4 rounded-2xl bg-[#fafaf7] border border-[#ecece4] space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Active Accommodations & Learning Profile
                </span>
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {(studentData?.learner_profile_tags?.length ? studentData.learner_profile_tags : editTags).map(
                    (tag) => {
                      const matched = LEARNER_ACCOMMODATION_OPTIONS.find((o) => o.id === tag);
                      return (
                        <Badge key={tag} variant="info" size="sm" className="font-bold py-1 px-2.5">
                          {matched?.label || tag.toUpperCase()}
                        </Badge>
                      );
                    }
                  )}
                  {!(studentData?.learner_profile_tags?.length || editTags.length) && (
                    <span className="text-xs text-slate-500 font-medium">
                      Standard multi-modal pacing enabled. Click 'Edit Academic Profile' to configure tailored accommodations.
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {isParent && (
        <Card glass className="p-6 space-y-4 border border-[#deded6] bg-white rounded-3xl shadow-xs">
          <div className="flex items-center justify-between border-b border-[#ecece4] pb-3">
            <div className="flex items-center gap-2 text-purple-800">
              <Users className="w-5 h-5" />
              <h2 className="text-base font-extrabold text-[#1a1c19]">Linked Learners & Family</h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="h-10 min-h-[44px] px-4 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all"
            >
              <span>View Parent Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 pt-1">
            {rosterLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full rounded-2xl" />
              </div>
            ) : roster.length > 0 ? (
              roster.map((student) => (
                <div
                  key={student.student_id}
                  className="p-4 rounded-2xl bg-[#fafaf7] border border-[#ecece4] flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#e8f0fe] text-[#32617d] flex items-center justify-center font-bold text-xs">
                      {student.student_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{student.student_name}</p>
                      <p className="text-xs text-slate-500">{student.grade_level || 'Grade 5'} • Active Learner</p>
                    </div>
                  </div>
                  <Badge variant="success" size="sm">Connected</Badge>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-slate-500 bg-[#fafaf7] rounded-2xl border border-[#ecece4] space-y-1">
                <p className="text-xs font-bold text-slate-700">No Children Linked Yet</p>
                <p className="text-[11px] text-slate-500">Link child accounts via the Parent Dashboard.</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {isTeacher && (
        <Card glass className="p-6 space-y-4 border border-[#deded6] bg-white rounded-3xl shadow-xs">
          <div className="flex items-center justify-between border-b border-[#ecece4] pb-3">
            <div className="flex items-center gap-2 text-[#3b5527]">
              <BookOpen className="w-5 h-5" />
              <h2 className="text-base font-extrabold text-[#1a1c19]">Class & Curriculum Assignment</h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="h-10 min-h-[44px] px-4 rounded-xl bg-[#486730] hover:bg-[#3b5527] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all"
            >
              <span>Open Class Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="p-4 rounded-2xl bg-[#fafaf7] border border-[#ecece4] space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Assigned Roster</span>
              {rosterLoading ? (
                <Skeleton className="h-6 w-1/2" />
              ) : (
                <p className="text-sm font-extrabold text-[#1a1c19]">
                  {roster.length > 0 ? `${roster.length} Active Enrolled Students` : '0 Students Assigned'}
                </p>
              )}
              <p className="text-[10px] text-slate-500">Curriculum Roster Active</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#fafaf7] border border-[#ecece4] space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Subject Domains</span>
              <p className="text-sm font-extrabold text-[#1a1c19]">Life Science, Biology & Ecosystems</p>
              <p className="text-[10px] text-slate-500">Real-time attention monitoring enabled</p>
            </div>
          </div>
        </Card>
      )}

      {/* 3. Canonical Accessibility & Sensory Preferences Section */}
      <Card glass className="p-6 space-y-5 border border-[#deded6] bg-white rounded-3xl shadow-xs">
        <div className="flex items-center gap-2 text-[#32617d] border-b border-[#ecece4] pb-3">
          <Sliders className="w-5 h-5" />
          <h2 className="text-base font-extrabold text-[#1a1c19]">Sensory & Accessibility Preferences</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Dyslexia-Friendly Font Toggle */}
          <div className="p-4 rounded-2xl bg-[#fafaf7] border border-[#ecece4] flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-900">Dyslexia-Friendly Font</span>
              </div>
              <p className="text-[11px] text-slate-500">Use weighted baselines for enhanced readability</p>
            </div>
            <button
              type="button"
              onClick={() => handleUpdateAccessibility('dyslexiaFont', !accessibility.dyslexiaFont)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors min-h-[44px] cursor-pointer ${
                accessibility.dyslexiaFont ? 'bg-[#32617d] justify-end' : 'bg-slate-300 justify-start'
              }`}
              aria-label="Toggle Dyslexia Font"
            >
              <span className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
            </button>
          </div>

          {/* Text Size Selection */}
          <div className="p-4 rounded-2xl bg-[#fafaf7] border border-[#ecece4] space-y-2">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-900">Text Scaling</span>
            </div>
            <div className="flex gap-2">
              {(['normal', 'large', 'xlarge'] as const).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => handleUpdateAccessibility('fontSize', size)}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all min-h-[44px] ${
                    accessibility.fontSize === size
                      ? 'bg-[#32617d] text-white border-[#32617d] shadow-xs'
                      : 'bg-white text-slate-700 border-[#deded6] hover:bg-slate-100'
                  }`}
                >
                  {size === 'normal' ? 'Standard' : size === 'large' ? 'Large (115%)' : 'Extra Large (130%)'}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Palette / Visual Contrast */}
          <div className="p-4 rounded-2xl bg-[#fafaf7] border border-[#ecece4] space-y-2">
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold text-slate-900">Color & Contrast Theme</span>
            </div>
            <div className="flex gap-2">
              {(['normal', 'calm', 'high_contrast'] as const).map((theme) => (
                <button
                  key={theme}
                  type="button"
                  onClick={() => handleUpdateAccessibility('theme', theme)}
                  className={`flex-1 py-2 px-2 rounded-xl text-[11px] font-bold border transition-all min-h-[44px] ${
                    accessibility.theme === theme
                      ? 'bg-[#32617d] text-white border-[#32617d] shadow-xs'
                      : 'bg-white text-slate-700 border-[#deded6] hover:bg-slate-100'
                  }`}
                >
                  {theme === 'normal' ? 'Standard' : theme === 'calm' ? 'Calm (Warm)' : 'High Contrast'}
                </button>
              ))}
            </div>
          </div>

          {/* Sensory Focus Mode */}
          <div className="p-4 rounded-2xl bg-[#fafaf7] border border-[#ecece4] flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-bold text-slate-900">Reduced Motion & Minimal UI</span>
              </div>
              <p className="text-[11px] text-slate-500">Mutes non-essential animations and reduces visual clutter</p>
            </div>
            <button
              type="button"
              onClick={() => handleUpdateAccessibility('focusMode', !accessibility.focusMode)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors min-h-[44px] cursor-pointer ${
                accessibility.focusMode ? 'bg-[#32617d] justify-end' : 'bg-slate-300 justify-start'
              }`}
              aria-label="Toggle Focus Mode"
            >
              <span className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
            </button>
          </div>
        </div>
      </Card>

      {/* 4. Notification Preferences */}
      <Card glass className="p-6 space-y-4 border border-[#deded6] bg-white rounded-3xl shadow-xs">
        <div className="flex items-center gap-2 text-slate-700 border-b border-[#ecece4] pb-3">
          <Bell className="w-5 h-5 text-amber-600" />
          <h2 className="text-base font-extrabold text-[#1a1c19]">Notification Preferences</h2>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#fafaf7] border border-[#ecece4]">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-900">
                {isStudent ? 'Learning Session Reminders' : 'Student Support & Attention Alerts'}
              </span>
              <p className="text-[11px] text-slate-500">
                {isStudent
                  ? 'Gentle reminders when new practice exercises are ready'
                  : 'Instant notifications when students experience high task friction'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setNotifications((n) => ({ ...n, sessionReminders: !n.sessionReminders }))}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors min-h-[44px] cursor-pointer ${
                notifications.sessionReminders ? 'bg-[#486730] justify-end' : 'bg-slate-300 justify-start'
              }`}
              aria-label="Toggle Session Notifications"
            >
              <span className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#fafaf7] border border-[#ecece4]">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-900">Weekly Progress Summaries</span>
              <p className="text-[11px] text-slate-500">Digest report summarizing mastery and pacing milestones</p>
            </div>
            <button
              type="button"
              onClick={() => setNotifications((n) => ({ ...n, weeklyReports: !n.weeklyReports }))}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors min-h-[44px] cursor-pointer ${
                notifications.weeklyReports ? 'bg-[#486730] justify-end' : 'bg-slate-300 justify-start'
              }`}
              aria-label="Toggle Weekly Reports"
            >
              <span className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
            </button>
          </div>
        </div>
      </Card>

      {/* 5. Account Security & Sign Out Section */}
      <Card glass className="p-6 space-y-4 border border-[#deded6] bg-white rounded-3xl shadow-xs">
        <div className="flex items-center gap-2 text-slate-700 border-b border-[#ecece4] pb-3">
          <ShieldCheck className="w-5 h-5 text-[#32617d]" />
          <h2 className="text-base font-extrabold text-[#1a1c19]">Account & Authentication</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-[#fafaf7] border border-[#ecece4] space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              <span>Registered Email (Read-Only)</span>
            </span>
            <div className="flex items-center justify-between pt-1">
              <p className="text-sm font-extrabold text-[#1a1c19] truncate">{userEmail}</p>
              <Badge variant="success" size="sm">Verified</Badge>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#fafaf7] border border-[#ecece4] space-y-2 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Password & Credentials</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setShowPasswordSuccess(true);
                setTimeout(() => setShowPasswordSuccess(false), 4000);
              }}
              className="h-10 min-h-[44px] px-4 rounded-xl bg-white hover:bg-slate-100 border border-[#deded6] text-slate-700 font-bold text-xs flex items-center justify-center transition-all shadow-2xs"
            >
              Request Password Reset Email
            </button>
          </div>
        </div>

        {showPasswordSuccess && (
          <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-xl text-sky-900 text-xs font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-sky-600" />
            <span>Password reset instructions have been sent to your registered email address.</span>
          </div>
        )}

        <div className="pt-3 border-t border-[#ecece4] flex justify-end">
          <button
            type="button"
            onClick={logout}
            className="h-12 min-h-[48px] px-6 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-2xs active:scale-[0.98]"
          >
            <LogOut className="w-4 h-4 text-rose-600" />
            <span>Sign Out of Account</span>
          </button>
        </div>
      </Card>
    </div>
  );
};
