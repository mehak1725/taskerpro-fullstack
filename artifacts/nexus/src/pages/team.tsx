import { motion } from "framer-motion";
import { useListUsers } from "@workspace/api-client-react";
import { AppLayout } from "@/components/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Shield } from "lucide-react";

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-primary/15 text-primary border-primary/30",
  member: "bg-secondary text-muted-foreground border-border",
};

const stagger = { animate: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

export default function TeamPage() {
  const { data: users, isLoading } = useListUsers();

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="p-6 lg:p-8">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Team</h1>
            <p className="mt-1 text-sm text-muted-foreground">All workspace members and their roles.</p>
          </motion.div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
            </div>
          ) : (users?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card">
                <Users className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold text-foreground">No team members yet</h3>
            </div>
          ) : (
            <motion.div variants={stagger} initial="initial" animate="animate" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {(users ?? []).map((user) => (
                <motion.div
                  key={user.id}
                  variants={fadeUp}
                  className="rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/20 hover:shadow-[0_0_20px_rgba(59,130,246,0.06)]"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 to-accent/20 text-base font-bold text-primary ring-1 ring-primary/20">
                        {initials(user.name)}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-chart-3 ring-2 ring-background" />
                    </div>
                    <p className="font-semibold text-foreground">{user.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{user.email}</p>
                    <div className="mt-3 flex items-center gap-1.5">
                      {user.role === "admin" && <Shield className="h-3 w-3 text-primary" />}
                      <span className={`rounded-md border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${ROLE_COLORS[user.role]}`}>
                        {user.role}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
