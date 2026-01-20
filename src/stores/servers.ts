import { create } from "zustand";
import type { Server, AllMetrics } from "@/types";

interface ServerState {
  servers: Server[];
  selectedServerId: string | null;
  metrics: Record<string, AllMetrics>;
  isLoading: boolean;
  error: string | null;
}

interface ServerActions {
  setServers: (servers: Server[]) => void;
  addServer: (server: Server) => void;
  updateServer: (id: string, data: Partial<Server>) => void;
  removeServer: (id: string) => void;
  selectServer: (id: string | null) => void;
  setMetrics: (serverId: string, metrics: AllMetrics) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useServerStore = create<ServerState & ServerActions>((set) => ({
  servers: [],
  selectedServerId: null,
  metrics: {},
  isLoading: false,
  error: null,

  setServers: (servers) => set({ servers }),

  addServer: (server) =>
    set((state) => ({
      servers: [...state.servers, server],
    })),

  updateServer: (id, data) =>
    set((state) => ({
      servers: state.servers.map((s) =>
        s.id === id ? { ...s, ...data } : s
      ),
    })),

  removeServer: (id) =>
    set((state) => ({
      servers: state.servers.filter((s) => s.id !== id),
      selectedServerId:
        state.selectedServerId === id ? null : state.selectedServerId,
    })),

  selectServer: (id) => set({ selectedServerId: id }),

  setMetrics: (serverId, metrics) =>
    set((state) => ({
      metrics: { ...state.metrics, [serverId]: metrics },
    })),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),
}));

// Selectors
export const useSelectedServer = () =>
  useServerStore((state) =>
    state.servers.find((s) => s.id === state.selectedServerId)
  );

export const useServerMetrics = (serverId: string) =>
  useServerStore((state) => state.metrics[serverId]);
