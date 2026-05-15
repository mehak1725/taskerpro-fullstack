import { Router, type IRouter } from "express";
import { eq, and, sql, desc } from "drizzle-orm";
import { db, tasksTable, usersTable, projectsTable, activityLogsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import {
  ListProjectTasksParams, CreateTaskParams, CreateTaskBody,
  GetTaskParams, UpdateTaskParams, UpdateTaskBody, DeleteTaskParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function enrichTask(task: typeof tasksTable.$inferSelect, assignee?: typeof usersTable.$inferSelect | null, projectTitle?: string | null) {
  return {
    ...task,
    assignee: assignee ? { id: assignee.id, name: assignee.name, email: assignee.email, role: assignee.role, avatar: assignee.avatar, createdAt: assignee.createdAt, updatedAt: assignee.updatedAt } : null,
    projectTitle: projectTitle ?? null,
  };
}

router.get("/projects/:projectId/tasks", requireAuth, async (req, res): Promise<void> => {
  const params = ListProjectTasksParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const tasks = await db
    .select({ task: tasksTable, assignee: usersTable })
    .from(tasksTable)
    .leftJoin(usersTable, eq(usersTable.id, tasksTable.assignedTo))
    .where(eq(tasksTable.projectId, params.data.projectId))
    .orderBy(tasksTable.createdAt);

  const [project] = await db.select({ title: projectsTable.title }).from(projectsTable).where(eq(projectsTable.id, params.data.projectId));
  res.json(tasks.map((r) => enrichTask(r.task, r.assignee, project?.title)));
});

router.post("/projects/:projectId/tasks", requireAuth, async (req, res): Promise<void> => {
  const params = CreateTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = CreateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [task] = await db.insert(tasksTable).values({ ...parsed.data, projectId: params.data.projectId }).returning();
  await db.insert(activityLogsTable).values({ action: `Created task "${task.title}"`, userId: req.user!.userId, projectId: params.data.projectId, taskId: task.id }).catch(() => {});
  const assignee = task.assignedTo ? (await db.select().from(usersTable).where(eq(usersTable.id, task.assignedTo)))[0] : null;
  const [project] = await db.select({ title: projectsTable.title }).from(projectsTable).where(eq(projectsTable.id, params.data.projectId));
  res.status(201).json(enrichTask(task, assignee, project?.title));
});

router.get("/tasks", requireAuth, async (req, res): Promise<void> => {
  const tasks = await db
    .select({ task: tasksTable, assignee: usersTable, projectTitle: projectsTable.title })
    .from(tasksTable)
    .leftJoin(usersTable, eq(usersTable.id, tasksTable.assignedTo))
    .leftJoin(projectsTable, eq(projectsTable.id, tasksTable.projectId))
    .orderBy(desc(tasksTable.createdAt));

  res.json(tasks.map((r) => enrichTask(r.task, r.assignee, r.projectTitle)));
});

router.get("/tasks/:taskId", requireAuth, async (req, res): Promise<void> => {
  const params = GetTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .select({ task: tasksTable, assignee: usersTable, projectTitle: projectsTable.title })
    .from(tasksTable)
    .leftJoin(usersTable, eq(usersTable.id, tasksTable.assignedTo))
    .leftJoin(projectsTable, eq(projectsTable.id, tasksTable.projectId))
    .where(eq(tasksTable.id, params.data.taskId));

  if (!row) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.json(enrichTask(row.task, row.assignee, row.projectTitle));
});

router.patch("/tasks/:taskId", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [task] = await db.update(tasksTable).set(parsed.data).where(eq(tasksTable.id, params.data.taskId)).returning();
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  await db.insert(activityLogsTable).values({ action: `Updated task "${task.title}"`, userId: req.user!.userId, projectId: task.projectId, taskId: task.id }).catch(() => {});
  const assignee = task.assignedTo ? (await db.select().from(usersTable).where(eq(usersTable.id, task.assignedTo)))[0] : null;
  const [project] = await db.select({ title: projectsTable.title }).from(projectsTable).where(eq(projectsTable.id, task.projectId));
  res.json(enrichTask(task, assignee, project?.title));
});

router.delete("/tasks/:taskId", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [task] = await db.delete(tasksTable).where(eq(tasksTable.id, params.data.taskId)).returning();
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
