import { useThemeStore } from '../themeStore';

describe('themeStore', () => {
  beforeEach(() => {
    // Reset store state manually since Zustand store survives across tests
    useThemeStore.setState({ mode: 'dark' });
    window.localStorage.clear();
  });

  it('should have dark mode as default', () => {
    const state = useThemeStore.getState();
    expect(state.mode).toBe('dark');
  });

  it('should toggle theme mode', () => {
    useThemeStore.getState().toggle();
    expect(useThemeStore.getState().mode).toBe('light');
    expect(window.localStorage.getItem('gems_theme_mode')).toBe('light');

    useThemeStore.getState().toggle();
    expect(useThemeStore.getState().mode).toBe('dark');
    expect(window.localStorage.getItem('gems_theme_mode')).toBe('dark');
  });

  it('should set theme mode explicitly', () => {
    useThemeStore.getState().setMode('light');
    expect(useThemeStore.getState().mode).toBe('light');
    expect(window.localStorage.getItem('gems_theme_mode')).toBe('light');

    useThemeStore.getState().setMode('dark');
    expect(useThemeStore.getState().mode).toBe('dark');
    expect(window.localStorage.getItem('gems_theme_mode')).toBe('dark');
  });

  it('should restore theme mode from localStorage', () => {
    window.localStorage.setItem('gems_theme_mode', 'light');
    useThemeStore.getState().restoreTheme();
    expect(useThemeStore.getState().mode).toBe('light');
  });

  it('should default to dark mode if no theme is stored in localStorage', () => {
    useThemeStore.getState().restoreTheme();
    expect(useThemeStore.getState().mode).toBe('dark');
  });
});
