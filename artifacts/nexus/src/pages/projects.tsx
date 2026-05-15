import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useListProjects, useCreateProject, useDeleteProject, getListProjectsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, FolderKanban, Trash2, ArrowRight } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  on_hold: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  completed: "bg-primary/15 text-primary border-primary/30",
  archived: "bg-muted text-muted-foreground border-border",
};

const stagger = { animate: { transition: { staggerChildren: 0.07 } } };
const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const { data: projects, isLoading } = useListProjects();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", status: "active" });
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setCreating(true);
    try {
      await createProject.mutateAsync({ data: { title: form.title, description: form.description, status: form.status as "active" } });
      queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
      setShowCreate(false);
      setForm({ title: "", description: "", status: "active" });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this project? All tasks will be removed.")) return;
    await deleteProject.mutateAsync({ projectId: id });
    queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="p-6 lg:p-8">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Projects</h1>
              <p className="mt-1 text-sm text-muted-foreground">Manage your team's active initiatives.</p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_0_16px_rgba(59,130,246,0.3)] transition-all hover:shadow-[0_0_24px_rgba(59,130,246,0.5)]"
            >
              <Plus className="h-4 w-4" />
              New Project
            </button>
          </motion.div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
            </div>
          ) : (projects?.length ?? 0) === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-24 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card">
                <FolderKanban className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold text-foreground">No projects yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">Create your first project to get started.</p>
              <button onClick={() => setShowCreate(true)} className="mt-5 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
                Create project
              </button>
            </motion.div>
          ) : (
            <motion.div variants={stagger} initial="initial" animate="animate" className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {(projects ?? []).map((project) => (
                <motion.div key={project.id} variants={fadeUp}>
                  <Link href={`/projects/${project.id}`}>
                    <a className="group block rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-[0_0_32px_rgba(59,130,246,0.08)]">
                      <div className="mb-4 flex items-start justify-between">
                        <div className="flex-1 min-w-0 mr-3">
                          <h3 className="truncate text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                            {project.title}
                          </h3>
                          {project.description && (
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{project.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_STYLES[project.status ?? "active"]}`}>
                            {(project.status ?? "active").replace("_", " ")}
                          </span>
                          <button
                            onClick={(e) => handleDelete(project.id, e)}
                            className="rounded-md p-1 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-destructive/15 hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mb-4">
                        <div className="mb-1.5 flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-semibold text-primary">{project.progressPercent ?? 0}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-700 shadow-[0_0_6px_rgba(59,130,246,0.6)]"
                            style={{ width: `${project.progressPercent ?? 0}%` }}
                          />
                        </div>
                      </div>

                      {/* Stats row */}
                      <div className="flex items-center justify-between">
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>{project.taskCount ?? 0} tasks</span>
                          <span>{project.memberCount ?? 0} members</span>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 transition-all group-hover:text-primary group-hover:translate-x-0.5" />
                      </div>
                    </a>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Create Modal */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="sm:max-w-md bg-card border-border">
            <DialogHeader>
              <DialogTitle>Create new project</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Project name</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Mobile App Redesign"
                  className="w-full rounded-lg border border-input bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief project description..."
                  rows={3}
                  className="w-full rounded-lg border border-input bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full rounded-lg border border-input bg-secondary px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
                >
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {creating ? "Creating..." : "Create project"}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </AppLayout>
    </ProtectedRoute>
  );
}
