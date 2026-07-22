import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "dark" | "bright";

export interface OsNotification {
  id: string;
  title: string;
  body: string;
  color: string;
  to: string;
  at: string;
  read: boolean;
}

export interface RecentItem {
  id: string;
  label: string;
  to: string;
  at: string;
}

interface UiState {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;

  assistantOpen: boolean;
  setAssistantOpen: (open: boolean) => void;

  dockPinned: boolean;
  toggleDockPinned: () => void;

  bookmarks: RecentItem[];
  toggleBookmark: (item: Omit<RecentItem, "at">) => void;
  isBookmarked: (to: string) => boolean;

  recents: RecentItem[];
  pushRecent: (item: Omit<RecentItem, "at">) => void;

  readNotificationIds: string[];
  markNotificationsRead: (ids: string[]) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      theme: "dark",
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set({ theme: get().theme === "dark" ? "bright" : "dark" }),

      assistantOpen: false,
      setAssistantOpen: (assistantOpen) => set({ assistantOpen }),

      dockPinned: true,
      toggleDockPinned: () => set({ dockPinned: !get().dockPinned }),

      bookmarks: [],
      toggleBookmark: (item) => {
        const exists = get().bookmarks.some((b) => b.to === item.to);
        set({
          bookmarks: exists
            ? get().bookmarks.filter((b) => b.to !== item.to)
            : [{ ...item, at: new Date().toISOString() }, ...get().bookmarks].slice(0, 12),
        });
      },
      isBookmarked: (to) => get().bookmarks.some((b) => b.to === to),

      recents: [],
      pushRecent: (item) => {
        const rest = get().recents.filter((r) => r.to !== item.to);
        set({ recents: [{ ...item, at: new Date().toISOString() }, ...rest].slice(0, 10) });
      },

      readNotificationIds: [],
      markNotificationsRead: (ids) =>
        set({ readNotificationIds: [...new Set([...get().readNotificationIds, ...ids])].slice(-200) }),
    }),
    { name: "crewmind-ui" },
  ),
);
