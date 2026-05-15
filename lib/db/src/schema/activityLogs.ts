import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { projectsTable } from "./projects";

export const activityLogsTable = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  action: text("action").notNull(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  projectId: integer("project_id").references(() => projectsTable.id, { onDelete: "cascade" }),
  taskId: integer("task_id"),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
});

export const insertActivityLogSchema = createInsertSchema(activityLogsTable).omit({ id: true, timestamp: true });
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogsTable.$inferSelect;
