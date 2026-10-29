import React from 'react';
import { InterventionType } from '../../types/intervention';
import { FileText, Volume2, GraduationCap, Timer, X, Sparkles, CheckCircle2, Layers, Eye, Coffee } from 'lucide-react';

interface InterventionOverlayProps {
  type?: InterventionType;
  isLoading?: boolean;
  isFallback?: boolean;
  onDismiss: () => void;
  onAction?: (actionType?: any) => void;
}

export const InterventionOverlay: React.FC<InterventionOverlayProps> = ({
  type,
  isLoading = false,
  isFallback = false,
  onDismiss,
  onAction,
}) => {
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[100] w-screen h-screen min-h-screen bg-slate-900/35 backdrop-blur-[2px] flex items-center justify-center p-4">
        <div className="p-8 max-w-md w-full bg-white rounded-3xl border border-[#e2e2da] shadow-2xl text-center space-y-4">
          <div className="w-12 h-12 bg-[#e8f0fe] text-[#32617d] rounded-full flex items-center justify-center mx-auto animate-bounce">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-[#1a1c19]">Adapting your workspace...</h4>
            <p className="text-xs text-slate-500">Personalizing the next learning step for you.</p>
          </div>
        </div>
      </div>
    );
  }

  // Single intervention view if explicit type is provided
  if (type === 're_chunk') {
    return (
      <div className="fixed inset-0 z-[100] w-screen h-screen min-h-screen bg-slate-900/35 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl border border-[#e2e2da] shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 animate-in zoom-in-95 duration-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#e8f0fe] text-[#32617d] rounded-xl">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-[#32617d] bg-[#e8f0fe] px-2.5 py-0.5 rounded-full">
                  Step-by-Step Chunking
                </span>
                <h3 className="text-lg font-bold text-[#1a1c19] mt-1">Let's Break This Down into Small Steps</h3>
              </div>
            </div>
            <button onClick={onDismiss} className="text-slate-400 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
            Take this one small step at a time. We'll guide you through each piece.
          </p>
          {isFallback && <p className="text-xs text-amber-700">[Dev Diagnostic]: Generated using local fallback engine</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onDismiss} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-xl">
              Skip
            </button>
            <button
              onClick={() => {
                if (onAction) onAction('re_chunk');
                onDismiss();
              }}
              className="px-6 py-2.5 bg-[#32617d] text-white text-xs font-bold rounded-xl hover:bg-[#284f67] shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Start Step 1
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'modality_switch') {
    return (
      <div className="fixed inset-0 z-[100] w-screen h-screen min-h-screen bg-slate-900/35 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl border border-[#e2e2da] shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 animate-in zoom-in-95 duration-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#e8f5e9] text-[#2e7d32] rounded-xl">
                <Eye className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-[#2e7d32] bg-[#e8f5e9] px-2.5 py-0.5 rounded-full">
                  Visual Modality
                </span>
                <h3 className="text-lg font-bold text-[#1a1c19] mt-1">Let's Try a Visual Approach</h3>
              </div>
            </div>
            <button onClick={onDismiss} className="text-slate-400 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
            Switch to visual or diagram mode. Have the instructions and content shown graphically.
          </p>
          {isFallback && <p className="text-xs text-amber-700">[Dev Diagnostic]: Generated using local fallback engine</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onDismiss} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-xl">
              Skip
            </button>
            <button
              onClick={() => {
                if (onAction) onAction('modality_switch');
                onDismiss();
              }}
              className="px-6 py-2.5 bg-[#32617d] text-white text-xs font-bold rounded-xl hover:bg-[#284f67] shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              View Visual Guide
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'break_task') {
    return (
      <div className="fixed inset-0 z-[100] w-screen h-screen min-h-screen bg-slate-900/35 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl border border-[#e2e2da] shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 animate-in zoom-in-95 duration-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#ffebee] text-[#c62828] rounded-xl">
                <Coffee className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-[#c62828] bg-[#ffebee] px-2.5 py-0.5 rounded-full">
                  Take a breather
                </span>
                <h3 className="text-lg font-bold text-[#1a1c19] mt-1">Time for a 1-Minute Micro Break</h3>
              </div>
            </div>
            <button onClick={onDismiss} className="text-slate-400 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
            Take a deep breath and stretch! We'll hold your place right here.
          </p>
          {isFallback && <p className="text-xs text-amber-700">[Dev Diagnostic]: Generated using local fallback engine</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => {
                if (onAction) onAction('break_task');
                onDismiss();
              }}
              className="px-6 py-2.5 bg-[#32617d] text-white text-xs font-bold rounded-xl hover:bg-[#284f67] shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Ready to Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'difficulty_step_down') {
    return (
      <div className="fixed inset-0 z-[100] w-screen h-screen min-h-screen bg-slate-900/35 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl border border-[#e2e2da] shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 animate-in zoom-in-95 duration-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#fff8e1] text-[#8e711f] rounded-xl">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-[#8e711f] bg-[#fff8e1] px-2.5 py-0.5 rounded-full">
                  Review basics
                </span>
                <h3 className="text-lg font-bold text-[#1a1c19] mt-1">Let's Practice with a Warm-Up Problem</h3>
              </div>
            </div>
            <button onClick={onDismiss} className="text-slate-400 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
            Let's look at an easier example first before tackling this one.
          </p>
          {isFallback && <p className="text-xs text-amber-700">[Dev Diagnostic]: Generated using local fallback engine</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => {
                if (onAction) onAction('difficulty_step_down');
                onDismiss();
              }}
              className="px-6 py-2.5 bg-[#32617d] text-white text-xs font-bold rounded-xl hover:bg-[#284f67] shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Try Warm-up Task
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4-choice assistance grid view
  const options = [
    {
      id: 're_chunk' as InterventionType,
      title: 'Explain Concept Simply',
      description: "Get a simple, plain-English breakdown of the core concept and key terms.",
      icon: FileText,
      iconBg: 'bg-[#e8f0fe]',
      iconColor: 'text-[#32617d]',
      titleColor: 'text-[#32617d]',
      accentBg: 'bg-[#e8f0fe]/50',
    },
    {
      id: 'modality_switch' as InterventionType,
      title: 'Step-by-Step Guided Hints',
      description: 'Unlock progressive hints and step-by-step guidance for this question.',
      icon: Volume2,
      iconBg: 'bg-[#e8f5e9]',
      iconColor: 'text-[#2e7d32]',
      titleColor: 'text-[#2e7d32]',
      accentBg: 'bg-[#e8f5e9]/50',
    },
    {
      id: 'difficulty_step_down' as InterventionType,
      title: 'Show Worked Example',
      description: "See a solved sample problem step-by-step before tackling this question.",
      icon: GraduationCap,
      iconBg: 'bg-[#fff8e1]',
      iconColor: 'text-[#8e711f]',
      titleColor: 'text-[#8e711f]',
      accentBg: 'bg-[#fff8e1]/50',
    },
    {
      id: 'break_task' as InterventionType,
      title: 'Take a 1-Min Calming Break',
      description: "Pause for 60 seconds with a quick mindfulness rest before continuing.",
      icon: Timer,
      iconBg: 'bg-[#ffebee]',
      iconColor: 'text-[#c62828]',
      titleColor: 'text-[#c62828]',
      accentBg: 'bg-[#ffebee]/50',
    },
  ];

  return (
    <div className="fixed inset-0 z-[100] w-screen h-screen min-h-screen bg-slate-900/35 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-[#e2e2da] shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col justify-between overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex-shrink-0 p-6 sm:p-7 pb-3">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#1a1c19]">Feeling stuck?</h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Let's try a different approach to make this easier.
              </p>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Close"
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2x2 Option Grid */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-7 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {options.map((opt) => {
            const Icon = opt.icon;
            return (
              <div
                key={opt.id}
                onClick={() => {
                  if (onAction) onAction(opt.id);
                  onDismiss();
                }}
                className="relative bg-white rounded-2xl border border-[#e2e2da] p-4 sm:p-5 flex flex-col justify-between hover:border-[#32617d] hover:shadow-sm cursor-pointer transition-all overflow-hidden group active:scale-[0.98]"
              >
                {/* Decorative quarter-circle corner */}
                <div
                  className={`absolute -top-6 -right-6 w-20 h-20 rounded-full ${opt.accentBg} pointer-events-none transition-transform group-hover:scale-110`}
                />

                <div className="space-y-2 relative z-10">
                  <div className={`w-9 h-9 rounded-xl ${opt.iconBg} ${opt.iconColor} flex items-center justify-center`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className={`text-sm sm:text-base font-bold ${opt.titleColor}`}>
                      {opt.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {opt.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {isFallback && (
          <p className="sr-only">
            [Dev Diagnostic]: Generated using local fallback engine
          </p>
        )}

        {/* Bottom Action Footer */}
        <div className="flex-shrink-0 sticky bottom-0 bg-[#f0f3fa] px-6 sm:px-7 py-3 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onDismiss}
            className="min-h-[44px] px-5 py-2.5 rounded-xl border border-[#d0d0c8] bg-white text-slate-800 font-bold text-xs sm:text-sm hover:bg-slate-50 transition-all active:scale-[0.98] flex items-center justify-center"
          >
            I'll keep trying this way
          </button>
        </div>
      </div>
    </div>
  );
};
