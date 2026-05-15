import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Zap, Eye, EyeOff } from "lucide-react";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [showPass, setShowPass] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const mutation = useLogin();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      const res = await mutation.mutateAsync({ data });
      login(res.token, res.user);
      setLocation("/dashboard");
    } catch (err: unknown) {
      const e = err as { data?: { error?: string } };
      setServerError(e?.data?.error ?? "Invalid credentials. Please try again.");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-60 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute bottom-0 right-0 h-[300px] w-[300px] rounded-full bg-accent/8 blur-[80px]" />
      </div>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <Link href="/" className="mb-4 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 ring-1 ring-primary/40">
              <Zap className="h-5 w-5 text-primary" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold tracking-tight">NEXUS</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to your command center</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-[0_0_40px_rgba(0,0,0,0.4)]">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {serverError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {serverError}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Email</label>
              <input
                type="email"
                {...register("email")}
                placeholder="you@company.com"
                className="w-full rounded-lg border border-input bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none ring-0 transition-all focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  {...register("password")}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-input bg-secondary px-4 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || mutation.isPending}
              className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-[0_0_16px_rgba(59,130,246,0.35)] transition-all hover:shadow-[0_0_24px_rgba(59,130,246,0.55)] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting || mutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Signing in...
                </span>
              ) : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Create one
            </Link>
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Demo: <span className="font-mono text-primary/80">alex@nexus.dev</span> / <span className="font-mono text-primary/80">nexus123</span>
        </p>
      </motion.div>
    </div>
  );
}
