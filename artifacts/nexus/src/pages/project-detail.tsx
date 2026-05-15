import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  useGetProject, useListProjectTasks, useCreateTask, useUpdateTask, useDeleteTask,
  useListProjectMembers, useListUsers, useAddProjectMember,
  getListProjectTasksQueryKey, getListProjectsQueryKey, getGetProjectQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Trash2, MoreHorizontal } from "lucide-react";

const STATUSES = [
  { key: "todo", label: "Todo", color: "text-slate-400", bg: "border-slate-500/30 bg-slate-500/10" },
  { key: "in_progress", label: "In Progress", color: "text-primary", bg: "border-primary/30 bg-primary/10" },
  { key: "review", label: "Review", color: "text-accent", bg: "border-accent/30 bg-accent/10" },
  { key: "completed", label: "Completed", color: "text-chart-3", bg: "border-chart-3/30 bg-chart-3/10" },
];

const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  low: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

function initials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const projectId = parseInt(id ?? "0", 10);
  const queryClient = useQueryClient();

  const { data: project, isLoading: projectLoading } = useGetProject(projectId);
  const { data: tasks, isLoading: tasksLoading } = useListProjectTasks(projectId);
  const { data: members } = useListProjectMembers(projectId);
  const { data: allUsers } = useListUsers();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const addMember = useAddProjectMember();

  const [showCreateTask, setShowCreateTask] = useState<string | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: "", description: "", priority: "medium", dueDate: "", assignedTo: "" });
  const [creating, setCreating] = useState(false);

  const memberUserIds = new Set((members ?? []).map((m) => m.userId));
  const nonMembers = (allUsers ?? []).filter((u) => !memberUserIds.has(u.id));

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;
    setCreating(true);
    try {
      await createTask.mutateAsync({
        projectId,
        data: {
          title: taskForm.title,
          description: taskForm.description || undefined,
          priority: taskForm.priority as "medium",
          status: (showCreateTask ?? "todo") as "todo",
          dueDate: taskForm.dueDate || undefined,
          assignedTo: taskForm.assignedTo ? parseInt(taskForm.assignedTo, 10) : undefined,
        },
      });
      queryClient.invalidateQueries({ queryKey: getListProjectTasksQueryKey(projectId) });
      queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
      queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
      setShowCreateTask(null);
      setTaskForm({ title: "", description: "", priority: "medium", dueDate: "", assignedTo: "" });
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    await updateTask.mutateAsync({ taskId, data: { status: newStatus as "todo" } });
    queryClient.invalidateQueries({ queryKey: getListProjectTasksQueryKey(projectId) });
    queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm("Delete this task?")) return;
    await deleteTask.mutateAsync({ taskId });
    queryClient.invalidateQueries({ queryKey: getListProjectTasksQueryKey(projectId) });
    queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
  };

  const handleAddMember = async (userId: number) => {
    await addMember.mutateAsync({ projectId, data: { userId } });
    queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/members`] });
  };

  if (projectLoading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="p-8">
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-4 w-96 mb-8" />
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="p-6 lg:p-8">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <button
              onClick={() => setLocation("/projects")}
              className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to projects
            </button>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{project?.title}</h1>
                {project?.description && <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>}
                <div className="mt-3 flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {(members ?? []).slice(0, 5).map((m) => (
                      <div
                        key={m.id}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary ring-2 ring-background"
                        title={m.user?.name ?? ""}
                      >
                        {initials(m.user?.name)}
                      </div>
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">{project?.memberCount ?? 0} members · {project?.taskCount ?? 0} tasks · {project?.progressPercent ?? 0}% complete</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddMember(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add member
                </button>
              </div>
            </div>
            {/* Progress */}
            <div className="mt-4">
              <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-700 shadow-[0_0_6px_rgba(59,130,246,0.6)]"
                  style={{ width: `${project?.progressPercent ?? 0}%` }}
                />
              </div>
            </div>
          </motion.div>

          {/* Kanban board */}
          {tasksLoading ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STATUSES.map(({ key, label, color, bg }) => {
                const columnTasks = (tasks ?? []).filter((t) => t.status === key);
                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col rounded-2xl border border-border bg-card/50 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${bg} ${color}`}>
                          {label}
                        </span>
                        <span className="text-xs text-muted-foreground">{columnTasks.length}</span>
                      </div>
                      <button
                        onClick={() => setShowCreateTask(key)}
                        className="rounded-md p-1 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-col gap-2.5 flex-1">
                      {columnTasks.map((task) => (
                        <div
                          key={task.id}
                          className="group rounded-xl border border-border bg-card p-3.5 transition-all hover:border-primary/20 hover:shadow-[0_0_16px_rgba(59,130,246,0.06)]"
                        >
                          <div className="mb-2 flex items-start justify-between gap-2">
                            <p className="text-xs font-medium text-foreground leading-snug flex-1">{task.title}</p>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="rounded p-0.5 text-muted-foreground hover:text-destructive transition-colors"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className={`rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${PRIORITY_COLORS[task.priority]}`}>
                              {task.priority}
                            </span>
                            {task.assignee && (
                              <div
                                className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[8px] font-bold text-primary ring-1 ring-primary/20"
                                title={task.assignee.name}
                              >
                                {initials(task.assignee.name)}
                              </div>
                            )}
                          </div>
                          {/* Status selector */}
                          <div className="mt-2 pt-2 border-t border-border/50">
                            <select
                              value={task.status}
                              onChange={(e) => handleStatusChange(task.id, e.target.value)}
                              className="w-full rounded bg-secondary/50 px-1.5 py-1 text-[10px] text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30"
                            >
                              {STATUSES.map((s) => (
                                <option key={s.key} value={s.key}>{s.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                      {columnTasks.length === 0 && (
                        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-6 text-center">
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground/30" />
                          <p className="mt-1 text-[10px] text-muted-foreground/50">No tasks</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Create Task Modal */}
        <Dialog open={!!showCreateTask} onOpenChange={() => setShowCreateTask(null)}>
          <DialogContent className="sm:max-w-md bg-card border-border">
            <DialogHeader>
              <DialogTitle>Add task to {showCreateTask ? STATUSES.find(s => s.key === showCreateTask)?.label : ""}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTask} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Title</label>
                <input
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="Task title..."
                  className="w-full rounded-lg border border-input bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Description</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="Optional description..."
                  rows={2}
                  className="w-full rounded-lg border border-input bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full rounded-lg border border-input bg-secondary px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Assign to</label>
                  <select
                    value={taskForm.assignedTo}
                    onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                    className="w-full rounded-lg border border-input bg-secondary px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Unassigned</option>
                    {(members ?? []).map((m) => (
                      <option key={m.userId} value={m.userId}>{m.user?.name ?? `User ${m.userId}`}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Due date</label>
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  className="w-full rounded-lg border border-input bg-secondary px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateTask(null)} className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={creating} className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                  {creating ? "Adding..." : "Add task"}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add member modal */}
        <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
          <DialogContent className="sm:max-w-sm bg-card border-border">
            <DialogHeader>
              <DialogTitle>Add team member</DialogTitle>
            </DialogHeader>
            <div className="pt-2">
              {nonMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">All users are already members of this project.</p>
              ) : (
                <div className="space-y-2">
                  {nonMembers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleAddMember(user.id)}
                      className="w-full flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-3 text-left hover:border-primary/30 hover:bg-primary/5 transition-all"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary ring-1 ring-primary/20">
                        {initials(user.name)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                      </div>
                      <Plus className="ml-auto h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </AppLayout>
    </ProtectedRoute>
  );
}
