"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ListTodo, RefreshCw, Play, AlertTriangle } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Task {
  name: string;
  description: string;
  command: string;
  dangerous: boolean;
}

interface TaskResult {
  task: string;
  success: boolean;
  output: string;
  error?: string;
  executed_at: string;
}

export default function TasksPage() {
  const params = useParams();
  const serverId = params.id as string;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runningTask, setRunningTask] = useState<string | null>(null);
  const [confirmTask, setConfirmTask] = useState<Task | null>(null);
  const [taskResult, setTaskResult] = useState<TaskResult | null>(null);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/servers/${serverId}/proxy/api/tasks`);
      if (!res.ok) throw new Error("Failed to load tasks");
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const runTask = async (task: Task, confirm = false) => {
    if (task.dangerous && !confirm) {
      setConfirmTask(task);
      return;
    }

    try {
      setRunningTask(task.name);
      setConfirmTask(null);
      const query = confirm ? "?confirm=true" : "";
      const res = await fetch(`/api/servers/${serverId}/proxy/api/tasks/${task.name}/run${query}`, {
        method: "POST",
      });
      const data = await res.json();
      setTaskResult(data);
    } catch (err) {
      setTaskResult({
        task: task.name,
        success: false,
        output: "",
        error: err instanceof Error ? err.message : "Unknown error",
        executed_at: new Date().toISOString(),
      });
    } finally {
      setRunningTask(null);
    }
  };

  useEffect(() => {
    loadTasks();
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
              <ListTodo className="h-5 w-5" />
              <h1 className="text-lg sm:text-xl font-bold">Tasks</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={loadTasks} disabled={loading}>
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
            <Button variant="outline" onClick={loadTasks} className="mt-4">
              Retry
            </Button>
          </div>
        ) : loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12">
            <ListTodo className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No tasks configured</p>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {tasks.length} Available Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.name}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border gap-2"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{task.name}</span>
                      {task.dangerous && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Dangerous
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {task.description}
                    </p>
                    <p className="text-xs font-mono text-muted-foreground mt-1">
                      {task.command}
                    </p>
                  </div>
                  <Button
                    variant={task.dangerous ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => runTask(task)}
                    disabled={runningTask !== null}
                  >
                    {runningTask === task.name ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Run
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Task Result */}
        {taskResult && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                Task Result: {taskResult.task}
                {taskResult.success ? (
                  <Badge variant="success">Success</Badge>
                ) : (
                  <Badge variant="destructive">Failed</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-3 rounded text-xs overflow-x-auto max-h-64 overflow-y-auto">
                {taskResult.output || taskResult.error || "No output"}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Confirm Dialog */}
        <Dialog open={!!confirmTask} onOpenChange={() => setConfirmTask(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Confirm Dangerous Task
              </DialogTitle>
              <DialogDescription>
                You are about to run <strong>{confirmTask?.name}</strong>. This task is marked as dangerous and may have significant effects on your system.
              </DialogDescription>
            </DialogHeader>
            <div className="bg-muted p-3 rounded text-sm font-mono">
              {confirmTask?.command}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmTask(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => confirmTask && runTask(confirmTask, true)}
              >
                Run Anyway
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
