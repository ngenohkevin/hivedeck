"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Activity, RefreshCw } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBytes } from "@/lib/utils";

interface Process {
  pid: number;
  name: string;
  username: string;
  cpu_percent: number;
  memory_percent: number;
  memory_rss: number;
  status: string;
  cmdline: string;
}

export default function ProcessesPage() {
  const params = useParams();
  const serverId = params.id as string;

  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProcesses = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/servers/${serverId}/proxy/api/processes?limit=100`);
      if (!res.ok) throw new Error("Failed to load processes");
      const data = await res.json();
      setProcesses(data.processes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProcesses();
  }, [serverId]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href={`/servers/${serverId}`}>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              <h1 className="text-lg sm:text-xl font-bold">Processes</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={loadProcesses} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {error ? (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
            <Button variant="outline" onClick={loadProcesses} className="mt-4">
              Retry
            </Button>
          </div>
        ) : loading ? (
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {processes.length} Running Processes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground border-b">
                      <th className="text-left py-2 px-2">PID</th>
                      <th className="text-left py-2 px-2">Name</th>
                      <th className="text-left py-2 px-2 hidden sm:table-cell">User</th>
                      <th className="text-right py-2 px-2">CPU</th>
                      <th className="text-right py-2 px-2">Memory</th>
                      <th className="text-left py-2 px-2 hidden md:table-cell">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processes.map((proc) => (
                      <tr key={proc.pid} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-2 font-mono text-xs">{proc.pid}</td>
                        <td className="py-2 px-2 font-medium truncate max-w-[150px]" title={proc.name}>
                          {proc.name}
                        </td>
                        <td className="py-2 px-2 hidden sm:table-cell text-muted-foreground">
                          {proc.username}
                        </td>
                        <td className="py-2 px-2 text-right">
                          <span className={proc.cpu_percent > 50 ? "text-red-500" : ""}>
                            {proc.cpu_percent.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-2 px-2 text-right">
                          {proc.memory_percent.toFixed(1)}%
                          <span className="text-muted-foreground text-xs ml-1 hidden sm:inline">
                            ({formatBytes(proc.memory_rss)})
                          </span>
                        </td>
                        <td className="py-2 px-2 hidden md:table-cell">
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            proc.status === "running" ? "bg-green-500/20 text-green-500" :
                            proc.status === "sleeping" ? "bg-blue-500/20 text-blue-500" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {proc.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
