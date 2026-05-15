import { useState } from "react";
import { motion } from "framer-motion";
import { useUpdateUser, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Save, User, Lock } from "lucide-react";

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function SettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const updateUser = useUpdateUser();

  const [profileForm, setProfileForm] = useState({ name: user?.name ?? "", avatar: user?.avatar ?? "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      await updateUser.mutateAsync({ userId: user.id, data: { name: profileForm.name || undefined, avatar: profileForm.avatar || undefined } });
      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      setProfileMsg({ type: "success", text: "Profile updated successfully." });
    } catch {
      setProfileMsg({ type: "error", text: "Failed to update profile." });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg({ type: "error", text: "New passwords do not match." });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordMsg({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }
    setSavingPassword(true);
    setPasswordMsg(null);
    try {
      await updateUser.mutateAsync({
        userId: user.id,
        data: { currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword },
      });
      setPasswordMsg({ type: "success", text: "Password changed successfully." });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch {
      setPasswordMsg({ type: "error", text: "Current password is incorrect." });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="p-6 lg:p-8">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage your profile and security preferences.</p>
          </motion.div>

          <div className="max-w-2xl space-y-6">
            {/* Profile */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/20">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <h2 className="text-base font-semibold text-foreground">Profile</h2>
              </div>

              {/* Avatar preview */}
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 to-accent/20 text-lg font-bold text-primary ring-1 ring-primary/20">
                  {user?.name ? initials(user.name) : "?"}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                  <span className="mt-1 inline-block rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                    {user?.role}
                  </span>
                </div>
              </div>

              <form onSubmit={handleProfileSave} className="space-y-4">
                {profileMsg && (
                  <div className={`rounded-lg border px-4 py-3 text-sm ${profileMsg.type === "success" ? "border-chart-3/30 bg-chart-3/10 text-chart-3" : "border-destructive/30 bg-destructive/10 text-destructive"}`}>
                    {profileMsg.text}
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Display name</label>
                  <input
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full rounded-lg border border-input bg-secondary px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Avatar URL</label>
                  <input
                    value={profileForm.avatar}
                    onChange={(e) => setProfileForm({ ...profileForm, avatar: e.target.value })}
                    placeholder="https://example.com/avatar.png"
                    className="w-full rounded-lg border border-input bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_0_12px_rgba(59,130,246,0.3)] transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" />
                    {savingProfile ? "Saving..." : "Save profile"}
                  </button>
                </div>
              </form>
            </motion.div>

            {/* Password */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 ring-1 ring-accent/20">
                  <Lock className="h-4 w-4 text-accent" />
                </div>
                <h2 className="text-base font-semibold text-foreground">Change password</h2>
              </div>
              <form onSubmit={handlePasswordSave} className="space-y-4">
                {passwordMsg && (
                  <div className={`rounded-lg border px-4 py-3 text-sm ${passwordMsg.type === "success" ? "border-chart-3/30 bg-chart-3/10 text-chart-3" : "border-destructive/30 bg-destructive/10 text-destructive"}`}>
                    {passwordMsg.text}
                  </div>
                )}
                {[
                  { label: "Current password", key: "currentPassword" },
                  { label: "New password", key: "newPassword" },
                  { label: "Confirm new password", key: "confirmPassword" },
                ].map(({ label, key }) => (
                  <div key={key} className="space-y-1.5">
                    <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</label>
                    <input
                      type="password"
                      value={passwordForm[key as keyof typeof passwordForm]}
                      onChange={(e) => setPasswordForm({ ...passwordForm, [key]: e.target.value })}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-input bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                ))}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow-[0_0_12px_rgba(139,92,246,0.3)] transition-all hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" />
                    {savingPassword ? "Updating..." : "Update password"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
