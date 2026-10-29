import React, { useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

interface SelfReportPromptProps {
  onSelectScore: (score: number) => void;
  onSkip?: () => void;
}

export const SelfReportPrompt: React.FC<SelfReportPromptProps> = ({ onSelectScore, onSkip }) => {
  const [selectedScore, setSelectedScore] = useState<number | null>(null);

  const options = [
    { score: 5, label: 'Easy', emoji: '😌', altLabel: 'Super Easy' },
    { score: 4, label: 'Just Right', emoji: '🙂', altLabel: 'Good' },
    { score: 3, label: 'A bit hard', emoji: '🤔', altLabel: 'Okay' },
    { score: 2, label: 'Hard', emoji: '😥', altLabel: 'Tricky' },
    { score: 1, label: 'Need Help', emoji: '🙋', altLabel: 'Super Hard' },
  ];

  const handleTap = (score: number) => {
    setSelectedScore(score);
    onSelectScore(score);
  };

  return (
    <div className="w-full h-full max-h-full bg-[#f0f3fa] text-slate-900 flex flex-col justify-between overflow-hidden select-none font-sans">
      {/* Main Check-In Card Area */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-sm text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
          {/* Green Check Icon */}
          <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
          </div>

          {/* Title & Prompt */}
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Task Complete!
            </h1>
            <span className="sr-only">Quick Check-in!</span>
            <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed font-medium">
              How did that feel? Tap the one that matches your mood right now.
            </p>
          </div>

          {/* 5 Emotion Rating Cards */}
          <div className="grid grid-cols-5 gap-2 sm:gap-3 py-2">
            {options.map((opt) => {
              const isSelected = selectedScore === opt.score;
              return (
                <button
                  key={opt.score}
                  type="button"
                  onClick={() => handleTap(opt.score)}
                  className={`min-h-[64px] p-3 sm:p-4 bg-slate-50 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all cursor-pointer transform active:scale-95 border border-slate-100 ${
                    isSelected
                      ? 'ring-2 ring-blue-600 bg-blue-50/80 scale-105 shadow-sm border-blue-200'
                      : 'hover:bg-slate-100 hover:border-slate-200'
                  }`}
                >
                  <span className="text-2xl sm:text-3xl select-none" role="img" aria-label={opt.label}>
                    {opt.emoji}
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-700 leading-tight">
                    {opt.label}
                  </span>
                  <span className="sr-only">{opt.altLabel}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <footer className="flex-shrink-0 sticky bottom-0 z-20 w-full bg-[#f0f3fa]/95 backdrop-blur-sm border-t border-slate-200 shadow-xs h-[76px] px-4 sm:px-8 flex items-center">
        <div className="w-full max-w-4xl mx-auto flex items-center justify-end">
          {onSkip ? (
            <button
              type="button"
              onClick={onSkip}
              className="h-12 min-h-[48px] px-8 sm:px-10 rounded-2xl border-2 border-slate-300 text-slate-800 font-extrabold text-xs sm:text-sm bg-white hover:bg-slate-50 transition-all flex items-center justify-center gap-2.5 shadow-xs active:scale-[0.98] cursor-pointer"
            >
              <span>Skip for now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div />
          )}
        </div>
      </footer>
    </div>
  );
};
