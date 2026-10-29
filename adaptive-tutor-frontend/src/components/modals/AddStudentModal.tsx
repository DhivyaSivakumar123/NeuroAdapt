import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { StudentCreate } from '../../types/student';
import { X, UserPlus, Search, Check, Brain, KeyRound, Mail, Lock } from 'lucide-react';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  role: 'parent' | 'teacher';
  onCreateStudent: (data: StudentCreate) => Promise<any>;
  onSearchStudents?: (q: string) => Promise<any[]>;
  onAssignStudent?: (studentId: string) => Promise<boolean>;
  existingStudentIds?: string[];
}

const LEARNER_TAG_OPTIONS = [
  { id: 'adhd', label: 'ADHD (Attention & Pacing Support)', desc: 'Adaptive break pacing & multi-modal prompts' },
  { id: 'autism', label: 'Autism Spectrum (Structured Learning)', desc: 'Predictable layouts & step progression counters' },
  { id: 'dyslexia', label: 'Dyslexia (Visual & Lexical Support)', desc: 'Dyslexia-friendly typography & audio-visual scaffolds' },
  { id: 'dyscalculia', label: 'Dyscalculia (Math Scaffolding)', desc: 'Visual models & step-by-step arithmetic hints' },
  { id: 'sensory', label: 'Sensory Sensitivity (Calm Focus)', desc: 'Low visual clutter, calm palette & focus mode' },
];

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  role,
  onCreateStudent,
  onSearchStudents,
  onAssignStudent,
  existingStudentIds = [],
}) => {
  const [tab, setTab] = useState<'create' | 'link'>('create');
  const [name, setName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [age, setAge] = useState<number>(10);
  const [gradeLevel, setGradeLevel] = useState('Grade 5');
  const [selectedTags, setSelectedTags] = useState<string[]>(['adhd']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Link tab state for teachers
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  if (!isOpen) return null;

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide student name.');
      return;
    }
    if (!studentEmail.trim() || !studentEmail.includes('@')) {
      setError('Please provide a valid student login email.');
      return;
    }
    if (studentPassword.length < 6) {
      setError('Student password must be at least 6 characters.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onCreateStudent({
        name: name.trim(),
        email: studentEmail.trim(),
        password: studentPassword,
        age: Number(age) || 10,
        grade_level: gradeLevel.trim() || 'Grade 5',
        learner_profile_tags: selectedTags,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save student profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !onSearchStudents) return;
    setIsSearching(true);
    setError(null);
    try {
      const results = await onSearchStudents(searchQuery);
      setSearchResults(results);
    } catch (err: any) {
      setError(err?.message || 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAssign = async (studentId: string) => {
    if (!onAssignStudent) return;
    setIsSubmitting(true);
    try {
      const ok = await onAssignStudent(studentId);
      if (ok) {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to assign student');
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[99999] w-screen h-screen min-h-screen bg-slate-900/40 backdrop-blur-[3px] flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-[#deded6] overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-[#deded6] bg-[#fafaf7] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#e8f0fe] text-[#32617d] border border-[#d2e3fc] flex items-center justify-center shadow-2xs flex-shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-[#1a1c19] tracking-tight">
                {role === 'parent' ? 'Add Child Profile & Login' : 'Enroll Student in Class Roster'}
              </h3>
              <p className="text-xs font-semibold text-[#32617d]">
                {role === 'parent'
                  ? 'Set up personalized learning profile and login credentials'
                  : 'Enroll a new student or link an existing student profile'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white hover:bg-slate-100 border border-[#deded6] text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-extrabold flex-shrink-0">
          <button
            type="button"
            onClick={() => setTab('create')}
            className={`flex-1 py-3 text-center transition-all cursor-pointer ${tab === 'create'
                ? 'border-b-2 border-[#32617d] text-[#32617d] bg-white font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
          >
            {role === 'parent' ? 'Create New Child Profile' : 'Create New Student Profile'}
          </button>
          <button
            type="button"
            onClick={() => setTab('link')}
            className={`flex-1 py-3 text-center transition-all cursor-pointer ${tab === 'link'
                ? 'border-b-2 border-[#32617d] text-[#32617d] bg-white font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
          >
            {role === 'parent' ? 'Link Existing Child by Name' : 'Link Student to Class Roster'}
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-bold">
              {error}
            </div>
          )}

          {tab === 'create' ? (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Student Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Jordan Miller"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#deded6] bg-[#fafaf7] focus:bg-white text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#32617d]"
                />
              </div>

              {/* Student Mandatory Login Credentials */}
              <div className="p-4 bg-[#f0f6fa] rounded-2xl border border-[#d2e3fc] space-y-3">
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#1e3a5f]">
                  <KeyRound className="w-4 h-4 text-[#32617d]" />
                  <span>Student Login Account (Mandatory)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Login Email
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        placeholder="student@clarity.edu"
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                        required
                        className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[#deded6] bg-white text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#32617d]"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Password (min 6 chars)
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={studentPassword}
                        onChange={(e) => setStudentPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[#deded6] bg-white text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#32617d]"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  The learner will use these credentials to sign in directly into their interactive sessions.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Age
                  </label>
                  <input
                    type="number"
                    min="4"
                    max="18"
                    value={age}
                    onChange={(e) => setAge(parseInt(e.target.value) || 10)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#deded6] bg-[#fafaf7] focus:bg-white text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#32617d]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Grade Level
                  </label>
                  <select
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#deded6] bg-[#fafaf7] focus:bg-white text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#32617d]"
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
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-[#32617d]" />
                  Learner Profile Traits & Accommodations
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {LEARNER_TAG_OPTIONS.map((tag) => {
                    const isSelected = selectedTags.includes(tag.id);
                    return (
                      <div
                        key={tag.id}
                        onClick={() => toggleTag(tag.id)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${isSelected
                            ? 'border-[#32617d] bg-[#f0f6fa] shadow-2xs'
                            : 'border-[#deded6] hover:border-slate-300 bg-white'
                          }`}
                      >
                        <div className="space-y-0.5">
                          <p className="text-xs font-extrabold text-slate-900">{tag.label}</p>
                          <p className="text-[11px] text-slate-500 font-medium">{tag.desc}</p>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center border flex-shrink-0 transition-colors ${isSelected
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

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 h-11 min-h-[44px] rounded-xl border border-[#deded6] bg-white hover:bg-slate-50 font-extrabold text-xs text-slate-700 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-11 min-h-[44px] rounded-xl bg-[#32617d] hover:bg-[#284f67] font-extrabold text-xs text-white shadow-xs transition-all cursor-pointer active:scale-[0.98]"
                >
                  {isSubmitting ? 'Creating Account & Profile...' : role === 'parent' ? 'Add Child & Account' : 'Create & Enroll Student'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  placeholder="Type student name to search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#deded6] bg-[#fafaf7] focus:bg-white text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#32617d]"
                />
                <button
                  type="submit"
                  disabled={isSearching}
                  className="h-11 min-h-[44px] px-4 rounded-xl bg-[#32617d] hover:bg-[#284f67] text-white font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>{isSearching ? 'Searching...' : 'Search'}</span>
                </button>
              </form>

              <div className="max-h-60 overflow-y-auto space-y-2 pt-1">
                {searchResults.length > 0 ? (
                  searchResults.map((st) => {
                    const stId = st.id || st.student_id;
                    const isAlreadySelected = existingStudentIds.includes(stId);

                    return (
                      <div
                        key={stId}
                        className={`p-3.5 sm:p-4 rounded-2xl flex items-center justify-between transition-all ${isAlreadySelected
                            ? 'border-2 border-[#486730] bg-[#f2f8ee] shadow-xs ring-1 ring-[#486730]/20'
                            : 'border border-[#deded6] bg-white hover:bg-[#fafaf7]'
                          }`}
                      >
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-extrabold text-[#1a1c19]">{st.name}</p>
                            {isAlreadySelected && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#d8ebd0] text-[#2c471c] border border-[#b4d8a5] text-[10px] font-extrabold tracking-wide">
                                <Check className="w-3 h-3 text-[#2c471c] stroke-[3]" /> Already Selected
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">{st.grade_level || 'Grade 5'}</p>
                        </div>

                        {isAlreadySelected ? (
                          <div className="h-9 px-3.5 rounded-xl bg-[#e3f0dc] text-[#2c471c] border border-[#b4d8a5] font-extrabold text-xs flex items-center gap-1.5 shadow-2xs select-none">
                            <Check className="w-4 h-4 stroke-[3]" />
                            {/* <span>Selected by You</span> */}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAssign(st.id)}
                            disabled={isSubmitting}
                            className="h-9 min-h-[36px] px-3.5 rounded-xl border border-[#deded6] bg-white hover:bg-slate-50 text-[#32617d] font-extrabold text-xs transition-all cursor-pointer shadow-2xs"
                          >
                            {role === 'parent' ? '+ Link Child' : '+ Add to Class'}
                          </button>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 text-center py-6">
                    {searchQuery ? 'No matching students found.' : 'Search by student name above.'}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
