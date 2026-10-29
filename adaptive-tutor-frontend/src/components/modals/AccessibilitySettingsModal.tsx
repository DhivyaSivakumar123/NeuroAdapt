import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Type, Sliders, Shield } from 'lucide-react';

interface AccessibilitySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface AccessibilitySettings {
  dyslexiaFont: boolean;
  theme: 'normal' | 'calm' | 'high_contrast';
  fontSize: 'normal' | 'large' | 'xlarge';
  focusMode: boolean;
  audioNarration: boolean;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  dyslexiaFont: false,
  theme: 'normal',
  fontSize: 'normal',
  focusMode: false,
  audioNarration: false,
};

export const getStoredAccessibilitySettings = (): AccessibilitySettings => {
  try {
    const raw = localStorage.getItem('neuro_accessibility_settings');
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const applyAccessibilitySettings = (settings: AccessibilitySettings) => {
  const root = document.documentElement;

  // Font
  if (settings.dyslexiaFont) {
    root.classList.add('dyslexia-font');
  } else {
    root.classList.remove('dyslexia-font');
  }

  // Font Size
  root.classList.remove('text-scale-large', 'text-scale-xlarge');
  if (settings.fontSize === 'large') {
    root.classList.add('text-scale-large');
  } else if (settings.fontSize === 'xlarge') {
    root.classList.add('text-scale-xlarge');
  }

  // Theme
  root.classList.remove('theme-calm', 'theme-high-contrast');
  if (settings.theme === 'calm') {
    root.classList.add('theme-calm');
  } else if (settings.theme === 'high_contrast') {
    root.classList.add('theme-high-contrast');
  }

  // Focus mode
  if (settings.focusMode) {
    root.classList.add('focus-mode-active');
  } else {
    root.classList.remove('focus-mode-active');
  }
};

export const AccessibilitySettingsModal: React.FC<AccessibilitySettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(getStoredAccessibilitySettings());

  useEffect(() => {
    if (isOpen) {
      setSettings(getStoredAccessibilitySettings());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    localStorage.setItem('neuro_accessibility_settings', JSON.stringify(updated));
    applyAccessibilitySettings(updated);
  };

  const modalContent = (
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[99999] w-screen h-screen min-h-screen bg-slate-900/40 backdrop-blur-[3px] flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#deded6] overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-[#deded6] bg-[#fafaf7]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#e8f0fe] text-[#32617d] border border-[#d2e3fc] flex items-center justify-center shadow-2xs flex-shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-[#1a1c19] tracking-tight">
                Sensory & Accessibility Controls
              </h3>
              <p className="text-xs font-semibold text-[#32617d]">
                Customize your visual, pacing, and font preferences
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

        <div className="p-5 sm:p-6 space-y-5 bg-white">
          {/* Dyslexia Typography Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl border border-[#deded6] bg-[#fafaf7] hover:bg-white transition-all shadow-2xs">
            <div className="space-y-0.5 pr-4">
              <div className="flex items-center gap-2 font-extrabold text-sm text-[#1a1c19]">
                <Type className="w-4 h-4 text-[#32617d]" />
                <span>Dyslexia-Friendly Typography</span>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                OpenDyslexic weighted font with wide letter & word spacing
              </p>
            </div>
            <button
              type="button"
              onClick={() => updateSetting('dyslexiaFont', !settings.dyslexiaFont)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 cursor-pointer ${
                settings.dyslexiaFont ? 'bg-[#32617d]' : 'bg-[#deded6]'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform ${
                  settings.dyslexiaFont ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Color & Theme Mode */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
              Visual Theme & Contrast
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'normal' as const, label: 'Default', desc: 'Standard clarity' },
                { id: 'calm' as const, label: 'Calm Soft', desc: 'Warm muted tones' },
                { id: 'high_contrast' as const, label: 'High Contrast', desc: 'Max legibility' },
              ].map((th) => (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => updateSetting('theme', th.id)}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    settings.theme === th.id
                      ? 'border-[#32617d] bg-[#f0f6fa] text-[#32617d] font-extrabold shadow-2xs ring-1 ring-[#32617d]'
                      : 'border-[#deded6] bg-white text-slate-700 hover:bg-[#fafaf7]'
                  }`}
                >
                  <p className="text-xs">{th.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Text Sizing */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
              Font Scale
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'normal' as const, label: '100% Standard' },
                { id: 'large' as const, label: '115% Large' },
                { id: 'xlarge' as const, label: '130% Extra Large' },
              ].map((sz) => (
                <button
                  key={sz.id}
                  type="button"
                  onClick={() => updateSetting('fontSize', sz.id)}
                  className={`p-3 rounded-2xl border text-center text-xs transition-all cursor-pointer ${
                    settings.fontSize === sz.id
                      ? 'border-[#32617d] bg-[#f0f6fa] text-[#32617d] font-extrabold shadow-2xs ring-1 ring-[#32617d]'
                      : 'border-[#deded6] bg-white text-slate-700 hover:bg-[#fafaf7]'
                  }`}
                >
                  {sz.label}
                </button>
              ))}
            </div>
          </div>

          {/* Focus Mode */}
          <div className="flex items-center justify-between p-4 rounded-2xl border border-[#deded6] bg-[#fafaf7] hover:bg-white transition-all shadow-2xs">
            <div className="space-y-0.5 pr-4">
              <div className="flex items-center gap-2 font-extrabold text-sm text-[#1a1c19]">
                <Shield className="w-4 h-4 text-[#32617d]" />
                <span>Reduced Motion & Focus Mode</span>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Minimizes background animations and non-essential simulator controls
              </p>
            </div>
            <button
              type="button"
              onClick={() => updateSetting('focusMode', !settings.focusMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 cursor-pointer ${
                settings.focusMode ? 'bg-[#32617d]' : 'bg-[#deded6]'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform ${
                  settings.focusMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full h-11 min-h-[44px] rounded-xl bg-[#32617d] hover:bg-[#284f67] text-white font-extrabold text-xs sm:text-sm shadow-xs transition-all cursor-pointer active:scale-[0.98]"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
