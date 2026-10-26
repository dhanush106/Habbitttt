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

export const useFitnessStore = create((set, get) => ({
  workouts: [],
  measurements: [],
  weightHistory: [],
  goals: [],
  summary: { workouts: 0, calories: 0, activeDays: 0, durationMinutes: 0, dailyActivity: [] },
  startDate: '',
  endDate: '',
  loading: false,
  error: '',
  loadDashboard: async (startDate, endDate) => {
    set({ loading: true, error: '', startDate, endDate });
    try {
      const query = new URLSearchParams({ startDate, endDate });
      const data = await request(`/fitness/dashboard?${query}`);
      set({ ...data, loading: false });
    } catch (error) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },
  clearError: () => set({ error: '' }),
  refresh: async () => {
    const { startDate, endDate } = get();
    if (startDate && endDate) await get().loadDashboard(startDate, endDate);
  },
  createWorkout: async (values) => {
    await request('/fitness/workouts', { method: 'POST', body: values });
    await get().refresh();
  },
  deleteWorkout: async (workoutId) => {
    await request(`/fitness/workouts/${workoutId}`, { method: 'DELETE' });
    await get().refresh();
  },
  saveMeasurement: async ({ type, date, value }) => {
    await request(`/fitness/measurements/${type}/${date}`, { method: 'PUT', body: { value } });
    await get().refresh();
  },
  createGoal: async (values) => {
    await request('/fitness/goals', { method: 'POST', body: values });
    await get().refresh();
  },
  deleteGoal: async (goalId) => {
    await request(`/fitness/goals/${goalId}`, { method: 'DELETE' });
    await get().refresh();
  },
}));