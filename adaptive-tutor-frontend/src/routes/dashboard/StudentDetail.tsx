import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDashboard } from '../../hooks/useDashboard';
import { EngagementTrendChart } from './EngagementTrendChart';
import { InterventionHistoryList } from './InterventionHistory';
import {
  StudentEngagementTrend,
  InterventionHistory,
  ParentGuidanceResponse,
  AIStudentAnalysisResponse,
} from '../../types/dashboard';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton, SkeletonCard } from '../../components/ui/Skeleton';
import {
  ArrowLeft,
  UserCheck,
  Printer,
  Sparkles,
  Lightbulb,
  Smile,
  AlertCircle,
  CheckCircle2,
  Clock,
  Brain,
  Zap,
  RefreshCw,
  Award,
  TrendingUp,
  BookOpen,
  Target,
  BarChart3,
  Layers,
  Eye,
  ShieldCheck,
  Heart,
  ChevronRight,
} from 'lucide-react';

export const StudentDetail: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const {
    fetchEngagementTrend,
    fetchInterventionHistory,
    fetchParentGuidance,
    fetchAIAnalysis,
    loading,
  } = useDashboard();

  const [trend, setTrend] = useState<StudentEngagementTrend | null>(null);
  const [history, setHistory] = useState<InterventionHistory | null>(null);
  const [guidance, setGuidance] = useState<ParentGuidanceResponse | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIStudentAnalysisResponse | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(true);
  const [isRefreshingAi, setIsRefreshingAi] = useState(false);

  // Active Subject Selection for Drill-down
  const [selectedSubjectTab, setSelectedSubjectTab] = useState<string>('all');

  const loadAllStudentData = async (refreshAiOnly = false) => {
    if (!studentId) return;

    if (refreshAiOnly) {
      setIsRefreshingAi(true);
      try {
        const aiData = await fetchAIAnalysis(studentId, true);
        if (aiData) setAiAnalysis(aiData);
      } finally {
        setIsRefreshingAi(false);
      }
      return;
    }

    // 1. Fetch core telemetry immediately (fast DB query)
    setDataLoading(true);
    setIsAiLoading(true);

    try {
      const [trendData, historyData, guidanceData] = await Promise.all([
        fetchEngagementTrend(studentId),
        fetchInterventionHistory(studentId),
        fetchParentGuidance(studentId),
      ]);

      if (trendData) setTrend(trendData);
      if (historyData) setHistory(historyData);
      if (guidanceData) setGuidance(guidanceData);
    } catch (err) {
      console.error('Failed to load student details:', err);
    } finally {
      setDataLoading(false);
    }

    // 2. Fetch AI analysis in the background without blocking the page
    fetchAIAnalysis(studentId)
      .then((aiData) => {
        if (aiData) setAiAnalysis(aiData);
      })
      .catch((err) => console.error('Failed to load AI analysis:', err))
      .finally(() => setIsAiLoading(false));
  };

  useEffect(() => {
    loadAllStudentData();
  }, [studentId]);

  const studentName = trend?.student_name || history?.student_name || 'Student';
  const gradeLevel = trend?.grade_level || 'General';
  const learnerTags = trend?.learner_profile_tags || [];

  // Calculate readable focus summary from real scores
  const scores = trend?.scores || [];
  const latestScore = scores.length > 0 ? scores[scores.length - 1].computed_score : 1.0;
  const focusPercentage = Math.round(latestScore * 100);

  // Subject Progress & Accuracy Computations from real database telemetry
  const subjectProgress = useMemo(() => {
    return trend?.subject_progress || [];
  }, [trend?.subject_progress]);

  // Cognitive Response Latency Breakdown (Hesitation vs Flow) computed from real telemetry signals
  const responseSpeedDistribution = useMemo(() => {
    if (!scores || scores.length === 0) {
      return { fastFlow: 0, balancedFocus: 0, hesitationOverload: 0, totalSamples: 0 };
    }
    let fast = 0;
    let balanced = 0;
    let hesitation = 0;

    scores.forEach((s) => {
      const hesitationSec = s.signals_snapshot?.hesitation_seconds;
      if (typeof hesitationSec === 'number') {
        if (hesitationSec < 30) fast += 1;
        else if (hesitationSec <= 90) balanced += 1;
        else hesitation += 1;
      } else {
        if (s.computed_score >= 0.7) fast += 1;
        else if (s.computed_score >= 0.4) balanced += 1;
        else hesitation += 1;
      }
    });

    const total = scores.length;
    return {
      fastFlow: Math.round((fast / total) * 100),
      balancedFocus: Math.round((balanced / total) * 100),
      hesitationOverload: Math.round((hesitation / total) * 100),
      totalSamples: total,
    };
  }, [scores]);

  // Accommodations Efficacy Breakdown from real intervention history
  const accommodationsCount = history?.interventions?.length || 0;
  const accommodationTypes = history?.interventions?.map((i) => i.intervention_type) || [];
  const hintCount = accommodationTypes.filter((t) => t === 're_chunk' || t === 'difficulty_step_down').length;
  const breakCount = accommodationTypes.filter((t) => t === 'break_task').length;
  const modalityCount = accommodationTypes.filter((t) => t === 'modality_switch').length;

  const getReadabilityStatus = (score: number) => {
    if (scores.length === 0) {
      return {
        label: 'Awaiting Session Data',
        description: `${studentName} has not completed any interactive sessions yet. Metrics will populate once learning begins.`,
        color: 'text-slate-900 bg-slate-50 border-slate-200',
        badgeVariant: 'default' as const,
        icon: Brain,
        iconColor: 'text-slate-500',
      };
    }
    if (score >= 0.7) {
      return {
        label: 'Great Focus & Confident',
        description: `${studentName} is working steadily with good concentration and minimal hesitation.`,
        color: 'text-emerald-900 bg-emerald-50/80 border-emerald-200',
        badgeVariant: 'success' as const,
        icon: CheckCircle2,
        iconColor: 'text-emerald-700',
      };
    } else if (score >= 0.4) {
      return {
        label: 'Mild Hesitation / Pauses Detected',
        description: `${studentName} is encountering challenging questions or slight pauses. Gentle encouragement is helpful.`,
        color: 'text-amber-900 bg-amber-50/80 border-amber-200',
        badgeVariant: 'warning' as const,
        icon: Clock,
        iconColor: 'text-amber-700',
      };
    } else {
      return {
        label: 'Needs a Short Break or Hint',
        description: `${studentName} may be experiencing fatigue or cognitive overload. Adaptive cues have been prepared.`,
        color: 'text-rose-900 bg-rose-50/80 border-rose-200',
        badgeVariant: 'danger' as const,
        icon: AlertCircle,
        iconColor: 'text-rose-700',
      };
    }
  };

  const statusInfo = getReadabilityStatus(latestScore);
  const StatusIcon = statusInfo.icon;

  if (dataLoading && !trend && !history) {
    return (
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 font-sans">
        <div className="flex items-center justify-between border-b border-[#deded6] pb-4">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SkeletonCard lines={6} />
          </div>
          <div className="lg:col-span-1">
            <SkeletonCard lines={4} />
          </div>
        </div>
      </div>
    );
  }

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 font-sans text-slate-900 select-none pb-16">
      {/* ── HEADER WITH ACTIONS & BREADCRUMBS ─────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer mb-0.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard Overview
          </button>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <div className="p-2 rounded-2xl bg-indigo-50 text-indigo-700">
                <UserCheck className="w-6 h-6" />
              </div>
              <span>{studentName}'s Learning Journey</span>
            </h1>
            <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {gradeLevel} • {learnerTags.length > 0 ? learnerTags.join(', ') : 'Adaptive IEP Profile'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Real-time telemetry, cognitive pacing analysis, and Groq LLM-powered pedagogical guidance.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => loadAllStudentData(true)}
            disabled={isRefreshingAi}
            className="h-10 px-3.5 rounded-2xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-900 font-extrabold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            title="Generate fresh pedagogical insights using Groq LLaMA 3.3"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isRefreshingAi ? 'animate-spin' : ''}`} />
            <span>{isRefreshingAi ? 'Updating Groq AI...' : 'Refresh Groq AI Insights'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrintReport}
            className="h-10 px-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-extrabold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-98"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* ── 4 OVERVIEW KPI CARDS ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Plain English Status */}
        <Card className={`p-5 rounded-3xl border ${statusInfo.color} shadow-xs flex flex-col justify-between space-y-3`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider">Current Cognitive State</span>
            <StatusIcon className={`w-5 h-5 ${statusInfo.iconColor}`} />
          </div>
          <div className="space-y-1">
            <p className="text-base font-extrabold leading-tight">{statusInfo.label}</p>
            <p className="text-xs opacity-90 leading-snug">{statusInfo.description}</p>
          </div>
          <div className="pt-2 border-t border-black/10">
            <Badge variant={statusInfo.badgeVariant} size="sm">
              Live Telemetry State
            </Badge>
          </div>
        </Card>

        {/* Card 2: Engagement & Focus Level */}
        <Card className="p-5 rounded-3xl border border-slate-200/80 bg-white shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-black uppercase tracking-wider">Engagement & Focus</span>
            <Brain className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">
                {scores.length > 0 ? `${focusPercentage}%` : 'N/A'}
              </span>
              <span className="text-xs text-slate-500 font-bold">
                {scores.length > 0 ? 'sustained focus' : 'no sessions yet'}
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-[#2F5241] h-full rounded-full transition-all duration-500"
                style={{ width: `${scores.length > 0 ? Math.max(10, Math.min(100, focusPercentage)) : 0}%` }}
              />
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
            {scores.length > 0 ? `${scores.length} telemetry points analyzed` : 'Awaiting learner telemetry'}
          </div>
        </Card>

        {/* Card 3: Accommodations Provided */}
        <Card className="p-5 rounded-3xl border border-slate-200/80 bg-white shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-black uppercase tracking-wider">Accommodations Provided</span>
            <Zap className="w-5 h-5 text-amber-500" />
          </div>
          <div className="space-y-1">
            <span className="text-3xl font-black text-slate-900">{accommodationsCount}</span>
            <p className="text-xs text-slate-600 font-medium">
              {accommodationsCount > 0
                ? `${hintCount} scaffolding hints • ${breakCount} pauses • ${modalityCount} modality switches`
                : 'Steady session with zero cognitive friction'}
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px] text-emerald-800 font-bold">
            Real-time Adaptive Trigger History
          </div>
        </Card>

        {/* Card 4: Encouraging Recommendation */}
        <Card className="p-5 rounded-3xl border border-slate-200/80 bg-white shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-black uppercase tracking-wider">Supportive Next Step</span>
            <Lightbulb className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-800 leading-relaxed line-clamp-3">
              {aiAnalysis?.analysis?.parent_support_cue ||
                guidance?.tips?.[0]?.recommended_action ||
                (scores.length === 0
                  ? 'Start a learning session to generate personalized guidance.'
                  : focusPercentage >= 70
                  ? 'Celebrate steady focus and confidence in problem-solving.'
                  : 'Encourage a 2-minute quiet stretch break before the next module.')}
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px] text-indigo-700 font-extrabold flex items-center gap-1">
            <Smile className="w-3.5 h-3.5" />
            <span>Personalized Pedagogical Cue</span>
          </div>
        </Card>
      </div>

      {/* ── 5. GROQ AI PEDAGOGICAL RECOMMENDATIONS ENGINE ────────────────── */}
      <Card className="p-6 sm:p-7 rounded-3xl border-2 border-indigo-200/80 bg-gradient-to-br from-white via-indigo-50/20 to-purple-50/30 shadow-md space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-indigo-600 text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span>Groq AI Learning Analysis & Teacher Action Plan</span>
                <span className="text-[10px] font-black bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full uppercase">
                  LLaMA 3.3 Engine
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Deep neurodivergent behavioral diagnosis grounded in real-time response telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold bg-white px-3 py-1.5 rounded-xl border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Evidence-Based Scaffold</span>
          </div>
        </div>

        {isAiLoading && !aiAnalysis ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-3 bg-white/70 rounded-2xl border border-indigo-100 p-6">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
            <p className="text-xs text-indigo-900 font-bold animate-pulse">
              Synthesizing real-time telemetry & pedagogical plan with Groq LLaMA 3.3...
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Column 1: Strengths & Superpowers */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-emerald-100 shadow-2xs space-y-2.5">
                <div className="flex items-center gap-2 text-emerald-800 font-black text-xs uppercase tracking-wider">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>Cognitive Strengths & Flow</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {aiAnalysis?.analysis?.superpowers_and_strengths ||
                    `${studentName} demonstrates persistence and problem-solving determination during focused tasks.`}
                </p>
              </div>

              {/* Column 2: Cognitive Friction & Bottlenecks */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-amber-100 shadow-2xs space-y-2.5">
                <div className="flex items-center gap-2 text-amber-800 font-black text-xs uppercase tracking-wider">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Identified Friction Zones</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {aiAnalysis?.analysis?.cognitive_bottlenecks ||
                    `Dense multi-step textual instructions or time pressure can increase cognitive load.`}
                </p>
              </div>

              {/* Column 3: Recommended Next Target */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-purple-100 shadow-2xs space-y-2.5">
                <div className="flex items-center gap-2 text-purple-800 font-black text-xs uppercase tracking-wider">
                  <Target className="w-4 h-4 text-purple-600" />
                  <span>Recommended Curriculum Step</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {aiAnalysis?.analysis?.recommended_next_module ||
                    `Interactive visual concept reinforcement with low-stress pacing.`}
                </p>
              </div>
            </div>

            {/* Teacher Action Plan List */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-indigo-100 shadow-2xs space-y-3">
              <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                <span>Targeted Pedagogical Action Plan for Educators</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {(aiAnalysis?.analysis?.teacher_action_plan || [
                  'Chunk multi-step questions into single distinct prompts.',
                  'Provide visual diagrams or interactive choices for abstract descriptions.',
                  'Celebrate micro-milestones to build positive problem-solving momentum.',
                ]).map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-extrabold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="text-xs text-slate-800 font-semibold leading-snug">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </Card>

      {/* ── 6. MAIN PROGRESS GRAPHS & VISUAL ANALYTICS GRID ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 8 Cols (Focus Timeline + Subject Mastery + Latency Distribution) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Graph 1: Focus & Engagement Over Time */}
          <EngagementTrendChart scores={scores} studentName={studentName} />

          {/* Graph 2: Subject Mastery & Accuracy Progress Graph */}
          <Card className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="space-y-0.5">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  <span>Subject Mastery & Curriculum Progress</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Continuous performance tracking across database task catalog
                </p>
              </div>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-xl">
                {subjectProgress.length} Active Domains
              </span>
            </div>

            {subjectProgress.length > 0 ? (
              <div className="space-y-4">
                {subjectProgress.map((subj) => (
                  <div key={subj.subject} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800 font-extrabold">{subj.subject}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-medium">
                          {subj.completed}/{subj.total} Tasks Completed
                        </span>
                        <span className="font-black text-slate-900">{subj.mastery_percentage}%</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {subj.status}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${subj.color || 'bg-indigo-500'}`}
                        style={{ width: `${subj.mastery_percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">
                No curriculum tasks found in catalog.
              </div>
            )}
          </Card>

          {/* Graph 3: Cognitive Pace & Response Latency Distribution */}
          <Card className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="space-y-0.5">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-600" />
                  <span>Cognitive Response Latency & Pacing Distribution</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {responseSpeedDistribution.totalSamples > 0
                    ? `Breakdown computed across ${responseSpeedDistribution.totalSamples} real telemetry signals`
                    : 'Breakdown computed directly from student hesitation and answering pace signals'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1 text-center">
                <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">
                  Fast & Confident (&lt;30s)
                </span>
                <div className="text-2xl font-black text-emerald-950">
                  {responseSpeedDistribution.fastFlow}%
                </div>
                <p className="text-[11px] text-emerald-700 font-medium">High flow & cognitive ease</p>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-1 text-center">
                <span className="text-[10px] font-black text-indigo-800 uppercase tracking-wider">
                  Balanced Pace (30-90s)
                </span>
                <div className="text-2xl font-black text-indigo-950">
                  {responseSpeedDistribution.balancedFocus}%
                </div>
                <p className="text-[11px] text-indigo-700 font-medium">Active problem-solving</p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1 text-center">
                <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider">
                  Hesitation Zone (&gt;90s)
                </span>
                <div className="text-2xl font-black text-amber-950">
                  {responseSpeedDistribution.hesitationOverload}%
                </div>
                <p className="text-[11px] text-amber-700 font-medium">Scaffolding hints offered</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: 4 Cols (Accommodations Feed + Sensory Profile Card) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Neurodivergent Sensory Profile Card */}
          <Card className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-900">
              <Heart className="w-5 h-5 text-rose-500" />
              <h3 className="text-sm font-black">Learner Profile & Accommodations</h3>
            </div>
            <div className="space-y-2">
              {learnerTags.length > 0 ? (
                learnerTags.map((tag, i) => {
                  const tagLower = tag.toLowerCase();
                  let desc = 'Configured student learner preference';
                  if (tagLower.includes('adhd')) desc = 'Optimized for visual micro-chunks and low-friction pacing';
                  else if (tagLower.includes('autism')) desc = 'Predictable structure, clear instructions & sensory calm';
                  else if (tagLower.includes('dyslexia')) desc = 'High readability layout and accessible typography';
                  else if (tagLower.includes('sensory')) desc = 'Sensory break cues and low visual distraction';

                  return (
                    <div key={i} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-slate-900 uppercase tracking-wide">{tag}</p>
                        <p className="text-[11px] text-slate-500 font-medium">{desc}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Standard Adaptive IEP Profile</p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Real-time adaptive pacing, micro-breaks, and progressive scaffolding active.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Intervention History Feed */}
          <InterventionHistoryList
            interventions={history?.interventions || []}
            studentName={studentName}
          />
        </div>
      </div>
    </div>
  );
};
