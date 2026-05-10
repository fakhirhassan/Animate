import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'creator';
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasHydrated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (user: User, token: string, refreshToken?: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  updateTokens: (token: string, refreshToken: string) => void;
  setHasHydrated: (h: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      // Persist middleware rehydrates async after mount. Pages that gate on
      // auth must wait for this flag to flip true before redirecting,
      // otherwise the first render sees null user/token and bounces to /login
      // even though localStorage has a valid session.
      hasHydrated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setToken: (token) => {
        if (token) {
          localStorage.setItem('authToken', token);
        } else {
          localStorage.removeItem('authToken');
        }
        set({ token });
      },

      login: (user, token, refreshToken) => {
        localStorage.setItem('authToken', token);
        set({ user, token, refreshToken: refreshToken || null, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem('authToken');
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
      },

      setLoading: (loading) => set({ isLoading: loading }),

      updateTokens: (token, refreshToken) => {
        localStorage.setItem('authToken', token);
        set({ token, refreshToken });
      },

      setHasHydrated: (h) => set({ hasHydrated: h }),
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        // Called once persist finishes loading from localStorage.
        // Mirror the rehydrated token into the legacy key the axios
        // interceptor reads from.
        if (state?.token) {
          try { localStorage.setItem('authToken', state.token); } catch {}
        }
        state?.setHasHydrated(true);
      },
    }
  )
);
