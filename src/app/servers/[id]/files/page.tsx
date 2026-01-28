"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Folder, File, RefreshCw, ChevronRight, Home } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBytes } from "@/lib/utils";

interface FileEntry {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
  mod_time: string;
  permissions: string;
}

export default function FilesPage() {
  const params = useParams();
  const serverId = params.id as string;

  const [files, setFiles] = useState<FileEntry[]>([]);
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [allowedPaths, setAllowedPaths] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAllowedPaths = async () => {
    try {
      const res = await fetch(`/api/servers/${serverId}/proxy/api/files/paths`);
      if (res.ok) {
        const data = await res.json();
        setAllowedPaths(data.paths || []);
        return data.paths || [];
      }
    } catch {
      // Fallback to default
    }
    return ["/"];
  };

  const loadFiles = async (path: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/servers/${serverId}/proxy/api/files?path=${encodeURIComponent(path)}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load files");
      }
      const data = await res.json();
      setFiles(data.files || []);
      setCurrentPath(data.path || path);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const paths = await loadAllowedPaths();
      // If only one allowed path or allowAll (*), go directly to it
      if (paths.length === 1) {
        loadFiles(paths[0]);
      } else {
        // Show allowed paths selection
        setLoading(false);
      }
    };
    init();
  }, [serverId]);

  // Show allowed paths selection when we have multiple paths and no currentPath
  const showPathSelection = allowedPaths.length > 1 && currentPath === null;

  const navigateToDir = (path: string) => {
    loadFiles(path);
  };

  const navigateUp = () => {
    if (!currentPath) return;
    const parentPath = currentPath.split("/").slice(0, -1).join("/") || "/";

    // Check if parent is still within allowed paths
    const isParentAllowed = allowedPaths.some(ap =>
      ap === "/" || parentPath.startsWith(ap) || ap.startsWith(parentPath)
    );

    if (isParentAllowed || allowedPaths.includes("/")) {
      loadFiles(parentPath);
    } else if (allowedPaths.length > 1) {
      // Go back to path selection
      setCurrentPath(null);
      setFiles([]);
    }
  };

  const goToPathSelection = () => {
    if (allowedPaths.length > 1) {
      setCurrentPath(null);
      setFiles([]);
    }
  };

  const pathParts = currentPath?.split("/").filter(Boolean) || [];

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
              <Folder className="h-5 w-5" />
              <h1 className="text-lg sm:text-xl font-bold">Files</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => currentPath && loadFiles(currentPath)}
              disabled={loading || !currentPath}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Path Selection View */}
        {showPathSelection ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Select a location to browse
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {allowedPaths.map((path) => (
                  <div
                    key={path}
                    className="flex items-center gap-3 p-3 rounded hover:bg-muted/50 cursor-pointer"
                    onClick={() => loadFiles(path)}
                  >
                    <Folder className="h-5 w-5 text-blue-500" />
                    <span className="font-mono">{path}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Breadcrumb */}
            <div className="flex items-center gap-1 text-sm mb-4 overflow-x-auto">
              {allowedPaths.length > 1 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={goToPathSelection}
                >
                  <Home className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => loadFiles("/")}
                >
                  /
                </Button>
              )}
              {pathParts.map((part, i) => (
                <div key={i} className="flex items-center">
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => loadFiles("/" + pathParts.slice(0, i + 1).join("/"))}
                  >
                    {part}
                  </Button>
                </div>
              ))}
            </div>

            {error ? (
              <div className="text-center py-12">
                <p className="text-red-500">{error}</p>
                <Button variant="outline" onClick={() => currentPath && loadFiles(currentPath)} className="mt-4">
                  Retry
                </Button>
              </div>
            ) : loading ? (
              <div className="space-y-1">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="font-mono text-sm">
                    {currentPath}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentPath && currentPath !== "/" && !(allowedPaths.length > 1 && allowedPaths.includes(currentPath)) && (
                    <div
                      className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer"
                      onClick={navigateUp}
                    >
                      <Folder className="h-4 w-4 text-blue-500" />
                      <span>..</span>
                    </div>
                  )}
                  {files.map((file) => (
                    <div
                      key={file.path}
                      className={`flex items-center gap-3 p-2 rounded hover:bg-muted/50 ${
                        file.is_dir ? "cursor-pointer" : ""
                      }`}
                      onClick={() => file.is_dir && navigateToDir(file.path)}
                    >
                      {file.is_dir ? (
                        <Folder className="h-4 w-4 text-blue-500 shrink-0" />
                      ) : (
                        <File className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <span className="flex-1 truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground hidden sm:block">
                        {file.permissions}
                      </span>
                      <span className="text-xs text-muted-foreground w-20 text-right">
                        {file.is_dir ? "-" : formatBytes(file.size)}
                      </span>
                    </div>
                  ))}
                  {files.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Empty directory
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
}
