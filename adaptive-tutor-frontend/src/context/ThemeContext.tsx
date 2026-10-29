import React, { createContext, useContext, useState, useEffect } from 'react';
import { Target, Leaf, Zap, Moon, Sparkles } from 'lucide-react';

export type AppThemeKey = 'focus' | 'calm' | 'energetic' | 'dark' | 'soft';

export interface ThemeConfig {
  key: AppThemeKey;
  icon: React.ElementType;
  name: string;
  description: string;
  accentBg: string;
  activeColor: string;
  ringColor: string;
}

export const THEME_CONFIGS: Record<AppThemeKey, ThemeConfig> = {
  focus: {
    key: 'focus',
    icon: Target,
    name: 'Goal & Focus',
    description: 'High clarity slate & deep indigo layout for distraction-free learning',
    accentBg: 'bg-[#e8f0fe]',
    activeColor: 'text-[#32617d] bg-[#e8f0fe] border border-[#32617d]/30 ring-2 ring-[#32617d]/40',
    ringColor: 'ring-[#32617d]',
  },
  calm: {
    key: 'calm',
    icon: Leaf,
    name: 'Growth & Calm',
    description: 'Soothing sage green & forest palette to reduce sensory overload',
    accentBg: 'bg-[#e8f5e9]',
    activeColor: 'text-[#2e7d32] bg-[#e8f5e9] border border-[#2e7d32]/30 ring-2 ring-[#2e7d32]/40',
    ringColor: 'ring-[#2e7d32]',
  },
  energetic: {
    key: 'energetic',
    icon: Zap,
    name: 'Energy & Performance',
    description: 'Vibrant amber & coral theme for high energy & engagement',
    accentBg: 'bg-[#ffedd5]',
    activeColor: 'text-[#ea580c] bg-[#ffedd5] border border-[#ea580c]/30 ring-2 ring-[#ea580c]/40',
    ringColor: 'ring-[#ea580c]',
  },
  dark: {
    key: 'dark',
    icon: Moon,
    name: 'Sleep & Night',
    description: 'High contrast midnight charcoal & electric cyan theme',
    accentBg: 'bg-[#182234]',
    activeColor: 'text-[#38bdf8] bg-[#182234] border border-[#38bdf8]/40 ring-2 ring-[#38bdf8]/40',
    ringColor: 'ring-[#38bdf8]',
  },
  soft: {
    key: 'soft',
    icon: Sparkles,
    name: 'Default Soft',
    description: 'Ultra-soft pastel lavender & sky blue tint for gentle reading',
    accentBg: 'bg-[#f3e8ff]',
    activeColor: 'text-[#7c3aed] bg-[#f3e8ff] border border-[#7c3aed]/30 ring-2 ring-[#7c3aed]/40',
    ringColor: 'ring-[#7c3aed]',
  },
};

interface ThemeContextType {
  currentTheme: AppThemeKey;
  activeConfig: ThemeConfig;
  setTheme: (themeKey: AppThemeKey) => void;
  availableThemes: ThemeConfig[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'student_global_theme_mode';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentThemeState] = useState<AppThemeKey>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY) as AppThemeKey;
      if (saved && THEME_CONFIGS[saved]) {
        return saved;
      }
    }
    return 'focus';
  });

  const applyThemeToDOM = (themeKey: AppThemeKey) => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', themeKey);
      
      // Update class list for compatibility
      Object.keys(THEME_CONFIGS).forEach((k) => {
        document.documentElement.classList.remove(`theme-${k}`);
      });
      document.documentElement.classList.add(`theme-${themeKey}`);
    }
  };

  useEffect(() => {
    applyThemeToDOM(currentTheme);
  }, [currentTheme]);

  const setTheme = (themeKey: AppThemeKey) => {
    if (THEME_CONFIGS[themeKey]) {
      setCurrentThemeState(themeKey);
      applyThemeToDOM(themeKey);
      try {
        localStorage.setItem(STORAGE_KEY, themeKey);
      } catch {}
    }
  };

  const activeConfig = THEME_CONFIGS[currentTheme];
  const availableThemes = Object.values(THEME_CONFIGS);

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        activeConfig,
        setTheme,
        availableThemes,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
