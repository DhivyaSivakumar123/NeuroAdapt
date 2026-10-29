import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useSession } from '../../hooks/useSession';
import { apiClient } from '../../lib/apiClient';
import { useTasks } from '../../hooks/useTasks';
import { useEventLogger } from '../../hooks/useEventLogger';
import { useInterventions } from '../../hooks/useInterventions';
import { SelfReportPrompt } from './SelfReportPrompt';
import { SessionSummary } from './SessionSummary';
import { InterventionOverlay } from './InterventionOverlay';
import { TextModeRenderer } from './renderers/TextModeRenderer';
import {
  applyAccessibilitySettings,
  getStoredAccessibilitySettings,
} from '../../components/modals/AccessibilitySettingsModal';
import { InterventionType } from '../../types/intervention';
import {
  CheckCircle,
  AlertCircle,
  ArrowRight,
  FlaskConical,
  HelpCircle,
  FileText,
  Image as ImageIcon,
  MousePointer2,
  Lightbulb,
  Sparkles,
  Trophy,
  BookOpen,
  ExternalLink,
  LayoutGrid,
} from 'lucide-react';
import { SubjectSelectionHub, SUBJECT_CATALOG } from './SubjectSelectionHub';

/** Number of correct answers that form one badge (triggers the confidence self-report) */
const BADGE_SIZE = 3;

