import { create } from 'zustand';
import { apiRequest } from '../lib/api';
import { useAuthStore } from './authStore';

const request = async (path, options = {}) => {
  try {
    return await apiRequest(path, { ...options, token: useAuthStore.getState().token });
  } catch (error) {
    if (error.status === 401) useAuthStore.getState().logout();
    throw error;
  }
};

export const useLeetTrackStore = create((set, get) => ({
  problems: [],
  recentProblems: [],
  dailyGoals: [],
  topics: [],
  activity: [],
  summary: { todaySolved: 0, dailyTarget: 10, currentStreak: 0, bestStreak: 0, totalSolved: 0, periodSolved: 0, attempted: 0, difficultyCounts: { Easy: 0, Medium: 0, Hard: 0 }, topicCount: 0 },
  loading: false,
  error: '',
  startDate: '',
  endDate: '',
  focusDate: '',
  loadDashboard: async (startDate, endDate, focusDate) => {
    set({ loading: true, error: '', startDate, endDate, focusDate });
    try {
      const query = new URLSearchParams({ startDate, endDate, focusDate });
      const data = await request(`/leettrack/dashboard?${query}`);
      set({ ...data, loading: false });
    } catch (error) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },
  clearError: () => set({ error: '' }),
  refresh: async () => {
    const { startDate, endDate, focusDate } = get();
    if (startDate && endDate && focusDate) await get().loadDashboard(startDate, endDate, focusDate);
  },
  createProblem: async (body) => {
    const { problem } = await request('/leettrack/problems', { method: 'POST', body });
    await get().refresh();
    return problem;
  },
  updateProblem: async (problemId, body) => {
    await request(`/leettrack/problems/${problemId}`, { method: 'PATCH', body });
    await get().refresh();
  },
  deleteProblem: async (problemId) => {
    await request(`/leettrack/problems/${problemId}`, { method: 'DELETE' });
    await get().refresh();
  },
  createGoal: async (body) => {
    await request('/leettrack/goals', { method: 'POST', body });
    await get().refresh();
  },
  updateGoal: async (goalId, body) => {
    await request(`/leettrack/goals/${goalId}`, { method: 'PATCH', body });
    await get().refresh();
  },
  deleteGoal: async (goalId) => {
    await request(`/leettrack/goals/${goalId}`, { method: 'DELETE' });
    await get().refresh();
  },
  updateDailyTarget: async (dailyProblemTarget) => {
    await request('/leettrack/preferences', { method: 'PATCH', body: { dailyProblemTarget } });
    await get().refresh();
  },
  updateTopicTarget: async (topic, target) => {
    await request(`/leettrack/topics/${encodeURIComponent(topic)}/target`, { method: 'PUT', body: { target } });
    await get().refresh();
  },
}));