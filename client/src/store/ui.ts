import { create } from "zustand";

export type NavView = "chats" | "contacts" | "groups" | "archived" | "settings";

interface UiState {
  theme: "dark" | "light";
  nav: NavView;
  detailsOpen: boolean;
  mobileChat: boolean;
  setTheme: (theme: "dark" | "light") => void;
  setNav: (nav: NavView) => void;
  toggleDetails: () => void;
  setDetails: (open: boolean) => void;
  setMobileChat: (open: boolean) => void;
}

const stored = (typeof localStorage !== "undefined" && localStorage.getItem("orin-theme")) as
  | "dark"
  | "light"
  | null;

export const useUi = create<UiState>((set) => ({
  theme: stored ?? "dark",
  nav: "chats",
  detailsOpen: false,
  mobileChat: false,
  setTheme: (theme) => {
    localStorage.setItem("orin-theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
    set({ theme });
  },
  setNav: (nav) => set({ nav, mobileChat: false }),
  toggleDetails: () => set((s) => ({ detailsOpen: !s.detailsOpen })),
  setDetails: (open) => set({ detailsOpen: open }),
  setMobileChat: (open) => set({ mobileChat: open }),
}));
