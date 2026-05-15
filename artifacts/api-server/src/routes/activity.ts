import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, activityLogsTable, usersTable, projectsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/activity", requireAuth, async (_req, res): Promise<void> => {
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
    .limit(50);

  res.json(logs.map((l) => ({ ...l, taskTitle: null })));
});

export default router;
