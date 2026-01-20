import type {
  ServerInfo,
  AllMetrics,
  ProcessList,
  ServiceList,
  ServiceInfo,
  ServiceAction,
  ContainerList,
  ContainerInfo,
  ContainerAction,
  TaskList,
  TaskResult,
  DirectoryListing,
  FileContent,
  LogStream,
} from "@/types";

export class APIClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.apiKey = apiKey;
  }

  private async fetch<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers = new Headers(options.headers);
    headers.set("Authorization", `Bearer ${this.apiKey}`);
    headers.set("Content-Type", "application/json");

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || `Request failed: ${response.status}`);
    }

    return response.json();
  }

  // Health
  async health(): Promise<{ status: string; version: string }> {
    const response = await fetch(`${this.baseUrl}/health`);
    return response.json();
  }

  // Server info
  async getInfo(): Promise<ServerInfo> {
    return this.fetch("/api/info");
  }

  // Metrics
  async getMetrics(): Promise<AllMetrics> {
    return this.fetch("/api/metrics");
  }

  async getCPU(): Promise<AllMetrics["cpu"]> {
    return this.fetch("/api/metrics/cpu");
  }

  async getMemory(): Promise<AllMetrics["memory"]> {
    return this.fetch("/api/metrics/memory");
  }

  async getDisk(): Promise<AllMetrics["disk"]> {
    return this.fetch("/api/metrics/disk");
  }

  async getNetwork(): Promise<AllMetrics["network"]> {
    return this.fetch("/api/metrics/network");
  }

  // Processes
  async getProcesses(limit = 50): Promise<ProcessList> {
    return this.fetch(`/api/processes?limit=${limit}`);
  }

  async killProcess(pid: number, signal = 15): Promise<{ success: boolean; message: string }> {
    return this.fetch(`/api/processes/${pid}/kill`, {
      method: "POST",
      body: JSON.stringify({ signal }),
    });
  }

  // Services
  async getServices(): Promise<ServiceList> {
    return this.fetch("/api/services");
  }

  async getService(name: string): Promise<ServiceInfo> {
    return this.fetch(`/api/services/${name}`);
  }

  async startService(name: string): Promise<ServiceAction> {
    return this.fetch(`/api/services/${name}/start`, { method: "POST" });
  }

  async stopService(name: string): Promise<ServiceAction> {
    return this.fetch(`/api/services/${name}/stop`, { method: "POST" });
  }

  async restartService(name: string): Promise<ServiceAction> {
    return this.fetch(`/api/services/${name}/restart`, { method: "POST" });
  }

  // Docker
  async getContainers(all = false): Promise<ContainerList> {
    return this.fetch(`/api/docker/containers?all=${all}`);
  }

  async getContainer(id: string): Promise<ContainerInfo> {
    return this.fetch(`/api/docker/containers/${id}`);
  }

  async startContainer(id: string): Promise<ContainerAction> {
    return this.fetch(`/api/docker/containers/${id}/start`, { method: "POST" });
  }

  async stopContainer(id: string): Promise<ContainerAction> {
    return this.fetch(`/api/docker/containers/${id}/stop`, { method: "POST" });
  }

  async restartContainer(id: string): Promise<ContainerAction> {
    return this.fetch(`/api/docker/containers/${id}/restart`, { method: "POST" });
  }

  async getContainerLogs(id: string, tail = 100): Promise<{ id: string; logs: string[] }> {
    return this.fetch(`/api/docker/containers/${id}/logs?tail=${tail}`);
  }

  // Files
  async listDirectory(path: string): Promise<DirectoryListing> {
    return this.fetch(`/api/files?path=${encodeURIComponent(path)}`);
  }

  async getFileContent(path: string): Promise<FileContent> {
    return this.fetch(`/api/files/content?path=${encodeURIComponent(path)}`);
  }

  async getDiskUsage(path: string): Promise<{ total_size: number; file_count: number }> {
    return this.fetch(`/api/files/diskusage?path=${encodeURIComponent(path)}`);
  }

  // Tasks
  async getTasks(): Promise<TaskList> {
    return this.fetch("/api/tasks");
  }

  async runTask(name: string, confirm = false): Promise<TaskResult> {
    const query = confirm ? "?confirm=true" : "";
    return this.fetch(`/api/tasks/${name}/run${query}`, { method: "POST" });
  }

  // Logs
  async getLogs(options: {
    unit?: string;
    priority?: number;
    lines?: number;
    since?: string;
    until?: string;
  }): Promise<LogStream> {
    const params = new URLSearchParams();
    if (options.unit) params.set("unit", options.unit);
    if (options.priority !== undefined) params.set("priority", options.priority.toString());
    if (options.lines) params.set("lines", options.lines.toString());
    if (options.since) params.set("since", options.since);
    if (options.until) params.set("until", options.until);

    return this.fetch(`/api/logs/query?${params}`);
  }

  async getUnitLogs(unit: string, lines = 100): Promise<{ unit: string; entries: LogStream["entries"] }> {
    return this.fetch(`/api/logs/${unit}?lines=${lines}`);
  }

  // SSE Streams
  createEventSource(path: string): EventSource {
    const url = `${this.baseUrl}${path}?token=${this.apiKey}`;
    return new EventSource(url);
  }

  streamMetrics(onMetrics: (metrics: AllMetrics) => void, onError?: (error: Event) => void): () => void {
    const eventSource = this.createEventSource("/api/events");

    eventSource.addEventListener("metrics", (event) => {
      try {
        const metrics = JSON.parse(event.data);
        onMetrics(metrics);
      } catch (e) {
        console.error("Failed to parse metrics:", e);
      }
    });

    if (onError) {
      eventSource.onerror = onError;
    }

    return () => eventSource.close();
  }

  streamLogs(
    unit: string | undefined,
    onLog: (entry: LogStream["entries"][0]) => void,
    onError?: (error: Event) => void
  ): () => void {
    const path = unit ? `/api/logs?unit=${unit}` : "/api/logs";
    const eventSource = this.createEventSource(path);

    eventSource.addEventListener("log", (event) => {
      try {
        const entry = JSON.parse(event.data);
        onLog(entry);
      } catch (e) {
        console.error("Failed to parse log:", e);
      }
    });

    if (onError) {
      eventSource.onerror = onError;
    }

    return () => eventSource.close();
  }
}
