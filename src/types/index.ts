// Server types
export interface Server {
  id: string;
  name: string;
  hostname: string;
  tailscaleIp: string;
  port: number;
  apiKey: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServerInfo {
  hostname: string;
  os: string;
  platform: string;
  kernel: string;
  arch: string;
  uptime: string;
  agent: string;
  version: string;
}

// Metrics types
export interface HostInfo {
  hostname: string;
  os: string;
  platform: string;
  platform_version: string;
  kernel_version: string;
  kernel_arch: string;
  uptime: number;
  uptime_human: string;
  boot_time: number;
  procs: number;
}

export interface CPUInfo {
  cores: number;
  model_name: string;
  mhz: number;
  usage_total: number;
  usage_per_cpu: number[];
  load_avg_1: number;
  load_avg_5: number;
  load_avg_15: number;
}

export interface MemoryInfo {
  total: number;
  available: number;
  used: number;
  used_percent: number;
  free: number;
  buffers: number;
  cached: number;
  swap_total: number;
  swap_used: number;
  swap_free: number;
  swap_percent: number;
}

export interface DiskPartition {
  device: string;
  mountpoint: string;
  fstype: string;
  total: number;
  used: number;
  free: number;
  used_percent: number;
}

export interface DiskInfo {
  partitions: DiskPartition[];
}

export interface NetworkInterface {
  name: string;
  bytes_sent: number;
  bytes_recv: number;
  packets_sent: number;
  packets_recv: number;
  errin: number;
  errout: number;
  dropin: number;
  dropout: number;
  addrs: string[];
}

export interface NetworkInfo {
  interfaces: NetworkInterface[];
}

export interface AllMetrics {
  timestamp: string;
  host: HostInfo;
  cpu: CPUInfo;
  memory: MemoryInfo;
  disk: DiskInfo;
  network: NetworkInfo;
}

// Process types
export interface ProcessInfo {
  pid: number;
  name: string;
  username: string;
  status: string;
  cpu_percent: number;
  mem_percent: number;
  mem_rss: number;
  cmdline: string;
  create_time: string;
  num_threads: number;
}

export interface ProcessList {
  processes: ProcessInfo[];
  total: number;
}

// Service types
export interface ServiceInfo {
  name: string;
  description: string;
  load_state: string;
  active_state: string;
  sub_state: string;
  main_pid: number;
  exec_start: string;
  user: string;
  group: string;
  started_at?: string;
  memory: number;
  tasks: number;
}

export interface ServiceList {
  services: ServiceInfo[];
  total: number;
}

export interface ServiceAction {
  name: string;
  action: string;
  success: boolean;
  message: string;
}

// Docker types
export interface PortBinding {
  private_port: number;
  public_port: number;
  type: string;
  ip: string;
}

export interface Mount {
  type: string;
  source: string;
  destination: string;
  mode: string;
  rw: boolean;
}

export interface ContainerInfo {
  id: string;
  name: string;
  image: string;
  image_id: string;
  state: string;
  status: string;
  created: string;
  ports: PortBinding[];
  labels: Record<string, string>;
  networks: string[];
  mounts: Mount[];
  size_rw?: number;
  size_root_fs?: number;
}

export interface ContainerList {
  containers: ContainerInfo[];
  total: number;
}

export interface ContainerAction {
  id: string;
  name?: string;
  action: string;
  success: boolean;
  message: string;
}

// File types
export interface FileInfo {
  name: string;
  path: string;
  size: number;
  mode: string;
  mod_time: string;
  is_dir: boolean;
  is_symlink: boolean;
  link_target?: string;
  owner: string;
  group: string;
  permissions: string;
}

export interface DirectoryListing {
  path: string;
  files: FileInfo[];
  total: number;
  can_read: boolean;
}

export interface FileContent {
  path: string;
  content: string;
  size: number;
  encoding: string;
  is_binary: boolean;
  truncated: boolean;
}

// Task types
export interface Task {
  name: string;
  command: string;
  description: string;
  dangerous: boolean;
}

export interface TaskList {
  tasks: Task[];
  total: number;
}

export interface TaskResult {
  name: string;
  command: string;
  output: string;
  exit_code: number;
  success: boolean;
  error?: string;
  started_at: string;
  duration: number;
}

// Log types
export interface LogEntry {
  timestamp: string;
  unit: string;
  message: string;
  priority: number;
  pid: string;
  hostname: string;
}

export interface LogStream {
  entries: LogEntry[];
  unit?: string;
}

// Database types
export interface MetricSnapshot {
  id: string;
  serverId: string;
  cpuPercent: number;
  memoryPercent: number;
  diskPercent: number;
  loadAvg1: number;
  timestamp: Date;
}

export interface Setting {
  key: string;
  value: string;
}
