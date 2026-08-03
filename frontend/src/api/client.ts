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

export function getWsUrl(path: string, token?: string | null): string {
  let wsBase = "";
  if (import.meta.env.VITE_WS_URL) {
    wsBase = import.meta.env.VITE_WS_URL;
  } else if (import.meta.env.PROD) {
    // Netlify does not support proxying WebSockets via _redirects.
    // We must connect directly to the Render production backend.
    wsBase = "wss://crewmind-bjlj.onrender.com";
  } else {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    wsBase = `${protocol}//${host}`;
  }
  
  const url = new URL(`${wsBase}${path}`);
  if (token) {
    url.searchParams.set("token", token);
  }
  return url.toString();
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

  // Scope every request to the active workspace so permissions, data and
  // role all resolve against the organization the user is working in.
  const { usePermissionStore } = await import("#/stores/permissionStore");
  const workspaceId = usePermissionStore.getState().workspaceId;
  if (workspaceId) {
    if (config.headers && typeof config.headers.set === 'function') {
      config.headers.set("x-workspace-id", workspaceId);
    } else {
      config.headers["x-workspace-id"] = workspaceId;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    // Sometimes the backend returns double-encoded JSON or JSON strings 
    // with the wrong Content-Type, causing Axios to leave it as a string.
    // This safely parses it into an array or object so downstream code doesn't crash.
    if (typeof response.data === 'string') {
      try {
        const parsed = JSON.parse(response.data);
        if (parsed !== null && typeof parsed === 'object') {
          response.data = parsed;
        }
      } catch (e) {
        // If the proxy returns an HTML page (e.g. 404 or parked domain page) with a 200 OK,
        // we must reject it so React Query treats it as an error and mock data triggers.
        if (response.data.trim().startsWith('<')) {
          return Promise.reject(new Error("Received HTML payload instead of JSON"));
        }
      }
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
