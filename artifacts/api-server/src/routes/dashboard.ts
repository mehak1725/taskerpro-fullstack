import { Router, type IRouter } from "express";
import { eq, count, lt, and, ne, desc, sql } from "drizzle-orm";
import { db, tasksTable, projectsTable, teamMembersTable, usersTable, activityLogsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/dashboard/stats", requireAuth, async (_req, res): Promise<void> => {
  const now = new Date();

  const [totalTasksR] = await db.select({ count: count() }).from(tasksTable);
  const [completedR] = await db.select({ count: count() }).from(tasksTable).where(eq(tasksTable.status, "completed"));
  const [overdueR] = await db.select({ count: count() }).from(tasksTable).where(and(ne(tasksTable.status, "completed"), lt(tasksTable.dueDate, now)));
  const [totalProjectsR] = await db.select({ count: count() }).from(projectsTable);
  const [activeProjectsR] = await db.select({ count: count() }).from(projectsTable).where(eq(projectsTable.status, "active"));
  const [totalMembersR] = await db.select({ count: count() }).from(usersTable);

  const total = Number(totalTasksR?.count ?? 0);
  const completed = Number(completedR?.count ?? 0);
  const overdue = Number(overdueR?.count ?? 0);
  const pending = total - completed;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  res.json({
    totalTasks: total,
    completedTasks: completed,
    pendingTasks: pending,
    overdueTasks: overdue,
    totalProjects: Number(totalProjectsR?.count ?? 0),
    activeProjects: Number(activeProjectsR?.count ?? 0),
    completionRate,
    totalMembers: Number(totalMembersR?.count ?? 0),
  });
});

router.get("/dashboard/activity", requireAuth, async (_req, res): Promise<void> => {
  const logs = await db
    .select({
      id: activityLogsTable.id,
      action: activityLogsTable.action,
      userId: activityLogsTable.userId,
      userName: usersTable.name,
      userAvatar: usersTable.avatar,
      projectId: activityLogsTable.projectId,
      projectTitle: projectsTable.title,
      taskId: activityLogsTable.taskId,
      timestamp: activityLogsTable.timestamp,
    })
    .from(activityLogsTable)
    .leftJoin(usersTable, eq(usersTable.id, activityLogsTable.userId))
    .leftJoin(projectsTable, eq(projectsTable.id, activityLogsTable.projectId))
    .orderBy(desc(activityLogsTable.timestamp))
    .limit(20);

  res.json(logs.map((l) => ({ ...l, taskTitle: null })));
});

router.get("/dashboard/task-breakdown", requireAuth, async (_req, res): Promise<void> => {
  const projects = await db.select().from(projectsTable).limit(6);

  const breakdown = await Promise.all(
    projects.map(async (p) => {
      const statuses = ["todo", "in_progress", "review", "completed"];
      const counts: Record<string, number> = {};
      for (const s of statuses) {
        const [r] = await db.select({ count: count() }).from(tasksTable).where(and(eq(tasksTable.projectId, p.id), eq(tasksTable.status, s)));
        counts[s] = Number(r?.count ?? 0);
      }
      return {
        projectId: p.id,
        projectTitle: p.title,
        todo: counts["todo"],
        inProgress: counts["in_progress"],
        review: counts["review"],
        completed: counts["completed"],
      };
    })
  );

  res.json(breakdown);
});

router.get("/dashboard/velocity", requireAuth, async (_req, res): Promise<void> => {
  const weeks: { week: string; completed: number; created: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - i * 7 - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const [createdR] = await db
      .select({ count: count() })
      .from(tasksTable)
      .where(sql`${tasksTable.createdAt} >= ${weekStart} AND ${tasksTable.createdAt} < ${weekEnd}`);

    const [completedR] = await db
      .select({ count: count() })
      .from(tasksTable)
      .where(sql`${tasksTable.status} = 'completed' AND ${tasksTable.updatedAt} >= ${weekStart} AND ${tasksTable.updatedAt} < ${weekEnd}`);

    const label = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    weeks.push({ week: label, completed: Number(completedR?.count ?? 0), created: Number(createdR?.count ?? 0) });
  }
  res.json(weeks);
});

router.get("/dashboard/upcoming-deadlines", requireAuth, async (_req, res): Promise<void> => {
  const now = new Date();
  const soon = new Date();
  soon.setDate(soon.getDate() + 7);

  const tasks = await db
    .select({ task: tasksTable, assignee: usersTable, projectTitle: projectsTable.title })
    .from(tasksTable)
    .leftJoin(usersTable, eq(usersTable.id, tasksTable.assignedTo))
    .leftJoin(projectsTable, eq(projectsTable.id, tasksTable.projectId))
    .where(sql`${tasksTable.dueDate} IS NOT NULL AND ${tasksTable.dueDate} >= ${now} AND ${tasksTable.dueDate} <= ${soon} AND ${tasksTable.status} != 'completed'`)
    .orderBy(tasksTable.dueDate)
    .limit(10);

  res.json(tasks.map((r) => ({
    ...r.task,
    assignee: r.assignee ? { id: r.assignee.id, name: r.assignee.name, email: r.assignee.email, role: r.assignee.role, avatar: r.assignee.avatar, createdAt: r.assignee.createdAt, updatedAt: r.assignee.updatedAt } : null,
    projectTitle: r.projectTitle ?? null,
  })));
});

export default router;
