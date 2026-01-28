"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Box, RefreshCw, Play, Square, RotateCcw, Search } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface Service {
  name: string;
  description: string;
  load_state: string;
  active_state: string;
  sub_state: string;
}

export default function ServicesPage() {
  const params = useParams();
  const serverId = params.id as string;

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const loadServices = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/servers/${serverId}/proxy/api/services`);
      if (!res.ok) throw new Error("Failed to load services");
      const data = await res.json();
      setServices(data.services || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleServiceAction = async (name: string, action: "start" | "stop" | "restart") => {
    try {
      setActionLoading(`${name}-${action}`);
      const res = await fetch(`/api/servers/${serverId}/proxy/api/services/${name}/${action}`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed to ${action} service`);
      }
      await loadServices();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    loadServices();
  }, [serverId]);

  const getStatusBadge = (service: Service) => {
    if (service.active_state === "active") {
      return <Badge variant="success">Active</Badge>;
    } else if (service.active_state === "inactive") {
      return <Badge variant="secondary">Inactive</Badge>;
    } else if (service.active_state === "failed") {
      return <Badge variant="destructive">Failed</Badge>;
    }
    return <Badge variant="outline">{service.active_state}</Badge>;
  };

  // Sort: active first, then failed, then inactive, then others
  // Filter by search term
  const filteredServices = useMemo(() => {
    const stateOrder: Record<string, number> = {
      active: 0,
      failed: 1,
      activating: 2,
      deactivating: 3,
      inactive: 4,
    };

    return services
      .filter((s) => {
        if (!search) return true;
        const searchLower = search.toLowerCase();
        return (
          s.name.toLowerCase().includes(searchLower) ||
          s.description.toLowerCase().includes(searchLower)
        );
      })
      .sort((a, b) => {
        const orderA = stateOrder[a.active_state] ?? 5;
        const orderB = stateOrder[b.active_state] ?? 5;
        if (orderA !== orderB) return orderA - orderB;
        return a.name.localeCompare(b.name);
      });
  }, [services, search]);

  const activeCount = services.filter((s) => s.active_state === "active").length;

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
              <Box className="h-5 w-5" />
              <h1 className="text-lg sm:text-xl font-bold">Services</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={loadServices} disabled={loading}>
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
            <Button variant="outline" onClick={loadServices} className="mt-4">
              Retry
            </Button>
          </div>
        ) : loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-lg">
                  {activeCount} Active / {services.length} Total Services
                </CardTitle>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search services..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {filteredServices.length === 0 && search && (
                <p className="text-center text-muted-foreground py-8">
                  No services match &quot;{search}&quot;
                </p>
              )}
              {filteredServices.map((service) => (
                <div
                  key={service.name}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{service.name}</span>
                      {getStatusBadge(service)}
                      <span className="text-xs text-muted-foreground">
                        ({service.sub_state})
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {service.description}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleServiceAction(service.name, "start")}
                      disabled={actionLoading !== null || service.active_state === "active"}
                      title="Start"
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleServiceAction(service.name, "stop")}
                      disabled={actionLoading !== null || service.active_state !== "active"}
                      title="Stop"
                    >
                      <Square className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleServiceAction(service.name, "restart")}
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
