"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Server, Loader2, Trash2, Eye, EyeOff } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function EditServerPage() {
  const params = useParams();
  const serverId = params.id as string;
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    hostname: "",
    tailscaleIp: "",
    port: "8091",
    apiKey: "",
    enabled: true,
  });

  useEffect(() => {
    async function loadServer() {
      try {
        const res = await fetch(`/api/servers/${serverId}`);
        if (!res.ok) throw new Error("Failed to load server");
        const data = await res.json();
        setFormData({
          name: data.name || "",
          hostname: data.hostname || "",
          tailscaleIp: data.tailscaleIp || "",
          port: String(data.port) || "8091",
          apiKey: data.apiKey || "",
          enabled: data.enabled ?? true,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load server");
      } finally {
        setPageLoading(false);
      }
    }
    loadServer();
  }, [serverId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/servers/${serverId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          port: parseInt(formData.port) || 8091,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update server");
      }

      router.push(`/servers/${serverId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/servers/${serverId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete server");
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
              <Server className="h-5 w-5 sm:h-6 sm:w-6" />
              <h1 className="text-lg sm:text-xl font-bold">Edit Server</h1>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Server Configuration</CardTitle>
            <CardDescription>
              Update the connection details for this server.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Server Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Raspberry Pi"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hostname">Hostname</Label>
                <Input
                  id="hostname"
                  placeholder="e.g., pi, raspberrypi"
                  value={formData.hostname}
                  onChange={(e) => setFormData({ ...formData, hostname: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Optional. Tailscale hostname or machine name
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="tailscaleIp">Tailscale IP / Address *</Label>
                  <Input
                    id="tailscaleIp"
                    placeholder="e.g., 100.85.91.122 or pi"
                    value={formData.tailscaleIp}
                    onChange={(e) => setFormData({ ...formData, tailscaleIp: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="port">Port</Label>
                  <Input
                    id="port"
                    type="number"
                    placeholder="8091"
                    value={formData.port}
                    onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground -mt-4">
                The Tailscale IP or hostname where hivedeck-agent is running
              </p>

              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key *</Label>
                <div className="relative">
                  <Input
                    id="apiKey"
                    type={showApiKey ? "text" : "password"}
                    placeholder="Enter the agent API key"
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  The API key configured in the hivedeck-agent .env file
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="enabled" className="cursor-pointer">
                    Server Enabled
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Disabled servers won&apos;t appear on the dashboard
                  </p>
                </div>
                <Switch
                  id="enabled"
                  checked={formData.enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="destructive"
                      className="sm:mr-auto"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Server
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Server</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete &quot;{formData.name}&quot;? This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowDeleteDialog(false)}
                        disabled={deleting}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={deleting}
                      >
                        {deleting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          "Delete"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <div className="flex gap-3 sm:ml-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/servers/${serverId}`)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
