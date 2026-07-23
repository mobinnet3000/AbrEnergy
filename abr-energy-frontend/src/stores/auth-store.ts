import { create } from 'zustand';
import type { User, AuthTokens } from '@/types';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  setAuth: (user: User, tokens: AuthTokens) => void;
  setUser: (user: User) => void;
  setTokens: (tokens: AuthTokens) => void;
  logout: () => void;
  initialize: () => void;
}

let initPromise: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tokens: null,
  isAuthenticated: false,

  setAuth: (user, tokens) => {
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
    set({ user, tokens, isAuthenticated: true });
  },

  setUser: (user) => set({ user }),

  setTokens: (tokens) => {
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
    set({ tokens, isAuthenticated: true });
  },

  logout: () => {
    const refresh = localStorage.getItem('refresh_token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ user: null, tokens: null, isAuthenticated: false });
    if (refresh) {
      import('@/api/axios').then(({ default: ax }) => {
        ax.post('/auth/logout/', { refresh }).catch(() => {});
      });
    }
  },

  initialize: () => {
    if (initPromise) return initPromise;
    const access = localStorage.getItem('access_token');
    if (!access) return;
    initPromise = import('@/api/axios').then(({ default: ax }) =>
      ax.get('/users/me/').then((res) => {
        const refresh = localStorage.getItem('refresh_token') || '';
        set({ user: res.data, tokens: { access, refresh }, isAuthenticated: true });
      }).catch(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ user: null, tokens: null, isAuthenticated: false });
      })
    );
  },
}));
