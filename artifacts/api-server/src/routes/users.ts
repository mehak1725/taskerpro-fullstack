import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { GetUserParams, UpdateUserParams, UpdateUserBody } from "@workspace/api-zod";

const router: IRouter = Router();

const toPublicUser = (u: typeof usersTable.$inferSelect) => ({
  id: u.id, name: u.name, email: u.email, role: u.role, avatar: u.avatar, createdAt: u.createdAt, updatedAt: u.updatedAt
});

router.get("/users", requireAuth, async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(usersTable.name);
  res.json(users.map(toPublicUser));
});

router.get("/users/:userId", requireAuth, async (req, res): Promise<void> => {
  const params = GetUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(toPublicUser(user));
});

router.patch("/users/:userId", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, avatar, currentPassword, newPassword } = parsed.data;
  const updates: Partial<typeof usersTable.$inferInsert> = {};

  if (name != null) updates.name = name;
  if (avatar != null) updates.avatar = avatar;

  if (newPassword && currentPassword) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.userId));
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      res.status(400).json({ error: "Current password is incorrect" });
      return;
    }
    updates.password = await bcrypt.hash(newPassword, 10);
  }

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }

  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, params.data.userId)).returning();
  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(toPublicUser(updated));
});

export default router;
