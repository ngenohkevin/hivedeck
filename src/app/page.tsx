import { prisma } from "@/lib/db";
import { ServerCard } from "@/components/dashboard/server-card";
import { Button } from "@/components/ui/button";
import { Plus, Server, Settings } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import type { AllMetrics } from "@/types";

export const dynamic = "force-dynamic";

async function fetchServerMetrics(server: { tailscaleIp: string; port: number; apiKey: string }): Promise<AllMetrics | null> {
  try {
    const res = await fetch(`http://${server.tailscaleIp}:${server.port}/api/metrics`, {
      headers: { Authorization: `Bearer ${server.apiKey}` },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const servers = await prisma.server.findMany({
    where: { enabled: true },
    orderBy: { name: "asc" },
  });

  // Fetch metrics for all servers in parallel
  const metricsPromises = servers.map((server) => fetchServerMetrics(server));
  const metricsResults = await Promise.all(metricsPromises);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Server className="h-5 w-5 sm:h-6 sm:w-6" />
            <h1 className="text-lg sm:text-xl font-bold">Hivedeck</h1>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/settings" className="hidden sm:block">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
            </Link>
            <Link href="/settings" className="sm:hidden">
              <Button variant="outline" size="icon" className="h-9 w-9">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/servers/add">
              <Button size="sm" className="h-9">
                <Plus className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Add Server</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Servers</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Monitor and manage your servers
          </p>
        </div>

        {servers.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <Server className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-base sm:text-lg font-medium mb-2">No servers configured</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4">
              Add your first server to start monitoring
            </p>
            <Link href="/servers/add">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Server
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {servers.map((server, index) => (
              <ServerCard
                key={server.id}
                server={server}
                metrics={metricsResults[index] ?? undefined}
                isOnline={metricsResults[index] !== null}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
