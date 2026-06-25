import { create } from 'zustand';
import { colors, ThemePalette } from '../theme/colors';

interface ThemeState {
  mode: 'light' | 'dark';
  toggle: () => void;
  setMode: (mode: 'light' | 'dark') => void;
  restoreTheme: () => void;
}

function saveTheme(mode: 'light' | 'dark') {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('gems_theme_mode', mode);
    }
  } catch { /* SSR / RN native guard */ }
}

function loadTheme(): 'light' | 'dark' | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem('gems_theme_mode');
      if (saved === 'light' || saved === 'dark') return saved;
    }
  } catch { /* ignore */ }
  return null;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'dark', // default to dark
  toggle: () => set((state) => {
    const next = state.mode === 'light' ? 'dark' : 'light';
    saveTheme(next);
    return { mode: next };
  }),
  setMode: (mode: 'light' | 'dark') => {
    saveTheme(mode);
    set({ mode });
  },
  restoreTheme: () => {
    const saved = loadTheme();
    if (saved) {
      set({ mode: saved });
    }
  },
}));

export function useThemeColors(): ThemePalette {
  const mode = useThemeStore((state) => state.mode);
  return colors[mode];
}
