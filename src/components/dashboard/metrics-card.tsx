"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn, formatBytes, formatPercent } from "@/lib/utils";
import { Cpu, HardDrive, MemoryStick, Wifi } from "lucide-react";

interface MetricsCardProps {
  title: string;
  value: number;
  total?: number;
  unit?: string;
  icon: "cpu" | "memory" | "disk" | "network";
  className?: string;
}

const icons = {
  cpu: Cpu,
  memory: MemoryStick,
  disk: HardDrive,
  network: Wifi,
};

function getProgressColor(value: number): string {
  if (value >= 90) return "bg-red-500";
  if (value >= 70) return "bg-yellow-500";
  return "bg-green-500";
}

export function MetricsCard({
  title,
  value,
  total,
  unit = "%",
  icon,
  className,
}: MetricsCardProps) {
  const Icon = icons[icon];
  const displayValue = unit === "%" ? formatPercent(value) :
    total ? `${formatBytes(value)} / ${formatBytes(total)}` : formatBytes(value);

  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{displayValue}</div>
        <Progress
          value={value}
          className="mt-2"
          indicatorClassName={getProgressColor(value)}
        />
      </CardContent>
    </Card>
  );
}
