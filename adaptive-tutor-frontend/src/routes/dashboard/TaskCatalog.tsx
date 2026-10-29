import React, { useEffect, useState, useMemo } from 'react';
import { useTasks } from '../../hooks/useTasks';
import { Task, TaskCatalogResponse } from '../../types/task';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import {
  BookOpen,
  Search,
  Filter,
  Clock,
  Sparkles,
  Layers,
  Eye,
  FileText,
  CheckCircle2,
  HelpCircle,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  Maximize2,
  X,
  Tag,
  GraduationCap,
  Lightbulb,
  SlidersHorizontal,
  Compass,
  Brain,
  ExternalLink,
  Target,
} from 'lucide-react';

export const TaskCatalog: React.FC = () => {
  const { fetchTaskCatalog, loading } = useTasks();
  const [catalog, setCatalog] = useState<TaskCatalogResponse | null>(null);

  // Filter States
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | undefined>(undefined);
  const [selectedModality, setSelectedModality] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAllAnswers, setShowAllAnswers] = useState<boolean>(true);

  // Individual expanded items
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());
  const [previewTask, setPreviewTask] = useState<Task | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchTaskCatalog(selectedSubject || undefined, undefined, selectedDifficulty).then(setCatalog);
  }, [fetchTaskCatalog, selectedSubject, selectedDifficulty]);

  const allTasks = catalog?.tasks || [];

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return allTasks.filter((t) => {
      // Modality filter
      if (selectedModality !== 'all' && t.content_type !== selectedModality) {
        return false;
      }

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const body = t.content_body || t.content || {};
      const question = (body.question || body.prompt || body.task_text || body.text || '').toLowerCase();
      const answer = (body.answer || body.correct_answer || '').toLowerCase();
      const skill = (t.skill_tag || '').toLowerCase();
      const subj = (t.subject || '').toLowerCase();

      return (
        skill.includes(q) ||
        subj.includes(q) ||
        question.includes(q) ||
        answer.includes(q)
      );
    });
  }, [allTasks, selectedModality, searchQuery]);

  // Statistics Calculations
  const stats = useMemo(() => {
    const total = allTasks.length;
    const subjectsMap = new Map<string, number>();
    let interactiveCount = 0;
    let visualCount = 0;
    let textCount = 0;
    let totalDuration = 0;

    allTasks.forEach((t) => {
      const s = t.subject || 'General';
      subjectsMap.set(s, (subjectsMap.get(s) || 0) + 1);
      if (t.content_type === 'interactive') interactiveCount++;
      else if (t.content_type === 'visual') visualCount++;
      else textCount++;
      totalDuration += t.expected_duration_seconds || 60;
    });

    const avgDuration = total > 0 ? Math.round(totalDuration / total) : 60;

    return {
      total,
      subjectsMap,
      interactiveCount,
      visualCount,
      textCount,
      avgDuration,
    };
  }, [allTasks]);

  const toggleExpand = (id: string) => {
    setExpandedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopyTask = (task: Task) => {
    const body = task.content_body || task.content || {};
    const text = `[${task.subject.toUpperCase()} - ${task.skill_tag}] Difficulty L${task.difficulty_level}\nQ: ${
      body.question || body.prompt || ''
    }\nAnswer: ${body.answer || (body.options && body.correct_index !== undefined ? body.options[body.correct_index] : 'N/A')}`;
    navigator.clipboard.writeText(text);
    setCopiedId(task.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getDifficultyBadge = (level: number) => {
    switch (level) {
      case 1:
        return (
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            Level 1 • Foundational
          </span>
        );
      case 2:
        return (
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            Level 2 • Intermediate
          </span>
        );
      case 3:
        return (
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
            Level 3 • Advanced
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            Level {level}
          </span>
        );
    }
  };

  const getModalityIcon = (type: string) => {
    switch (type) {
      case 'interactive':
        return <Layers className="w-3.5 h-3.5 text-indigo-600" />;
      case 'visual':
        return <Eye className="w-3.5 h-3.5 text-purple-600" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-900 select-none pb-12">
      {/* ── 1. HEADER BANNER ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-indigo-50 text-indigo-700">
              <BookOpen className="w-6 h-6" />
            </div>
            <span>Curriculum & Adaptive Task Catalog</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Browse structured learning modules, inspect adaptive scaffolding hints, and preview tasks for your students.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAllAnswers((prev) => !prev)}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              showAllAnswers
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{showAllAnswers ? 'Answer Keys Visible' : 'Show Answer Keys'}</span>
          </button>
        </div>
      </div>

      {/* ── 2. METRIC SUMMARY STATS CARDS ────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900">{stats.total}</div>
            <div className="text-[11px] font-bold text-slate-500">Total Curriculum Tasks</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900">{stats.subjectsMap.size}</div>
            <div className="text-[11px] font-bold text-slate-500">Active Subjects</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              {stats.interactiveCount + stats.visualCount}
            </div>
            <div className="text-[11px] font-bold text-slate-500">Adaptive Interactive/Visual</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900">{stats.avgDuration}s</div>
            <div className="text-[11px] font-bold text-slate-500">Avg Target Duration</div>
          </div>
        </div>
      </div>

      {/* ── 3. SUBJECT FILTER PILLS ROW ───────────────────────────────────── */}
      {catalog?.subjects && catalog.subjects.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedSubject('')}
            className={`px-3.5 py-1.5 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              selectedSubject === ''
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            <span>All Subjects</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedSubject === '' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {allTasks.length}
            </span>
          </button>

          {catalog.subjects.map((sub) => {
            const count = stats.subjectsMap.get(sub) || 0;
            const isSelected = selectedSubject.toLowerCase() === sub.toLowerCase();

            return (
              <button
                key={sub}
                type="button"
                onClick={() => setSelectedSubject(isSelected ? '' : sub)}
                className={`px-3.5 py-1.5 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 capitalize ${
                  isSelected
                    ? 'bg-[#4f46e5] text-white shadow-md shadow-indigo-500/20'
                    : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                <span>{sub.replace(/_/g, ' ')}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── 4. ADVANCED SEARCH & FILTER CONTROLS ──────────────────────────── */}
      <Card className="p-4 sm:p-5 border border-slate-200/80 shadow-sm bg-white rounded-3xl space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search skill tag, question text, or answer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
            />
          </div>

          {/* Modality Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedModality}
              onChange={(e) => setSelectedModality(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="all">All Modalities</option>
              <option value="text">Text Questions</option>
              <option value="interactive">Interactive Multiple Choice</option>
              <option value="visual">Visual & Diagram</option>
            </select>
          </div>

          {/* Difficulty Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedDifficulty ?? ''}
              onChange={(e) =>
                setSelectedDifficulty(e.target.value ? Number(e.target.value) : undefined)
              }
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">All Difficulties</option>
              <option value="1">Level 1 (Foundational)</option>
              <option value="2">Level 2 (Intermediate)</option>
              <option value="3">Level 3 (Advanced Challenge)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* ── 5. TASK CARDS GRID ───────────────────────────────────────────── */}
      {loading && !catalog ? (
        <div className="p-16 text-center space-y-3 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" />
          <p className="text-xs font-bold text-slate-500">Loading curriculum library from database...</p>
        </div>
      ) : filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredTasks.map((task) => {
            const body = task.content_body || task.content || {};
            const questionText =
              body.question || body.prompt || body.task_text || body.text || 'Solve problem';
            const hints = body.hints && Array.isArray(body.hints) ? body.hints : [];
            const isExpanded = expandedTaskIds.has(task.id);
            const isCopied = copiedId === task.id;

            // Determine Answer Text
            let answerText = body.answer || body.correct_answer || '';
            if (!answerText && body.options && body.correct_index !== undefined) {
              answerText = body.options[body.correct_index];
            }

            return (
              <Card
                key={task.id}
                className="p-5 sm:p-6 bg-white rounded-3xl border border-slate-200/90 hover:border-indigo-300 transition-all flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md group"
              >
                <div className="space-y-3.5">
                  {/* Card Header: Subject, Skill, Duration, and Quick Actions */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
                        {task.subject.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        #{task.skill_tag}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopyTask(task)}
                        className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                        title="Copy Task Text for Assignment"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setPreviewTask(task)}
                        className="p-1.5 rounded-xl hover:bg-indigo-50 text-slate-500 hover:text-indigo-700 transition-colors cursor-pointer"
                        title="Preview Student Experience"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>

                      <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 ml-1 bg-slate-50 px-2 py-0.5 rounded-lg">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {task.expected_duration_seconds}s
                      </span>
                    </div>
                  </div>

                  {/* Question Prompt */}
                  <div className="space-y-1.5">
                    <h4 className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug">
                      {questionText}
                    </h4>
                    {body.passage && (
                      <p className="text-xs text-slate-600 italic bg-slate-50 p-3 rounded-2xl border border-slate-100 leading-relaxed">
                        "{body.passage}"
                      </p>
                    )}
                  </div>

                  {/* Multiple Choice Options Preview */}
                  {body.options && Array.isArray(body.options) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {body.options.map((opt: string, i: number) => {
                        const isCorrectOption = showAllAnswers && body.correct_index === i;

                        return (
                          <div
                            key={i}
                            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between border transition-all ${
                              isCorrectOption
                                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 font-extrabold shadow-2xs'
                                : 'bg-slate-50/60 border-slate-200/80 text-slate-700'
                            }`}
                          >
                            <span className="truncate">{opt}</span>
                            {isCorrectOption && (
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1.5" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Answer Key Reveal (When Enabled) */}
                  {showAllAnswers && answerText && !body.options && (
                    <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>Answer Key:</span>
                        <span className="font-extrabold underline underline-offset-2 font-mono">
                          {answerText}
                        </span>
                      </div>
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md uppercase">
                        Verified
                      </span>
                    </div>
                  )}

                  {/* Scaffolding Hints Dropdown */}
                  {hints.length > 0 && (
                    <div className="border border-amber-100 bg-amber-50/40 rounded-2xl p-2.5 space-y-1.5">
                      <button
                        type="button"
                        onClick={() => toggleExpand(task.id)}
                        className="w-full flex items-center justify-between text-xs font-black text-amber-900 cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                          <span>Adaptive Scaffolding Hints ({hints.length})</span>
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-amber-600" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-amber-600" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="pt-1.5 space-y-1 text-xs text-amber-800 font-medium">
                          {hints.map((h: string, idx: number) => (
                            <p key={idx} className="flex items-start gap-1.5">
                              <span className="font-bold text-amber-600">•</span>
                              <span>{h}</span>
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Footer: Modality & Difficulty Level */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1.5 font-bold text-slate-700">
                    {getModalityIcon(task.content_type)}
                    <span className="capitalize">{task.content_type} Modality</span>
                  </span>
                  <div>{getDifficultyBadge(task.difficulty_level)}</div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-16 text-center text-slate-400 space-y-3 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <p className="text-base font-extrabold text-slate-800">No tasks match your selected filters</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query or reset your subject and difficulty filter options.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSelectedSubject('');
              setSelectedDifficulty(undefined);
              setSelectedModality('all');
              setSearchQuery('');
            }}
            className="text-xs py-2 px-4 rounded-xl cursor-pointer"
          >
            Reset All Filters
          </Button>
        </Card>
      )}

      {/* ── 6. STUDENT EXPERIENCE PREVIEW MODAL ──────────────────────────── */}
      {previewTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-800">
                    {previewTask.subject}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {previewTask.skill_tag}
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900 pt-1">
                  Student Interactive Preview
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewTask(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Simulated Question */}
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Question Prompt
                </span>
                <p className="text-sm font-extrabold text-slate-900">
                  {previewTask.content_body?.question ||
                    previewTask.content_body?.prompt ||
                    'Solve the question'}
                </p>
                {previewTask.content_body?.passage && (
                  <p className="text-xs text-slate-600 italic bg-white p-3 rounded-xl border border-slate-200">
                    "{previewTask.content_body.passage}"
                  </p>
                )}
              </div>

              {/* Options / Input Simulation */}
              {previewTask.content_body?.options && Array.isArray(previewTask.content_body.options) ? (
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Interactive Choices
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {previewTask.content_body.options.map((opt: string, idx: number) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between ${
                          idx === previewTask.content_body?.correct_index
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                            : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      >
                        <span>{opt}</span>
                        {idx === previewTask.content_body?.correct_index && (
                          <Check className="w-4 h-4 text-emerald-600" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Free-Text Answer Expected
                  </span>
                  <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono text-slate-800">
                    Expected: {previewTask.content_body?.answer || 'Free response'}
                  </div>
                </div>
              )}

              {/* Adaptive Scaffolding Hints */}
              {previewTask.content_body?.hints && previewTask.content_body.hints.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-1">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-700" /> Scaffolded Hints
                  </span>
                  {previewTask.content_body.hints.map((h: string, idx: number) => (
                    <p key={idx} className="text-xs text-amber-800 font-medium">
                      • {h}
                    </p>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="primary"
                onClick={() => setPreviewTask(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs py-2 px-5 rounded-xl cursor-pointer"
              >
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
