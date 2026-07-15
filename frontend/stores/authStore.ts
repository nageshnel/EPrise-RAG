import { create } from 'zustand';
import { decodeJwt } from '../utils/jwt';
import { getGatewayUrl } from '../utils/api';

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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      const gatewayUrl = getGatewayUrl();
      const res = await fetch(`${gatewayUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password }),
      });

      if (!res.ok) {
        let msg = 'Invalid credentials';
        if (res.status === 401) {
          msg = 'Invalid email or password. Please try again.';
        } else {
          try {
            const errBody = await res.json();
            if (errBody && errBody.message) msg = errBody.message;
          } catch { /* ignore parse error */ }
        }
        set({ isLoading: false, error: msg });
        return false;
      }

      const data = await res.json(); // returns { token, expiresInMs }
      console.log("logines success : ", JSON.stringify(data))
      const decoded = decodeJwt(data.token);
      if (!decoded) {
        set({ isLoading: false, error: 'Malformed authentication token received.' });
        return false;
      }

      const role = decoded.role || 'USER';
      const user: AuthUser = {
        id: decoded.sub || email,
        name: decoded.sub ? decoded.sub.split('@')[0] : 'User',
        email: decoded.sub || email,
        role: role as UserRole,
      };

      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('eprise_auth_token', data.token);
          window.localStorage.setItem('eprise_auth_session', JSON.stringify(user));
        }
      } catch { /* ignore */ }

      set({ user, isLoading: false, error: null });
      return true;
    } catch (e) {
      set({ isLoading: false, error: 'Connection error. Please verify the gateway server is running.' });
      return false;
    }
  },

  logout: () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('eprise_auth_token');
        window.localStorage.removeItem('eprise_auth_session');
      }
    } catch { /* ignore */ }
    set({ user: null, error: null });
  },

  restoreSession: () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const token = window.localStorage.getItem('eprise_auth_token');
        const session = window.localStorage.getItem('eprise_auth_session');
        if (token && session) {
          const user = JSON.parse(session) as AuthUser;
          set({ user });
        }
      }
    } catch { /* ignore */ }
  },
}));
