import { useState } from "react";
import { motion } from "framer-motion";
import { useListAllTasks, useUpdateTask, useDeleteTask, getListAllTasksQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckSquare, Trash2, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-red-500/15 text-red-400 border-red-500/30",
  high: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  low: "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

const STATUS_COLORS: Record<string, string> = {
  todo: "bg-slate-500/15 text-slate-400",
  in_progress: "bg-primary/15 text-primary",
  review: "bg-accent/15 text-accent",
  completed: "bg-chart-3/15 text-chart-3",
};

function initials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function TasksPage() {
  const queryClient = useQueryClient();
  const { data: tasks, isLoading } = useListAllTasks();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const filtered = (tasks ?? []).filter((t) => {
    const matchSearch = search === "" || t.title.toLowerCase().includes(search.toLowerCase()) || (t.projectTitle ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    const matchPriority = priorityFilter === "all" || t.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    await updateTask.mutateAsync({ taskId, data: { status: newStatus as "todo" } });
    queryClient.invalidateQueries({ queryKey: getListAllTasksQueryKey() });
  };

  const handleDelete = async (taskId: number) => {
    if (!confirm("Delete this task?")) return;
    await deleteTask.mutateAsync({ taskId });
    queryClient.invalidateQueries({ queryKey: getListAllTasksQueryKey() });
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="p-6 lg:p-8">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">All Tasks</h1>
            <p className="mt-1 text-sm text-muted-foreground">A unified view of every task across all projects.</p>
          </motion.div>

          {/* Filters */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks..."
                className="w-full rounded-lg border border-input bg-card pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary/60"
            >
              <option value="all">All statuses</option>
              <option value="todo">Todo</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="completed">Completed</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary/60"
            >
              <option value="all">All priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </motion.div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-24 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card">
                <CheckSquare className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold text-foreground">No tasks found</h3>
              <p className="mt-1 text-sm text-muted-foreground">Try adjusting your filters.</p>
            </motion.div>
          ) : (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/30">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Task</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Project</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Priority</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assignee</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Due</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((task, i) => (
                      <motion.tr
                        key={task.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className="group hover:bg-secondary/20 transition-colors"
                      >
                        <td className="px-4 py-3.5 font-medium text-foreground max-w-xs">
                          <span className="truncate block">{task.title}</span>
                          {task.description && (
                            <span className="text-xs text-muted-foreground truncate block">{task.description}</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">{task.projectTitle ?? "—"}</td>
                        <td className="px-4 py-3.5">
                          <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase ${PRIORITY_COLORS[task.priority]}`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task.id, e.target.value)}
                            className={`rounded-lg px-2 py-1 text-xs font-medium outline-none cursor-pointer ${STATUS_COLORS[task.status]} bg-transparent border border-current/20`}
                          >
                            <option value="todo">Todo</option>
                            <option value="in_progress">In Progress</option>
                            <option value="review">Review</option>
                            <option value="completed">Completed</option>
                          </select>
                        </td>
                        <td className="px-4 py-3.5">
                          {task.assignee ? (
                            <div className="flex items-center gap-2">
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-[9px] font-bold text-primary ring-1 ring-primary/20">
                                {initials(task.assignee.name)}
                              </div>
                              <span className="text-xs text-muted-foreground">{task.assignee.name}</span>
                            </div>
                          ) : <span className="text-xs text-muted-foreground/50">Unassigned</span>}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                          {task.dueDate ? formatDistanceToNow(new Date(task.dueDate), { addSuffix: true }) : "—"}
                        </td>
                        <td className="px-4 py-3.5">
                          <button
                            onClick={() => handleDelete(task.id)}
                            className="opacity-0 group-hover:opacity-100 rounded p-1 text-muted-foreground hover:text-destructive transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
