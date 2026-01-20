import { prisma } from "@/lib/db";
import { ServerCard } from "@/components/dashboard/server-card";
import { Button } from "@/components/ui/button";
import { Plus, Server } from "lucide-react";
import Link from "next/link";

export default async function HomePage() {
  const servers = await prisma.server.findMany({
    where: { enabled: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="h-6 w-6" />
            <h1 className="text-xl font-bold">Hivedeck</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/settings">
              <Button variant="outline" size="sm">Settings</Button>
            </Link>
            <Link href="/servers/add">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Server
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Servers</h2>
          <p className="text-muted-foreground">
            Monitor and manage your servers
          </p>
        </div>

        {servers.length === 0 ? (
          <div className="text-center py-12">
            <Server className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No servers configured</h3>
            <p className="text-muted-foreground mb-4">
              Add your first server to start monitoring
            </p>
            <Link href="/servers/add">
              <Button>
                <Plus className="h-4 w-4 mr-1" />
                Add Server
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {servers.map((server) => (
              <ServerCard
                key={server.id}
                server={server}
                isOnline={true}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
