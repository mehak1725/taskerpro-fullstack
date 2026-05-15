import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  useGetDashboardStats, useGetDashboardActivity, useGetTaskBreakdown,
  useGetVelocityData, useGetUpcomingDeadlines
} from "@workspace/api-client-react";
import { AppLayout } from "@/components/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Clock, AlertTriangle, Layers, TrendingUp, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const stagger = { animate: { transition: { staggerChildren: 0.07 } } };
const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

function StatCard({ icon: Icon, label, value, color, loading }: {
  icon: React.ElementType; label: string; value: string | number; color: string; loading?: boolean;
}) {
  return (
    <motion.div variants={fadeUp} className={`rounded-2xl border border-border bg-card p-5 hover:shadow-[0_0_24px_rgba(59,130,246,0.07)] transition-all`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          {loading ? <Skeleton className="mt-2 h-8 w-16" /> : (
            <p className={`mt-2 text-3xl font-extrabold ${color}`}>{value}</p>
          )}
        </div>
        <div className={`rounded-xl p-2.5 ${color.replace("text-", "bg-").replace(/\d+$/, "900/20")}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
      </div>
    </motion.div>
  );
}

function getPriorityColor(priority: string) {
  const map: Record<string, string> = {
    critical: "bg-red-500/20 text-red-400 border-red-500/30",
    high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    low: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  };
  return map[priority] ?? map.medium;
}

const CustomTooltipStyle = {
  contentStyle: {
    background: "hsl(222 47% 7%)",
    border: "1px solid hsl(222 30% 15%)",
    borderRadius: "8px",
    fontSize: "12px",
    color: "hsl(210 20% 95%)",
  },
};

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: activity, isLoading: activityLoading } = useGetDashboardActivity();
  const { data: breakdown, isLoading: breakdownLoading } = useGetTaskBreakdown();
  const { data: velocity, isLoading: velocityLoading } = useGetVelocityData();
  const { data: upcoming } = useGetUpcomingDeadlines();

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="p-6 lg:p-8">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Mission Control</h1>
            <p className="mt-1 text-sm text-muted-foreground">Real-time overview of your team's operational status.</p>
          </motion.div>

          {/* Stats grid */}
          <motion.div variants={stagger} initial="initial" animate="animate" className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard icon={Layers} label="Total Tasks" value={stats?.totalTasks ?? 0} color="text-primary" loading={statsLoading} />
            <StatCard icon={CheckCircle2} label="Completed" value={stats?.completedTasks ?? 0} color="text-chart-3" loading={statsLoading} />
            <StatCard icon={Clock} label="Pending" value={stats?.pendingTasks ?? 0} color="text-yellow-400" loading={statsLoading} />
            <StatCard icon={AlertTriangle} label="Overdue" value={stats?.overdueTasks ?? 0} color="text-destructive" loading={statsLoading} />
            <StatCard icon={TrendingUp} label="Completion" value={statsLoading ? 0 : `${stats?.completionRate ?? 0}%`} color="text-accent" loading={statsLoading} />
            <StatCard icon={Users} label="Members" value={stats?.totalMembers ?? 0} color="text-chart-4" loading={statsLoading} />
          </motion.div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            {/* Velocity chart */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="col-span-1 rounded-2xl border border-border bg-card p-5 lg:col-span-3"
            >
              <h2 className="mb-1 text-sm font-semibold text-foreground">Sprint Velocity</h2>
              <p className="mb-5 text-xs text-muted-foreground">Tasks created vs completed over the last 6 weeks</p>
              {velocityLoading ? (
                <Skeleton className="h-52 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={velocity ?? []} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(217 91% 60%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(217 91% 60%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(260 80% 65%)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="hsl(260 80% 65%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 12%)" />
                    <XAxis dataKey="week" tick={{ fill: "hsl(210 20% 65%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "hsl(210 20% 65%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip {...CustomTooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }} />
                    <Area type="monotone" dataKey="completed" stroke="hsl(217 91% 60%)" strokeWidth={2} fill="url(#colorCompleted)" name="Completed" />
                    <Area type="monotone" dataKey="created" stroke="hsl(260 80% 65%)" strokeWidth={2} fill="url(#colorCreated)" name="Created" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </motion.div>

            {/* Upcoming deadlines */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="col-span-1 rounded-2xl border border-border bg-card p-5 lg:col-span-2"
            >
              <h2 className="mb-1 text-sm font-semibold text-foreground">Upcoming Deadlines</h2>
              <p className="mb-4 text-xs text-muted-foreground">Tasks due in the next 7 days</p>
              {(upcoming?.length ?? 0) === 0 ? (
                <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                  No upcoming deadlines
                </div>
              ) : (
                <div className="space-y-3">
                  {(upcoming ?? []).slice(0, 5).map((task) => (
                    <div key={task.id} className="flex items-start gap-3 rounded-lg border border-border bg-secondary/30 p-3">
                      <span className={`mt-0.5 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-foreground">{task.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {task.dueDate ? `Due ${formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Task breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="col-span-1 rounded-2xl border border-border bg-card p-5 lg:col-span-3"
            >
              <h2 className="mb-1 text-sm font-semibold text-foreground">Task Breakdown by Project</h2>
              <p className="mb-5 text-xs text-muted-foreground">Status distribution across active projects</p>
              {breakdownLoading ? (
                <Skeleton className="h-52 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={breakdown ?? []} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 12%)" />
                    <XAxis dataKey="projectTitle" tick={{ fill: "hsl(210 20% 65%)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "hsl(210 20% 65%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip {...CustomTooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }} />
                    <Bar dataKey="todo" fill="hsl(222 30% 25%)" name="Todo" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="inProgress" fill="hsl(217 91% 50%)" name="In Progress" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="review" fill="hsl(260 80% 60%)" name="Review" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="completed" fill="hsl(160 80% 40%)" name="Done" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </motion.div>

            {/* Activity feed */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="col-span-1 rounded-2xl border border-border bg-card p-5 lg:col-span-2"
            >
              <h2 className="mb-1 text-sm font-semibold text-foreground">Activity Feed</h2>
              <p className="mb-4 text-xs text-muted-foreground">Latest team actions</p>
              {activityLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : (
                <div className="space-y-1 overflow-y-auto max-h-56 pr-1">
                  {(activity ?? []).map((item) => {
                    const initials = item.userName
                      ? item.userName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
                      : "?";
                    return (
                      <div key={item.id} className="flex items-start gap-3 rounded-lg p-2 hover:bg-secondary/30 transition-colors">
                        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[9px] font-bold text-primary ring-1 ring-primary/20">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-foreground leading-snug">{item.action}</p>
                          <p className="mt-0.5 text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
