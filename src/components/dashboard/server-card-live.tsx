"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatPercent } from "@/lib/utils";
import { Monitor, Clock, Cpu, MemoryStick, HardDrive, Thermometer, Loader2 } from "lucide-react";
import type { Server as ServerType, AllMetrics } from "@/types";

interface ServerCardLiveProps {
  server: ServerType;
}

export function ServerCardLive({ server }: ServerCardLiveProps) {
  const [metrics, setMetrics] = useState<AllMetrics | null>(null);
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connect = async () => {
      // First fetch initial metrics
      try {
        const res = await fetch(`/api/servers/${server.id}/proxy/api/metrics`);
        if (res.ok) {
          const data = await res.json();
          setMetrics(data);
          setIsOnline(true);
        } else {
          setIsOnline(false);
          return;
        }
      } catch {
        setIsOnline(false);
        return;
      }

      // Then connect to SSE for real-time updates
      eventSource = new EventSource(`/api/servers/${server.id}/proxy/api/events`);

      eventSource.addEventListener("metrics", (event) => {
        try {
          const data = JSON.parse(event.data);
          setMetrics(data);
          setIsOnline(true);
        } catch (e) {
          console.error("Failed to parse metrics:", e);
        }
      });

      eventSource.onerror = () => {
        setIsOnline(false);
        eventSource?.close();
        // Retry connection after 5 seconds
        reconnectTimeout = setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      eventSource?.close();
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [server.id]);

  return (
    <Link href={`/servers/${server.id}`}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            {server.name}
          </CardTitle>
          {isOnline === null ? (
            <Badge variant="outline">
              <Loader2 className="h-3 w-3 animate-spin" />
            </Badge>
          ) : (
            <Badge variant={isOnline ? "success" : "destructive"}>
              {isOnline ? "Online" : "Offline"}
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-4">
            <p>{server.hostname}</p>
            <p className="text-xs">{server.tailscaleIp}:{server.port}</p>
          </div>

          {metrics ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span>CPU</span>
                    <span>{formatPercent(metrics.cpu.usage_total ?? 0)}</span>
                  </div>
                  <Progress value={metrics.cpu.usage_total ?? 0} className="h-1" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <MemoryStick className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Memory</span>
                    <span>{formatPercent(metrics.memory.used_percent ?? 0)}</span>
                  </div>
                  <Progress value={metrics.memory.used_percent ?? 0} className="h-1" />
                </div>
              </div>

              {metrics.disk.partitions[0] && (
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Disk</span>
                      <span>{formatPercent(metrics.disk.partitions[0].used_percent ?? 0)}</span>
                    </div>
                    <Progress value={metrics.disk.partitions[0].used_percent ?? 0} className="h-1" />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                <Clock className="h-3 w-3" />
                <span>Uptime: {metrics.host.uptime_human}</span>
                {metrics.host.temperatures && metrics.host.temperatures[0] && (
                  <>
                    <span className="mx-1">•</span>
                    <Thermometer className="h-3 w-3" />
                    <span className={
                      metrics.host.temperatures[0].temperature >= 80 ? "text-red-500" :
                      metrics.host.temperatures[0].temperature >= 60 ? "text-yellow-500" : ""
                    }>
                      {metrics.host.temperatures[0].temperature.toFixed(0)}°C
                    </span>
                  </>
                )}
              </div>
            </div>
          ) : isOnline === false ? (
            <div className="text-sm text-muted-foreground">
              Unable to connect to agent
            </div>
          ) : (
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-4 bg-muted rounded animate-pulse" />
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
