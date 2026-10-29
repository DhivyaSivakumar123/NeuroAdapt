import React, { useEffect, useState } from 'react';
import { BookOpen, Touchpad, Eye } from 'lucide-react';

interface ModeTransitionBannerProps {
  mode: 'text' | 'interactive' | 'visual';
}

export const ModeTransitionBanner: React.FC<ModeTransitionBannerProps> = ({ mode }) => {
  const [showPulse, setShowPulse] = useState(true);

  useEffect(() => {
    setShowPulse(true);
    const timer = setTimeout(() => setShowPulse(false), 2500);
    return () => clearTimeout(timer);
  }, [mode]);

  if (!showPulse) return null;

  const modeConfig = {
    text: {
      label: 'Reading Focus Mode',
      desc: 'Comfortable typography & reading flow',
      icon: BookOpen,
      bg: 'bg-stone-100 border-stone-300 text-stone-800',
      iconColor: 'text-stone-600',
    },
    interactive: {
      label: 'Interactive Action Mode',
      desc: 'Direct manipulation & tactile tokens',
      icon: Touchpad,
      bg: 'bg-[#eaf3f8] border-[#b9d7e8] text-[#1f4a63]',
      iconColor: 'text-[#32617d]',
    },
    visual: {
      label: 'Visual Diagram Mode',
      desc: 'Diagram-led interactive exploration',
      icon: Eye,
      bg: 'bg-[#edf5e8] border-[#bedcb5] text-[#2c4e1d]',
      iconColor: 'text-[#486730]',
    },
  }[mode];

  const Icon = modeConfig.icon;

  return (
    <div className={`w-full max-w-xl mx-auto flex items-center justify-between px-3.5 py-1.5 rounded-xl border text-xs shadow-xs transition-all duration-300 animate-fadeIn ${modeConfig.bg}`}>
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${modeConfig.iconColor}`} />
        <span className="font-bold">{modeConfig.label}</span>
        <span className="hidden sm:inline text-slate-500 font-medium">• {modeConfig.desc}</span>
      </div>
      <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-80">
        Active Mode
      </span>
    </div>
  );
};
