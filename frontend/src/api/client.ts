import { QueryClient } from "@tanstack/react-query";
import axios from "axios";

import { useAuthStore } from "#/stores/authStore";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

export const api = axios.create({ baseURL: "/api" });

let getTokenFn: (() => Promise<string | null>) | null = null;

export function setGetTokenFn(fn: () => Promise<string | null>) {
  getTokenFn = fn;
}

api.interceptors.request.use(async (config) => {
  let token = null;
  if (getTokenFn) {
    try {
      token = await getTokenFn();
    } catch (e) {
      console.error("Failed to fetch Clerk token", e);
    }
  } else {
    token = useAuthStore.getState().token;
  }

  if (token) {
    if (config.headers && typeof config.headers.set === 'function') {
      config.headers.set("Authorization", `Bearer ${token}`);
    } else {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
