import { create } from "zustand";
import { api, getErrorMessage } from "@/services/api";
import { connectSocket, disconnectSocket } from "@/services/socket";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  loading: boolean;
  ready: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  login: (identifier: string, password: string, remember: boolean) => Promise<void>;
  register: (payload: {
    name: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: false,
  ready: false,
  error: null,
  setUser: (user) => set({ user }),
  hydrate: async () => {
    try {
      const { data } = await api.get("/auth/me");
      set({ user: data.data.user, ready: true });
      connectSocket();
    } catch {
      set({ user: null, ready: true });
    }
  },
  login: async (identifier, password, remember) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post("/auth/login", { identifier, password, remember });
      set({ user: data.data.user, loading: false });
      connectSocket();
    } catch (err) {
      set({ loading: false, error: getErrorMessage(err, "Unable to sign in") });
      throw err;
    }
  },
  register: async (payload) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post("/auth/register", payload);
      set({ user: data.data.user, loading: false });
      connectSocket();
    } catch (err) {
      set({ loading: false, error: getErrorMessage(err, "Unable to create account") });
      throw err;
    }
  },
  logout: async () => {
    await api.post("/auth/logout");
    disconnectSocket();
    set({ user: null });
  },
}));
