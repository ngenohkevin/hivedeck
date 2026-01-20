"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatBytes, formatPercent } from "@/lib/utils";
import { Server, Monitor, Clock, Cpu, MemoryStick, HardDrive } from "lucide-react";
import type { Server as ServerType, AllMetrics } from "@/types";

interface ServerCardProps {
  server: ServerType;
  metrics?: AllMetrics;
  isOnline?: boolean;
}

export function ServerCard({ server, metrics, isOnline = false }: ServerCardProps) {
  return (
    <Link href={`/servers/${server.id}`}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            {server.name}
          </CardTitle>
          <Badge variant={isOnline ? "success" : "destructive"}>
            {isOnline ? "Online" : "Offline"}
          </Badge>
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
                    <span>{formatPercent(metrics.cpu.usage_total)}</span>
                  </div>
                  <Progress value={metrics.cpu.usage_total} className="h-1" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <MemoryStick className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Memory</span>
                    <span>{formatPercent(metrics.memory.used_percent)}</span>
                  </div>
                  <Progress value={metrics.memory.used_percent} className="h-1" />
                </div>
              </div>

              {metrics.disk.partitions[0] && (
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Disk</span>
                      <span>{formatPercent(metrics.disk.partitions[0].used_percent)}</span>
                    </div>
                    <Progress value={metrics.disk.partitions[0].used_percent} className="h-1" />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                <Clock className="h-3 w-3" />
                <span>Uptime: {metrics.host.uptime_human}</span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              No metrics available
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
