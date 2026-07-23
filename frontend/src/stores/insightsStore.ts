import { create } from 'zustand';
import { DashboardMetrics } from '#/api/metrics';

interface InsightsState {
  metrics: DashboardMetrics | null;
  setMetrics: (metrics: DashboardMetrics) => void;
}

export const useInsightsStore = create<InsightsState>((set) => ({
  metrics: null,
  setMetrics: (metrics) => set({ metrics }),
}));
