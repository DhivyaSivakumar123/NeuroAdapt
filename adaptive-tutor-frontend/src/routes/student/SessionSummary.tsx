import React from 'react';
import { Trophy, Clock, CheckCircle, TrendingUp, Play } from 'lucide-react';

interface SessionSummaryProps {
  onRestart: () => void;
  completedTasksCount?: number;
  topicName?: string;
  subjectName?: string;
  focusMinutes?: number;
  isTopicCompleted?: boolean;
}

export const SessionSummary: React.FC<SessionSummaryProps> = ({
  onRestart,
  completedTasksCount = 1,
  topicName,
  subjectName,
  focusMinutes = 5,
  isTopicCompleted = true,
}) => {
  const displayCount = Math.max(1, completedTasksCount);
  const taskLabel = displayCount === 1 ? '1 Task' : `${displayCount} Tasks`;

  return (
    <div className="w-full h-full max-h-full bg-[#f0f3fa] text-slate-800 flex items-center justify-center p-4 sm:p-6 overflow-y-auto select-none font-sans">
      <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-sm text-center space-y-6 animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Top Trophy Badge */}
        <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
          <Trophy className="w-8 h-8" />
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-extrabold text-emerald-800 mb-1">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{isTopicCompleted ? 'Topic Completed' : 'Session Completed'}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {isTopicCompleted ? 'All Questions Completed!' : 'Great job focusing today!'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed font-medium">
            {topicName
              ? `You finished all practice questions for ${topicName}. This topic is now marked as completed!`
              : 'You completed your tasks and stayed on track. Be proud of your effort.'}
          </p>
        </div>

        {/* 2 Stat Cards Side-by-Side */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200 text-center space-y-0.5 shadow-xs">
            <div className="flex items-center justify-center gap-1.5 text-blue-800 font-extrabold text-base sm:text-lg">
              <Clock className="w-4 h-4" />
              <span>{focusMinutes} Min</span>
            </div>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Focus Time</p>
          </div>

          <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200 text-center space-y-0.5 shadow-xs">
            <div className="flex items-center justify-center gap-1.5 text-emerald-800 font-extrabold text-base sm:text-lg">
              <CheckCircle className="w-4 h-4" />
              <span>{taskLabel}</span>
            </div>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Completed</p>
          </div>
        </div>

        {/* Pacing Status Card */}
        <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200 text-center space-y-2 shadow-xs">
          <div className="flex items-center justify-center gap-1.5 text-amber-800 font-extrabold text-xs sm:text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>Steady Pace</span>
          </div>

          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-700 rounded-full w-[100%]" />
          </div>

          <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Topic Mastery 100%</p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-center gap-3.5 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={onRestart}
            className="h-12 min-h-[48px] px-8 sm:px-10 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-sm transition-all active:scale-[0.98] cursor-pointer w-full sm:w-auto"
          >
            <span>Choose Next Topic</span>
            <Play className="w-4 h-4 fill-current" />
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="h-12 min-h-[48px] px-8 sm:px-10 rounded-2xl border-2 border-slate-300 text-slate-800 font-extrabold text-sm bg-white hover:bg-slate-50 transition-all active:scale-[0.98] flex items-center justify-center shadow-xs cursor-pointer w-full sm:w-auto"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
