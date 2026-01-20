"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Container, RefreshCw, Play, Square, RotateCcw } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface DockerContainer {
  id: string;
  name: string;
  image: string;
  state: string;
  status: string;
  created: string;
}

export default function DockerPage() {
  const params = useParams();
  const serverId = params.id as string;

  const [containers, setContainers] = useState<DockerContainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [dockerEnabled, setDockerEnabled] = useState(true);

  const loadContainers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/servers/${serverId}/proxy/api/docker/containers?all=true`);
      if (!res.ok) {
        const data = await res.json();
        if (data.error?.includes("disabled") || data.error?.includes("not available")) {
          setDockerEnabled(false);
          return;
        }
        throw new Error(data.error || "Failed to load containers");
      }
      const data = await res.json();
      setContainers(data.containers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleContainerAction = async (id: string, action: "start" | "stop" | "restart") => {
    try {
      setActionLoading(`${id}-${action}`);
      const res = await fetch(`/api/servers/${serverId}/proxy/api/docker/containers/${id}/${action}`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed to ${action} container`);
      }
      await loadContainers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    loadContainers();
  }, [serverId]);

  const getStateBadge = (state: string) => {
    if (state === "running") {
      return <Badge variant="success">Running</Badge>;
    } else if (state === "exited") {
      return <Badge variant="secondary">Exited</Badge>;
    } else if (state === "paused") {
      return <Badge variant="outline">Paused</Badge>;
    }
    return <Badge variant="outline">{state}</Badge>;
  };

  if (!dockerEnabled) {
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
                <Container className="h-5 w-5" />
                <h1 className="text-lg sm:text-xl font-bold">Docker</h1>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </header>
        <main className="container mx-auto px-4 py-12 text-center">
          <Container className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-medium mb-2">Docker Not Enabled</h2>
          <p className="text-muted-foreground">
            Docker management is disabled on this server&apos;s agent.
          </p>
        </main>
      </div>
    );
  }

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
              <Container className="h-5 w-5" />
              <h1 className="text-lg sm:text-xl font-bold">Docker</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={loadContainers} disabled={loading}>
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
            <Button variant="outline" onClick={loadContainers} className="mt-4">
              Retry
            </Button>
          </div>
        ) : loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : containers.length === 0 ? (
          <div className="text-center py-12">
            <Container className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No containers found</p>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {containers.length} Containers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {containers.map((container) => (
                <div
                  key={container.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{container.name}</span>
                      {getStateBadge(container.state)}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {container.image}
                    </p>
                    <p className="text-xs text-muted-foreground">{container.status}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleContainerAction(container.id, "start")}
                      disabled={actionLoading !== null || container.state === "running"}
                      title="Start"
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleContainerAction(container.id, "stop")}
                      disabled={actionLoading !== null || container.state !== "running"}
                      title="Stop"
                    >
                      <Square className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleContainerAction(container.id, "restart")}
                      disabled={actionLoading !== null}
                      title="Restart"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
