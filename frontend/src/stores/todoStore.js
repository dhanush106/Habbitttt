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

export const useTodoStore = create((set, get) => ({
  tasks: [],
  dailyGoals: [],
  summary: { totalTasks: 0, completedTasks: 0, inProgressTasks: 0, pendingTasks: 0, focusMinutes: 0, focusHours: 0, productivityPercent: 0, categoryCount: 0 },
  categories: [],
  activity: [],
  focusDate: '',
  startDate: '',
  endDate: '',
  loading: false,
  error: '',
  loadDashboard: async (startDate, endDate, focusDate) => {
    set({ loading: true, error: '', startDate, endDate, focusDate });
    try {
      const query = new URLSearchParams({ startDate, endDate, focusDate });
      const data = await request(`/todo/dashboard?${query}`);
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
  createTask: async (values) => {
    const { task } = await request('/todo/tasks', { method: 'POST', body: values });
    await get().refresh();
    return task;
  },
  updateTask: async (taskId, values) => {
    const { task } = await request(`/todo/tasks/${taskId}`, { method: 'PATCH', body: values });
    await get().refresh();
    return task;
  },
  deleteTask: async (taskId) => {
    await request(`/todo/tasks/${taskId}`, { method: 'DELETE' });
    await get().refresh();
  },
  createDailyGoal: async (values) => {
    await request('/todo/goals', { method: 'POST', body: values });
    await get().refresh();
  },
  updateDailyGoal: async (goalId, completed) => {
    await request(`/todo/goals/${goalId}`, { method: 'PATCH', body: { completed } });
    await get().refresh();
  },
  deleteDailyGoal: async (goalId) => {
    await request(`/todo/goals/${goalId}`, { method: 'DELETE' });
    await get().refresh();
  },
}));