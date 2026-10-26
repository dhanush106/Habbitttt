import { create } from 'zustand';
import { apiRequest } from '../lib/api';
import { useAuthStore } from './authStore';

const authenticatedRequest = async (path, options = {}) => {
  const token = useAuthStore.getState().token;
  try {
    return await apiRequest(path, { ...options, token });
  } catch (error) {
    if (error.status === 401) useAuthStore.getState().logout();
    throw error;
  }
};

const replaceById = (items, updated) => items.map((item) => item._id === updated._id ? updated : item);

export const useTrackerStore = create((set, get) => ({
  habits: [],
  goals: [],
  loading: false,
  error: '',
  setError: (error) => set({ error }),
  loadTracker: async (startDate, endDate) => {
    set({ loading: true, error: '' });
    try {
      const query = `?startDate=${startDate}&endDate=${endDate}`;
      const [habitData, goalData] = await Promise.all([
        authenticatedRequest('/habits'),
        authenticatedRequest(`/goals${query}`),
      ]);
      set({ habits: habitData.habits, goals: goalData.goals, loading: false });
    } catch (error) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },
  clearError: () => set({ error: '' }),
  createHabit: async (values) => {
    const { habit } = await authenticatedRequest('/habits', { method: 'POST', body: values });
    set((state) => ({ habits: [...state.habits, habit] }));
  },
  deleteHabit: async (habitId) => {
    await authenticatedRequest(`/habits/${habitId}`, { method: 'DELETE' });
    set((state) => ({ habits: state.habits.filter((habit) => habit._id !== habitId) }));
  },
  toggleHabit: async (habitId, date, completed) => {
    const { habit } = await authenticatedRequest(`/habits/${habitId}/completions`, { method: 'PATCH', body: { date, completed } });
    set((state) => ({ habits: replaceById(state.habits, habit) }));
  },
  createGoal: async (values) => {
    const { goal } = await authenticatedRequest('/goals', { method: 'POST', body: values });
    set((state) => ({ goals: [...state.goals, goal] }));
  },
  deleteGoal: async (goalId) => {
    await authenticatedRequest(`/goals/${goalId}`, { method: 'DELETE' });
    set((state) => ({ goals: state.goals.filter((goal) => goal._id !== goalId) }));
  },
  setGoalEntry: async (goalId, date, value) => {
    const { goal } = await authenticatedRequest(`/goals/${goalId}/entries/${date}`, { method: 'PUT', body: { value } });
    set((state) => ({ goals: replaceById(state.goals, goal) }));
    return get().goals.find((item) => item._id === goalId);
  },
}));