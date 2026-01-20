"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricsCard } from "@/components/dashboard/metrics-card";
import { APIClient } from "@/lib/api";
import { formatBytes, formatUptime } from "@/lib/utils";
import type { Server, AllMetrics } from "@/types";
import {
  ArrowLeft,
  Activity,
  Cpu,
  HardDrive,
  MemoryStick,
  Server as ServerIcon,
  Wifi,
  Clock,
  Box,
  FileText,
  Terminal,
  Folder,
  ListTodo,
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function ServerDetailPage() {
  const params = useParams();
  const serverId = params.id as string;

  const [server, setServer] = useState<Server | null>(null);
  const [metrics, setMetrics] = useState<AllMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadServer() {
      try {
        const res = await fetch(`/api/servers/${serverId}`);
        if (!res.ok) throw new Error("Failed to load server");
        const data = await res.json();
        setServer(data);

        // Load initial metrics
        const client = new APIClient(
          `http://${data.tailscaleIp}:${data.port}`,
          data.apiKey
        );
        const metricsData = await client.getMetrics();
        setMetrics(metricsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    }

    loadServer();
  }, [serverId]);

  useEffect(() => {
    if (!server) return;

    const client = new APIClient(
      `http://${server.tailscaleIp}:${server.port}`,
      server.apiKey
    );

    const cleanup = client.streamMetrics(
      (data) => setMetrics(data),
      () => setError("Connection lost")
    );

    return cleanup;
  }, [server]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !server) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-500">{error || "Server not found"}</p>
          <Link href="/">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const navItems = [
    { href: `/servers/${serverId}/processes`, icon: Activity, label: "Processes" },
    { href: `/servers/${serverId}/services`, icon: Box, label: "Services" },
    { href: `/servers/${serverId}/logs`, icon: FileText, label: "Logs" },
    { href: `/servers/${serverId}/docker`, icon: Box, label: "Docker" },
    { href: `/servers/${serverId}/files`, icon: Folder, label: "Files" },
    { href: `/servers/${serverId}/tasks`, icon: ListTodo, label: "Tasks" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <ServerIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                <h1 className="text-lg sm:text-xl font-bold truncate max-w-[150px] sm:max-w-none">{server.name}</h1>
                <Badge variant="success" className="hidden sm:inline-flex">Online</Badge>
              </div>
            </div>
            <ThemeToggle />
          </div>

          <nav className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button variant="outline" size="sm" className="h-8 whitespace-nowrap">
                  <item.icon className="h-3.5 w-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Button>
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Server Info */}
        {metrics && (
          <>
            <div className="mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Terminal className="h-5 w-5" />
                    System Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Hostname</p>
                      <p className="font-medium">{metrics.host.hostname}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">OS</p>
                      <p className="font-medium">{metrics.host.platform} {metrics.host.platform_version}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Kernel</p>
                      <p className="font-medium">{metrics.host.kernel_version}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Architecture</p>
                      <p className="font-medium">{metrics.host.kernel_arch}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Uptime</p>
                      <p className="font-medium flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {metrics.host.uptime_human}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Processes</p>
                      <p className="font-medium">{metrics.host.procs}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">CPU Model</p>
                      <p className="font-medium truncate" title={metrics.cpu.model_name}>
                        {metrics.cpu.model_name || "Unknown"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">CPU Cores</p>
                      <p className="font-medium">{metrics.cpu.cores}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Metrics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
              <MetricsCard
                title="CPU Usage"
                value={metrics.cpu.usage_total}
                icon="cpu"
              />
              <MetricsCard
                title="Memory Usage"
                value={metrics.memory.used_percent}
                icon="memory"
              />
              {metrics.disk.partitions[0] && (
                <MetricsCard
                  title="Disk Usage"
                  value={metrics.disk.partitions[0].used_percent}
                  icon="disk"
                />
              )}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Load Average</CardTitle>
                  <Cpu className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metrics.cpu.load_avg_1.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {metrics.cpu.load_avg_5.toFixed(2)} / {metrics.cpu.load_avg_15.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Info */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Memory Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MemoryStick className="h-5 w-5" />
                    Memory
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total</span>
                    <span>{formatBytes(metrics.memory.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Used</span>
                    <span>{formatBytes(metrics.memory.used)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Available</span>
                    <span>{formatBytes(metrics.memory.available)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cached</span>
                    <span>{formatBytes(metrics.memory.cached)}</span>
                  </div>
                  {metrics.memory.swap_total > 0 && (
                    <>
                      <hr className="my-2" />
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Swap Total</span>
                        <span>{formatBytes(metrics.memory.swap_total)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Swap Used</span>
                        <span>{formatBytes(metrics.memory.swap_used)}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Disk Partitions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <HardDrive className="h-5 w-5" />
                    Disk Partitions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {metrics.disk.partitions.map((partition) => (
                    <div key={partition.mountpoint} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium truncate" title={partition.device}>
                          {partition.mountpoint}
                        </span>
                        <span className="text-muted-foreground">
                          {formatBytes(partition.used)} / {formatBytes(partition.total)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              partition.used_percent >= 90 ? "bg-red-500" :
                              partition.used_percent >= 70 ? "bg-yellow-500" : "bg-green-500"
                            }`}
                            style={{ width: `${partition.used_percent}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-12 text-right">
                          {partition.used_percent.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Network Interfaces */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wifi className="h-5 w-5" />
                  Network Interfaces
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-muted-foreground">
                        <th className="text-left py-2">Interface</th>
                        <th className="text-right py-2">Received</th>
                        <th className="text-right py-2">Sent</th>
                        <th className="text-right py-2">Errors</th>
                        <th className="text-left py-2">Addresses</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.network.interfaces.map((iface) => (
                        <tr key={iface.name} className="border-t">
                          <td className="py-2 font-medium">{iface.name}</td>
                          <td className="text-right">{formatBytes(iface.bytes_recv)}</td>
                          <td className="text-right">{formatBytes(iface.bytes_sent)}</td>
                          <td className="text-right">{iface.errin + iface.errout}</td>
                          <td className="text-left text-xs text-muted-foreground">
                            {iface.addrs?.slice(0, 2).join(", ")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
