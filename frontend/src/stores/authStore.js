import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { apiRequest } from '../lib/api';

let initializationPromise;

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      initialized: false,
      initialize: () => {
        if (initializationPromise) return initializationPromise;
        initializationPromise = (async () => {
          const token = get().token;
          if (!token) {
            set({ initialized: true });
            return;
          }
          try {
            const { user } = await apiRequest('/auth/me', { token });
            set({ user, initialized: true });
          } catch {
            set({ token: null, user: null, initialized: true });
          }
        })();
        return initializationPromise;
      },
      login: async (credentials) => {
        const session = await apiRequest('/auth/login', { method: 'POST', body: credentials });
        set({ ...session, initialized: true });
        return session.user;
      },
      register: async (details) => {
        const session = await apiRequest('/auth/register', { method: 'POST', body: details });
        set({ ...session, initialized: true });
        return session.user;
      },
      updateProfile: async (changes) => {
        const { token } = get();
        const { user } = await apiRequest('/auth/me', { token, method: 'PATCH', body: changes });
        set({ user });
        return user;
      },
      logout: () => {
        initializationPromise = undefined;
        set({ user: null, token: null, initialized: true });
      },
    }),
    {
      name: 'habbittt-session',
      storage: createJSONStorage(() => sessionStorage),
      partialize: ({ user, token }) => ({ user, token }),
    }
  )
);