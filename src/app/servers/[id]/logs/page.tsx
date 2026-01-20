"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, RefreshCw } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";

interface LogEntry {
  timestamp: string;
  message: string;
  priority: number;
  unit: string;
}

export default function LogsPage() {
  const params = useParams();
  const serverId = params.id as string;

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unit, setUnit] = useState("");
  const logsEndRef = useRef<HTMLDivElement>(null);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const query = unit ? `?unit=${unit}&lines=200` : "?lines=200";
      const res = await fetch(`/api/servers/${serverId}/proxy/api/logs/query${query}`);
      if (!res.ok) throw new Error("Failed to load logs");
      const data = await res.json();
      setLogs(data.entries || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [serverId]);

  const getPriorityColor = (priority: number) => {
    if (priority <= 3) return "text-red-500"; // error, crit, alert, emerg
    if (priority <= 4) return "text-yellow-500"; // warning
    if (priority <= 6) return "text-blue-500"; // notice, info
    return "text-muted-foreground"; // debug
  };

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
              <FileText className="h-5 w-5" />
              <h1 className="text-lg sm:text-xl font-bold">Logs</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={loadLogs} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Filter by unit (e.g., ssh, nginx)"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="max-w-xs"
          />
          <Button onClick={loadLogs} disabled={loading}>
            Filter
          </Button>
        </div>

        {error ? (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
            <Button variant="outline" onClick={loadLogs} className="mt-4">
              Retry
            </Button>
          </div>
        ) : loading ? (
          <div className="space-y-1">
            {[...Array(20)].map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {logs.length} Log Entries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-mono text-xs space-y-1 max-h-[70vh] overflow-auto">
                {logs.map((log, i) => (
                  <div key={i} className="flex gap-2 hover:bg-muted/50 px-2 py-0.5 rounded">
                    <span className="text-muted-foreground shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="text-blue-500 shrink-0">[{log.unit}]</span>
                    <span className={getPriorityColor(log.priority)}>{log.message}</span>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
