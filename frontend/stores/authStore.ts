import { create } from 'zustand';

export type UserRole = 'ADMIN' | 'USER';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

interface AuthState {
  /** Currently authenticated user, or null if not logged in */
  user: AuthUser | null;
  /** Whether a login attempt is in progress */
  isLoading: boolean;
  /** Last login error message */
  error: string | null;

  /** Attempt login with email + password. Returns true on success. */
  login: (email: string, password: string) => Promise<boolean>;
  /** Clear the session */
  logout: () => void;
  /** Try to restore a saved session from localStorage */
  restoreSession: () => void;
}

/**
 * Mock user database.
 * In production this would call the API Gateway's /auth/login endpoint.
 */
const MOCK_USERS: Record<string, { password: string; user: AuthUser }> = {
  'admin@gems.ai': {
    password: 'admin123',
    user: {
      id: 'usr_admin_001',
      name: 'System Administrator',
      email: 'admin@gems.ai',
      role: 'ADMIN',
    },
  },
  'user@gems.ai': {
    password: 'user123',
    user: {
      id: 'usr_user_001',
      name: 'Alex Johnson',
      email: 'user@gems.ai',
      role: 'USER',
    },
  },
};

function saveSession(user: AuthUser) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('gems_auth_session', JSON.stringify(user));
    }
  } catch { /* SSR / RN native guard */ }
}

function clearSession() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('gems_auth_session');
    }
  } catch { /* SSR / RN native guard */ }
}

function loadSession(): AuthUser | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem('gems_auth_session');
      if (raw) return JSON.parse(raw) as AuthUser;
    }
  } catch { /* ignore parse errors */ }
  return null;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    // Simulate network delay (replace with real API call)
    await new Promise((r) => setTimeout(r, 1200));

    const entry = MOCK_USERS[email.toLowerCase().trim()];
    if (!entry || entry.password !== password) {
      set({ isLoading: false, error: 'Invalid email or password. Please try again.' });
      return false;
    }

    saveSession(entry.user);
    set({ user: entry.user, isLoading: false, error: null });
    return true;
  },

  logout: () => {
    clearSession();
    set({ user: null, error: null });
  },

  restoreSession: () => {
    const saved = loadSession();
    if (saved) {
      set({ user: saved });
    }
  },
}));