export const TaskView: React.FC = () => {
  const { profile } = useAuth();
  const { activeSession, startSession } = useSession();
  const { currentTask, loading: taskLoading, fetchNextTask, submitAnswer, setCurrentTask } = useTasks();
  const {
    logTaskStart,
    logTaskSwitchAway,
    logTaskSwitchBack,
    logAnswerSubmit,
    logRetry,
    logIdlePing,
    logSelfReport,
    logTaskComplete,
    logTaskAbandon,
  } = useEventLogger();
  const { fetchInterventions, simulateIntervention } = useInterventions();

  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [taskStartTime, setTaskStartTime] = useState<number | null>(null);
  const [showSelfReport, setShowSelfReport] = useState(false);
  const [showInterventionModal, setShowInterventionModal] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [displayMode] = useState<'text'>('text');
  // Track number of correct answers in the current badge (resets every BADGE_SIZE)
  const [badgeProgress, setBadgeProgress] = useState(0);
  // Local submitting flag — keeps Submit button disabled without triggering skeleton
  const [submitting, setSubmitting] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [conceptBreakdown, setConceptBreakdown] = useState<string | null>(null);
  const [showWorkedExample, setShowWorkedExample] = useState<boolean>(false);
  const [showCalmingBreak, setShowCalmingBreak] = useState<boolean>(false);
  const [breakTimer, setBreakTimer] = useState<number>(60);

  const [selectedSubject, setSelectedSubject] = useState<string>('biology');
  const [selectedSkillTag, setSelectedSkillTag] = useState<string | undefined>(undefined);
  const [isSelectingSubject, setIsSelectingSubject] = useState<boolean>(!currentTask);

  useEffect(() => {
    if (currentTask) {
      setIsSelectingSubject(false);
    }
  }, [currentTask]);

  // Calming break countdown timer effect
  useEffect(() => {
    let timerId: any;
    if (showCalmingBreak && breakTimer > 0) {
      timerId = setInterval(() => setBreakTimer((prev) => prev - 1), 1000);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [showCalmingBreak, breakTimer]);

  // Holds the next task pre-fetched in the background while feedback is displayed
  const prefetchedNextTask = useRef<any>(null);
  const sessionStartTime = useRef<number>(Date.now());

  const markTopicCompleted = useCallback((tag?: string) => {
    if (!tag) return;
    try {
      const userKey = `completed_student_topics_${profile?.id || 'default'}`;
      const prevUser = JSON.parse(localStorage.getItem(userKey) || '[]');
      if (!prevUser.includes(tag)) {
        localStorage.setItem(userKey, JSON.stringify([...prevUser, tag]));
      }
      const genericKey = 'completed_student_topics';
      const prevGeneric = JSON.parse(localStorage.getItem(genericKey) || '[]');
      if (!prevGeneric.includes(tag)) {
        localStorage.setItem(genericKey, JSON.stringify([...prevGeneric, tag]));
      }
    } catch {}
  }, [profile?.id]);

  const handleSelectTopic = async (subjectId: string, skillTag: string) => {
    if (!profile) return;
    setSelectedSubject(subjectId);
    setSelectedSkillTag(skillTag);
    setIsSelectingSubject(false);
    setCompletedCount(0);
    sessionStartTime.current = Date.now();
    prefetchedNextTask.current = null;

    try {
      let sess = activeSession;
      if (!sess || sess.subject !== subjectId) {
        sess = await startSession(profile.id, subjectId);
      }
      if (sess) {
        const next = await fetchNextTask(profile.id, sess.id, subjectId, skillTag);
        if (!next || next.subject !== subjectId || (skillTag && next.skill_tag !== skillTag)) {
          markTopicCompleted(skillTag);
          setSessionCompleted(true);
        }
      }
    } catch (e) {
      console.error('Failed to launch topic session:', e);
    }
  };

  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastInteractionRef = useRef<number>(Date.now());

  // Check if navigating directly to view summary
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'summary') {
        setSessionCompleted(true);
      }
    }
  }, []);

  // Initialize accessibility settings on mount
  useEffect(() => {
    applyAccessibilitySettings(getStoredAccessibilitySettings());
  }, []);

  const handleSelectIntervention = async (type: InterventionType) => {
    if (!activeSession || !currentTask) return;
    try {
      await simulateIntervention(activeSession.id, currentTask.id, type);
      setShowInterventionModal(false);

      if (type === 're_chunk') {
        const topicName = (currentTask.skill_tag || 'this topic').replace(/_/g, ' ');
        const body = currentTask.content_body || currentTask.content || {};
        const text = body.explanation || body.passage || body.context ||
          `Core Concept Breakdown: In ${topicName}, break down the problem into key parts. First, identify what is given in the prompt, then match it against the underlying principles step-by-step.`;
        setConceptBreakdown(text);
      } else if (type === 'modality_switch') {
        setShowHint(true);
      } else if (type === 'difficulty_step_down') {
        setShowWorkedExample(true);
      } else if (type === 'break_task') {
        setBreakTimer(60);
        setShowCalmingBreak(true);
      }
    } catch (e) {
      console.error('Intervention error:', e);
      setShowInterventionModal(false);
    }
  };

  // 1. Initialize session if not active
  useEffect(() => {
    if (!profile) return;
    if (!activeSession) {
      startSession(profile.id, selectedSubject).catch((err) => {
        console.error('Session start error:', err);
      });
    }
  }, [profile?.id, activeSession?.id, selectedSubject]);

  // 2. Fetch initial next task when session is ready and topic selected
  useEffect(() => {
    if (profile && activeSession && !currentTask && !sessionCompleted && !isSelectingSubject) {
      fetchNextTask(profile.id, activeSession.id, selectedSubject, selectedSkillTag).then((task) => {
        if (!task || task.subject !== selectedSubject || (selectedSkillTag && task.skill_tag !== selectedSkillTag)) {
          markTopicCompleted(selectedSkillTag);
          setSessionCompleted(true);
        }
      });
    }
  }, [profile?.id, activeSession?.id, currentTask, sessionCompleted, isSelectingSubject, selectedSubject, selectedSkillTag, markTopicCompleted]);


  // 3. Handle task initialization & task_start event
  useEffect(() => {
    if (activeSession && currentTask) {
      setTaskStartTime(Date.now());
      setAttemptCount(0);
      setFeedback(null);
      setUserAnswer('');
      setShowSelfReport(false);
      logTaskStart(activeSession.id, currentTask.id);
    }
  }, [activeSession?.id, currentTask?.id]);

  // 4. Tab visibility switch listeners
  useEffect(() => {
    if (!activeSession || !currentTask) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        logTaskSwitchAway(activeSession.id, currentTask.id);
      } else {
        logTaskSwitchBack(activeSession.id, currentTask.id);
      }
    };

    const handleBlur = () => {
      logTaskSwitchAway(activeSession.id, currentTask.id);
    };

    const handleFocus = () => {
      logTaskSwitchBack(activeSession.id, currentTask.id);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [activeSession?.id, currentTask?.id]);

  // 5. Idle Ping Heartbeat
  useEffect(() => {
    if (!activeSession || !currentTask) return;

    const IDLE_CHECK_INTERVAL_MS = 15000;
    const IDLE_THRESHOLD_SECONDS = 30;

    idleTimerRef.current = setInterval(() => {
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - lastInteractionRef.current) / 1000);

      if (elapsedSeconds >= IDLE_THRESHOLD_SECONDS) {
        logIdlePing(activeSession.id, currentTask.id, elapsedSeconds);
      }
    }, IDLE_CHECK_INTERVAL_MS);

    return () => {
      if (idleTimerRef.current) clearInterval(idleTimerRef.current);
    };
  }, [activeSession?.id, currentTask?.id]);

  const recordUserInteraction = useCallback(() => {
    lastInteractionRef.current = Date.now();
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeSession || !currentTask || !userAnswer.trim() || submitting) return;

    recordUserInteraction();
    setSubmitting(true);
    const newAttempt = attemptCount + 1;
    setAttemptCount(newAttempt);

    if (newAttempt > 1) {
      logRetry(activeSession.id, currentTask.id, newAttempt).catch(() => {});
    }

    try {
      const actualDuration = taskStartTime ? Math.floor((Date.now() - taskStartTime) / 1000) : 10;
      const response = await submitAnswer(currentTask.id, activeSession.id, userAnswer.trim(), actualDuration);
      setFeedback({ correct: response.correct, message: response.feedback });

      // Log answer submission
      logAnswerSubmit(activeSession.id, currentTask.id, response.correct, userAnswer.trim()).catch(() => {});

      if (response.correct) {
        const newCompleted = completedCount + 1;
        setCompletedCount(newCompleted);

        // Await task completion in backend so next-task query immediately registers it as completed
        await logTaskComplete(activeSession.id, currentTask.id, true, actualDuration).catch(() => {});

        // Pre-fetch next task immediately in the background so transition is seamless
        if (profile && activeSession) {
          apiClient<any>(`/students/${profile.id}/next-task`, {
            params: { session_id: activeSession.id, subject: selectedSubject, skill_tag: selectedSkillTag },
          }).then((task) => {
            // Guard: ensure task is not the one just solved and matches subject/topic
            if (
              task &&
              (task.id === currentTask.id ||
                task.subject !== selectedSubject ||
                (selectedSkillTag && task.skill_tag !== selectedSkillTag))
            ) {
              prefetchedNextTask.current = null;
            } else {
              prefetchedNextTask.current = task;
            }
          }).catch(() => {
            prefetchedNextTask.current = null;
          });
        }
        // Show correct feedback briefly then proceed to next task
        setTimeout(() => loadNextTask(), 1000);
      } else {
        fetchInterventions(activeSession.id).then((sessionInterventions) => {
          if (sessionInterventions && sessionInterventions.length > 0) {
            const latest = sessionInterventions[sessionInterventions.length - 1];
            if (!latest.outcome) {
              setShowInterventionModal(true);
            }
          }
        }).catch(() => {});
      }
    } catch (err: any) {
      console.error('Answer submission failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelfReportSubmit = async (score: number) => {
    if (activeSession && currentTask) {
      logSelfReport(activeSession.id, currentTask.id, score).catch(() => {});
    }
    loadNextTask();
  };

  const loadNextTask = async () => {
    if (!profile || !activeSession) return;
    setShowSelfReport(false);
    setFeedback(null);
    setUserAnswer('');
    setShowHint(false);
    setShowInterventionModal(false);
    setConceptBreakdown(null);
    setShowWorkedExample(false);
    setShowCalmingBreak(false);

    // If we already prefetched the next task, validate and use it
    if (prefetchedNextTask.current !== undefined && prefetchedNextTask.current !== null) {
      const preloaded = prefetchedNextTask.current;
      prefetchedNextTask.current = null;

      if (
        preloaded &&
        preloaded.subject === selectedSubject &&
        (!selectedSkillTag || preloaded.skill_tag === selectedSkillTag)
      ) {
        setCurrentTask(preloaded);
        return;
      }
      // If preloaded is null or mismatched, topic is completed
      markTopicCompleted(selectedSkillTag);
      setSessionCompleted(true);
      return;
    }

    // Otherwise fall back to a fresh fetch (shows skeleton)
    setCurrentTask(null);
    const next = await fetchNextTask(profile.id, activeSession.id, selectedSubject, selectedSkillTag);
    if (
      !next ||
      next.subject !== selectedSubject ||
      (selectedSkillTag && next.skill_tag !== selectedSkillTag)
    ) {
      markTopicCompleted(selectedSkillTag);
      setSessionCompleted(true);
    }
  };

  if (sessionCompleted) {
    const elapsedMinutes = Math.max(1, Math.round((Date.now() - sessionStartTime.current) / 60000));
    return (
      <SessionSummary
        completedTasksCount={completedCount || 1}
        topicName={selectedSkillTag ? selectedSkillTag.replace(/_/g, ' ') : undefined}
        subjectName={selectedSubject ? selectedSubject.replace(/_/g, ' ') : undefined}
        focusMinutes={elapsedMinutes}
        isTopicCompleted={true}
        onRestart={() => {
          setSessionCompleted(false);
          setCompletedCount(0);
          setIsSelectingSubject(true);
        }}
      />
    );
  }


  if (showSelfReport) {
    return (
      <SelfReportPrompt
        onSelectScore={handleSelfReportSubmit}
        onSkip={loadNextTask}
      />
    );
  }

  if (taskLoading && !currentTask) {
    return (
      <div className="w-full h-full max-h-full flex flex-col md:flex-row overflow-hidden bg-[#f0f3fa] font-sans">
        {/* Skeleton Sidebar */}
        <aside className="w-full md:w-72 lg:w-80 flex-shrink-0 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 p-4 sm:p-5 space-y-4">
          <div className="bg-white/90 border border-slate-200 rounded-2xl p-4 space-y-2.5">
            <div className="h-4 w-24 bg-slate-200 animate-pulse rounded-md" />
            <div className="h-2 w-full bg-slate-200 animate-pulse rounded-full" />
          </div>
          <div className="bg-white/90 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="h-4 w-20 bg-slate-200 animate-pulse rounded-md" />
            <div className="h-6 w-4/5 bg-slate-200 animate-pulse rounded-md" />
          </div>
          <div className="space-y-2">
            <div className="h-12 w-full bg-white/80 border border-slate-200 animate-pulse rounded-xl" />
            <div className="h-12 w-full bg-white/80 border border-slate-200 animate-pulse rounded-xl" />
            <div className="h-12 w-full bg-white/80 border border-slate-200 animate-pulse rounded-xl" />
          </div>
        </aside>

        {/* Skeleton Main Workspace */}
        <main className="flex-1 flex flex-col justify-between p-6 md:p-8 space-y-6">
          <div className="space-y-4 max-w-2xl">
            <div className="h-6 w-32 bg-slate-200 animate-pulse rounded-lg" />
            <div className="h-10 w-3/4 bg-slate-200 animate-pulse rounded-xl" />
            <div className="h-32 w-full bg-slate-200 animate-pulse rounded-2xl" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
              <div className="h-14 bg-white border border-slate-200 animate-pulse rounded-xl" />
              <div className="h-14 bg-white border border-slate-200 animate-pulse rounded-xl" />
              <div className="h-14 bg-white border border-slate-200 animate-pulse rounded-xl" />
              <div className="h-14 bg-white border border-slate-200 animate-pulse rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (isSelectingSubject || !currentTask) {
    return <SubjectSelectionHub onSelectTopic={handleSelectTopic} />;
  }

  const formatTitle = (str?: string) =>
    str ? str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '';

  const currentSubjectObj =
    SUBJECT_CATALOG.find((s) => s.id === (currentTask.subject || selectedSubject)) || SUBJECT_CATALOG[0];

  const currentTopicObj = currentSubjectObj.topics.find(
    (t) => t.skillTag === (currentTask.skill_tag || selectedSkillTag)
  );

  const SubjectIcon = currentSubjectObj.icon || FlaskConical;
  const subjectDisplay = currentSubjectObj.name;
  const skillDisplay = currentTopicObj?.name || formatTitle(currentTask.skill_tag || 'Cell Biology');

  // Robust UTF-8 / Mojibake Sanitizer
  const cleanText = (str?: string): string => {
    if (!str) return '';
    return str
      .replace(/â€”/g, '—')
      .replace(/â€“/g, '–')
      .replace(/â†’/g, '→')
      .replace(/â€™/g, "'")
      .replace(/â€œ/g, '"')
      .replace(/â€\x9d/g, '"')
      .replace(/â€"/g, '–')
      .replace(/â€/g, '—');
  };

  const body = currentTask.content_body || currentTask.content || {};
  const rawQuestion = body.question || body.prompt || body.task_text || body.text || currentTask.title || 'Solve the problem below:';
  const questionText = cleanText(rawQuestion);
  const imageUrl = body.image_url || body.imageUrl || '';
  const promptText = cleanText(body.prompt);
  const passageText = cleanText(body.passage || body.image_description || body.context);
  
  const rawHints = body.hints || body.hint || body.explanation || (currentTask as any).hints || [];
  const hintsArray = Array.isArray(rawHints) ? rawHints : typeof rawHints === 'string' && rawHints.trim() ? [rawHints] : [];
  const hintsList = hintsArray.map((h: string) => cleanText(h));

  const hasOptions = Array.isArray(body.options) && body.options.length > 0;
  const optionsList: string[] = hasOptions ? body.options.map((opt: string) => cleanText(opt)) : [];

  const totalSteps = BADGE_SIZE;
  const currentStep = (completedCount % totalSteps) + 1;

  const headerHeadline = (currentTask.title && currentTask.title !== questionText)
    ? currentTask.title
    : `${skillDisplay}`;

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row overflow-hidden select-none bg-white rounded-3xl border border-slate-200 shadow-sm font-sans min-h-[calc(100vh-8rem)]">
      {/* Left Sidebar Panel */}
      <aside className="w-full md:w-72 lg:w-80 flex-shrink-0 bg-slate-50/70 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col justify-between overflow-hidden select-none">
        <div className="flex-1 p-4 sm:p-5 space-y-3.5 overflow-y-auto">
          {/* Browse Subjects & Topics Navigation Button */}
          <button
            type="button"
            onClick={() => setIsSelectingSubject(true)}
            className="w-full p-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-extrabold text-[#32617d] flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs active:scale-[0.98]"
          >
            <LayoutGrid className="w-4 h-4 text-[#32617d]" />
            <span>← Browse Subjects & Topics</span>
          </button>

          {/* Progress / Header Area Block */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-700 tracking-wider uppercase">
                STEP {currentStep} OF {totalSteps}
              </span>
              {/* Visual Step Dots */}
              <div className="flex items-center gap-1.5" aria-hidden="true">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <span
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      i + 1 === currentStep
                        ? 'bg-[#32617d] ring-2 ring-[#32617d]/25 scale-110'
                        : i + 1 < currentStep
                        ? 'bg-[#a8e063]'
                        : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-[#a8e063] rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Module Info Grouped Block */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-2 shadow-2xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${currentSubjectObj.badgeBg} ${currentSubjectObj.badgeText}`}>
                <SubjectIcon className="w-3.5 h-3.5" />
                {currentSubjectObj.badge}
              </span>
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight leading-snug">
                {headerHeadline}
              </h1>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                {subjectDisplay}
              </p>
            </div>
            {currentSubjectObj.openStaxAttribution && (
              <div className="mt-2 pt-2 border-t border-slate-200 text-[11px] text-slate-600 flex items-start gap-2 bg-slate-50 p-2 rounded-xl">
                <BookOpen className="w-4 h-4 text-[#32617d] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-700 block">{currentSubjectObj.openStaxAttribution.title}</span>
                  <span className="text-[10px] text-slate-500 block">{currentSubjectObj.openStaxAttribution.license}</span>
                  <a
                    href={currentSubjectObj.openStaxAttribution.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#32617d] font-bold hover:underline inline-flex items-center gap-1 text-[10px] mt-0.5"
                  >
                    View Source Textbook <ExternalLink className="w-2.5 h-2.5 inline" />
                  </a>
                </div>
              </div>
            )}
          </div>


          {/* Reading Focus Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-2 shadow-2xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-[#e8f0fe] text-[#32617d] flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="text-xs font-bold text-slate-900 block">Assessment Session</span>
                <span className="text-[10px] text-slate-500 font-medium">Bite-sized practice & reasoning</span>
              </div>
            </div>
          </div>

          {/* Supportive Context & Learning Flow Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Learning Support</span>
              </div>
              <button
                type="button"
                onClick={() => setSessionCompleted(true)}
                className="text-[11px] font-extrabold text-[#32617d] hover:text-[#284f67] hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                title="View your completed exercise summary and session review"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-600" />
                <span>Session Summary</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
              Take your time. Read each question carefully and check hints whenever you need guidance.
            </p>
          </div>
        </div>

        {/* Sidebar Footer / Help Button - Exact height and border line matching bottom action bar */}
        <div className="flex-shrink-0 h-[76px] border-t border-slate-200 bg-slate-50/90 px-4 flex items-center">
          <button
            type="button"
            onClick={() => setShowInterventionModal(true)}
            className="w-full h-12 min-h-[48px] px-5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-extrabold text-sm flex items-center justify-center gap-2.5 transition-all shadow-xs active:scale-[0.98]"
          >
            <HelpCircle className="w-4 h-4 text-[#32617d]" />
            <span>Need Help?</span>
          </button>
        </div>
      </aside>

      {/* Right Main Content & Question Canvas Area */}
      <div className="flex-1 flex flex-col justify-between overflow-hidden bg-white">
        {/* Scrollable Center Canvas */}
        <main className="flex-1 w-full max-w-4xl mx-auto flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto overflow-x-hidden">
          {/* Active Subject & Topic Badge Bar */}
          <div className="w-full max-w-3xl mb-3 flex flex-wrap items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-full ${currentSubjectObj.badgeBg} ${currentSubjectObj.badgeText}`}>
                <SubjectIcon className="w-3.5 h-3.5" />
                {currentSubjectObj.badge}
              </span>
              {currentTopicObj && (
                <span className="inline-flex items-center text-xs font-bold px-3 py-1 rounded-full bg-white text-slate-700 border border-slate-200">
                  {currentTopicObj.name}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsSelectingSubject(true)}
              className="text-xs font-bold text-[#32617d] hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Change Topic</span>
            </button>
          </div>

          {/* Concept Breakdown Card (Explain Concept Simply) */}
          {conceptBreakdown && (
            <div className="w-full max-w-3xl mb-3 p-4 rounded-2xl bg-[#e8f0fe] border border-[#32617d]/30 text-slate-900 space-y-2 shadow-xs animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#32617d] font-extrabold text-xs">
                  <FileText className="w-4 h-4" />
                  <span>CONCEPT BREAKDOWN</span>
                </div>
                <button
                  type="button"
                  onClick={() => setConceptBreakdown(null)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  ✕ Close
                </button>
              </div>
              <p className="text-xs font-semibold leading-relaxed text-slate-800">
                {conceptBreakdown}
              </p>
            </div>
          )}

          {/* Worked Example Card (Show Worked Example) */}
          {showWorkedExample && (
            <div className="w-full max-w-3xl mb-3 p-4 rounded-2xl bg-[#fff8e1] border border-[#8e711f]/30 text-slate-900 space-y-2.5 shadow-xs animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-[#8e711f]/20 pb-2">
                <div className="flex items-center gap-2 text-[#8e711f] font-extrabold text-xs">
                  <BookOpen className="w-4 h-4" />
                  <span>WORKED EXAMPLE WALKTHROUGH</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWorkedExample(false)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  ✕ Close
                </button>
              </div>
              <div className="space-y-1.5 text-xs text-slate-800 font-semibold">
                <p className="font-bold text-amber-950">Sample Problem & Solution:</p>
                <div className="bg-white/90 p-3 rounded-xl border border-amber-200 space-y-1 text-slate-800">
                  <span className="text-[11px] font-black text-amber-900 block uppercase">Step 1: Identify Key Signals</span>
                  <p>Read the prompt terms carefully to establish baseline facts before calculating or picking an option.</p>
                </div>
                <div className="bg-white/90 p-3 rounded-xl border border-amber-200 space-y-1 text-slate-800">
                  <span className="text-[11px] font-black text-amber-900 block uppercase">Step 2: Apply Formula / Logic</span>
                  <p>Relate the key terms to your core concept definition to confirm the correct reasoning pathway.</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="w-full space-y-3">

            <TextModeRenderer
              questionText={questionText}
              passageText={passageText}
              promptText={promptText}
              imageUrl={imageUrl}
              imageDescription={body.image_description}
              tableData={body.table || body.table_data}
              optionsList={optionsList}
              hasOptions={hasOptions}
              userAnswer={userAnswer}
              onSelectAnswer={setUserAnswer}
              onRecordInteraction={recordUserInteraction}
              skillTag={currentTask.skill_tag}
              subject={currentTask.subject || selectedSubject}
              topicName={currentTopicObj?.name}
            />

            {/* Interactive Hint Section (Structured Interface) */}
            {hintsList.length > 0 && (
              <div className="w-full max-w-3xl mx-auto pt-2">
                <button
                  type="button"
                  onClick={() => setShowHint((prev) => !prev)}
                  className={`w-full p-3 rounded-2xl border transition-all flex items-center justify-between shadow-2xs cursor-pointer ${
                    showHint
                      ? 'bg-amber-100/90 border-amber-300 ring-2 ring-amber-400/40 text-amber-950'
                      : 'bg-amber-50/80 hover:bg-amber-100 border-amber-200 text-amber-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                      <Lightbulb className="w-4.5 h-4.5" />
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-black block">
                        {showHint ? 'Guided Hints Unlocked' : 'Need a Hint for this Question?'}
                      </span>
                      <span className="text-[10px] font-semibold text-amber-800 block">
                        {hintsList.length} step-by-step guidance {hintsList.length === 1 ? 'hint' : 'hints'} available
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold px-3 py-1 rounded-xl bg-white/90 border border-amber-200 text-amber-900 shadow-2xs">
                    {showHint ? 'Hide Guidance ▲' : 'Reveal Hints ▼'}
                  </span>
                </button>

                {showHint && (
                  <div className="mt-2.5 p-4 rounded-2xl bg-amber-50/90 border border-amber-200/90 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                      <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Progressive Learning Hints
                      </span>
                      <span className="text-[10px] font-bold text-amber-800 bg-white/80 px-2 py-0.5 rounded-lg border border-amber-200">
                        {hintsList.length} {hintsList.length === 1 ? 'Step' : 'Steps'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {hintsList.map((h: string, i: number) => (
                        <div key={i} className="p-3 rounded-xl bg-white border border-amber-200/80 flex items-start gap-3 shadow-2xs">
                          <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-amber-100 text-amber-900 text-[11px] font-black flex items-center justify-center border border-amber-300">
                            {i + 1}
                          </span>
                          <div className="space-y-0.5 min-w-0 flex-1">
                            <span className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider block">
                              {i === 0 ? 'Concept Clue' : i === 1 ? 'Key Strategy' : `Step ${i + 1}`}
                            </span>
                            <p className="text-xs text-slate-800 font-semibold leading-relaxed">
                              {h}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Feedback Display */}
            {feedback && (
              <div
                className={`max-w-3xl mx-auto p-4 rounded-xl border text-xs font-medium space-y-1.5 ${
                  feedback.correct
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  {feedback.correct ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  )}
                  <span className="font-bold">{feedback.message}</span>
                </div>

                {!feedback.correct && hintsList.length > 0 && (
                  <div className="pt-1 border-t border-rose-200/60 space-y-0.5">
                    <p className="text-[11px] font-bold text-rose-900 flex items-center gap-1 uppercase tracking-wider">
                      <Lightbulb className="w-3 h-3 text-amber-600" />
                      Helpful Hints:
                    </p>
                    <ul className="list-disc list-inside text-[11px] space-y-0.5 text-rose-900">
                      {hintsList.map((h: string, i: number) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </form>
        </main>

        {/* Sticky Bottom Action Bar - Generous button padding & exact matching height */}
        <footer className="flex-shrink-0 h-[76px] border-t border-slate-200 bg-slate-50/90 backdrop-blur-sm px-4 sm:px-8 flex items-center">
          <div className="w-full max-w-4xl mx-auto flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => {
                if (activeSession && currentTask) {
                  logTaskAbandon(activeSession.id, currentTask.id, 'User skipped task').catch(() => {});
                }
                loadNextTask();
              }}
              className="h-12 min-h-[48px] px-8 sm:px-10 rounded-2xl border-2 border-[#486730] text-[#486730] font-extrabold text-xs sm:text-sm bg-white hover:bg-[#f4f8f1] transition-all flex items-center justify-center shadow-xs active:scale-[0.98]"
            >
              Skip for now
            </button>

            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={submitting || !userAnswer.trim()}
              className={`h-12 min-h-[48px] px-10 sm:px-12 rounded-2xl font-extrabold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2.5 active:scale-[0.98] ${
                submitting || !userAnswer.trim()
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-[#3e6b89] hover:bg-[#32617d] text-white cursor-pointer'
              }`}
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Checking…</span>
                </>
              ) : (
                <>
                  <span>Submit Answer</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </footer>
      </div>

      {/* Intervention Modal Overlay */}
      {showInterventionModal && (
        <InterventionOverlay
          onDismiss={() => setShowInterventionModal(false)}
          onAction={(type) => handleSelectIntervention(type || 're_chunk')}
        />
      )}

      {/* Calming Break Modal Overlay */}
      {showCalmingBreak && (
        <div className="fixed inset-0 z-[110] w-screen h-screen bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-8 text-center space-y-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto ring-8 ring-rose-50/50 animate-pulse">
              <Sparkles className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <span className="text-xs font-black text-rose-600 uppercase tracking-widest bg-rose-100/80 px-3 py-1 rounded-full">
                1-Min Mindfulness Break
              </span>
              <h3 className="text-2xl font-black text-slate-900">Take a Deep Breath</h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-xs mx-auto">
                Relax your shoulders, take a gentle inhale and exhale. Your session progress is saved.
              </p>
            </div>

            <div className="py-4 space-y-3">
              <div className="text-4xl font-black text-[#32617d]">
                {breakTimer}s
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#32617d] rounded-full transition-all duration-1000"
                  style={{ width: `${(breakTimer / 60) * 100}%` }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowCalmingBreak(false)}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#32617d] hover:bg-[#284f67] text-white font-extrabold text-xs shadow-sm transition-all cursor-pointer active:scale-[0.98]"
            >
              Resume Learning Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
