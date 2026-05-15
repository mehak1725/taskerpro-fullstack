import { Router, type IRouter } from "express";
import { eq, count, and, sql, inArray } from "drizzle-orm";
import { db, projectsTable, tasksTable, teamMembersTable, usersTable, activityLogsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import {
  GetProjectParams, UpdateProjectParams, UpdateProjectBody, DeleteProjectParams,
  CreateProjectBody,
  ListProjectMembersParams, AddProjectMemberParams, AddProjectMemberBody,
  RemoveProjectMemberParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function enrichProject(project: typeof projectsTable.$inferSelect) {
  const [taskCountResult] = await db.select({ count: count() }).from(tasksTable).where(eq(tasksTable.projectId, project.id));
  const [completedCountResult] = await db.select({ count: count() }).from(tasksTable).where(and(eq(tasksTable.projectId, project.id), eq(tasksTable.status, "completed")));
  const [memberCountResult] = await db.select({ count: count() }).from(teamMembersTable).where(eq(teamMembersTable.projectId, project.id));

  const total = taskCountResult?.count ?? 0;
  const completed = completedCountResult?.count ?? 0;
  const members = memberCountResult?.count ?? 0;
  const progress = total > 0 ? Math.round((Number(completed) / Number(total)) * 100) : 0;

  return {
    ...project,
    taskCount: Number(total),
    completedTaskCount: Number(completed),
    memberCount: Number(members),
    progressPercent: progress,
  };
}

router.get("/projects", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  // Return projects where user is a member OR created by user
  const userProjects = await db
    .selectDistinct({ projectId: projectsTable.id })
    .from(projectsTable)
    .leftJoin(teamMembersTable, eq(teamMembersTable.projectId, projectsTable.id))
    .where(sql`${projectsTable.createdBy} = ${userId} OR ${teamMembersTable.userId} = ${userId}`);

  const projectIds = userProjects.map((r) => r.projectId);
  if (projectIds.length === 0) {
    res.json([]);
    return;
  }

  const projects = await db.select().from(projectsTable).where(inArray(projectsTable.id, projectIds));
  const enriched = await Promise.all(projects.map(enrichProject));
  res.json(enriched);
});

router.post("/projects", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [project] = await db.insert(projectsTable).values({ ...parsed.data, createdBy: req.user!.userId }).returning();
  // Auto-add creator as member
  await db.insert(teamMembersTable).values({ userId: req.user!.userId, projectId: project.id }).onConflictDoNothing();
  await db.insert(activityLogsTable).values({ action: `Created project "${project.title}"`, userId: req.user!.userId, projectId: project.id });
  res.status(201).json(await enrichProject(project));
});

router.get("/projects/:projectId", requireAuth, async (req, res): Promise<void> => {
  const params = GetProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, params.data.projectId));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.json(await enrichProject(project));
});

router.patch("/projects/:projectId", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [project] = await db.update(projectsTable).set(parsed.data).where(eq(projectsTable.id, params.data.projectId)).returning();
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  await db.insert(activityLogsTable).values({ action: `Updated project "${project.title}"`, userId: req.user!.userId, projectId: project.id }).catch(() => {});
  res.json(await enrichProject(project));
});

router.delete("/projects/:projectId", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(projectsTable).where(eq(projectsTable.id, params.data.projectId));
  res.sendStatus(204);
});

// ── Team Members ──────────────────────────────────────────────────────────────

router.get("/projects/:projectId/members", requireAuth, async (req, res): Promise<void> => {
  const params = ListProjectMembersParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const members = await db
    .select({ id: teamMembersTable.id, userId: teamMembersTable.userId, projectId: teamMembersTable.projectId, joinedAt: teamMembersTable.joinedAt, user: { id: usersTable.id, name: usersTable.name, email: usersTable.email, role: usersTable.role, avatar: usersTable.avatar, createdAt: usersTable.createdAt, updatedAt: usersTable.updatedAt } })
    .from(teamMembersTable)
    .leftJoin(usersTable, eq(usersTable.id, teamMembersTable.userId))
    .where(eq(teamMembersTable.projectId, params.data.projectId));
  res.json(members);
});

router.post("/projects/:projectId/members", requireAuth, async (req, res): Promise<void> => {
  const params = AddProjectMemberParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = AddProjectMemberBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [member] = await db.insert(teamMembersTable).values({ userId: parsed.data.userId, projectId: params.data.projectId }).onConflictDoNothing().returning();
  if (!member) {
    res.status(409).json({ error: "Already a member" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, parsed.data.userId));
  await db.insert(activityLogsTable).values({ action: `Added ${user?.name ?? "a user"} to the project`, userId: req.user!.userId, projectId: params.data.projectId }).catch(() => {});
  res.status(201).json({ ...member, user: user ? { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, createdAt: user.createdAt, updatedAt: user.updatedAt } : null });
});

router.delete("/projects/:projectId/members/:userId", requireAuth, async (req, res): Promise<void> => {
  const params = RemoveProjectMemberParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(teamMembersTable).where(and(eq(teamMembersTable.projectId, params.data.projectId), eq(teamMembersTable.userId, params.data.userId)));
  res.sendStatus(204);
});

export default router;
