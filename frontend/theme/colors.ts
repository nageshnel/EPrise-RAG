export interface ThemePalette {
  bg: {
    primary: string;
    secondary: string;
    card: string;
  };
  border: {
    default: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
  };
  accent: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
  };
  nav: {
    bg: string;
    active: string;
  };
}

export const colors: Record<'light' | 'dark', ThemePalette> = {
  light: {
    bg: {
      primary: '#EFF6FF',
      secondary: '#FFFFFF',
      card: '#FFFFFF',
    },
    border: {
      default: '#DBEAFE',
    },
    text: {
      primary: '#1E293B',
      secondary: '#475569',
      muted: '#94A3B8',
    },
    accent: {
      primary: '#3B82F6',
      secondary: '#60A5FA',
      success: '#10B981',
      warning: '#F97316',
      error: '#EF4444',
    },
    nav: {
      bg: '#FFFFFF',
      active: 'rgba(59,130,246,0.1)',
    },
  },
  dark: {
    bg: {
      primary: '#05050f',
      secondary: '#0a0a1a',
      card: 'rgba(255,255,255,0.04)',
    },
    border: {
      default: 'rgba(255,255,255,0.08)',
    },
    text: {
      primary: '#f1f5f9',
      secondary: '#94a3b8',
      muted: '#475569',
    },
    accent: {
      primary: '#7C3AED',
      secondary: '#8B5CF6',
      success: '#4ADE80',
      warning: '#FBBF24',
      error: '#F87171',
    },
    nav: {
      bg: 'rgba(10,10,26,0.95)',
      active: 'rgba(124,58,237,0.12)',
    },
  },
};
