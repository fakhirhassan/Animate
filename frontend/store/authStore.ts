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
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (user: User, token: string, refreshToken?: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  updateTokens: (token: string, refreshToken: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

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
    }),
    {
      name: 'auth-storage',
    }
  )
);
