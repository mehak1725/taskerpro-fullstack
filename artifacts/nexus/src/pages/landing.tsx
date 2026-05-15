import { Link } from "wouter";
import { motion } from "framer-motion";
import { Zap, ArrowRight, CheckCircle, BarChart3, Users, Shield, Globe, Layers } from "lucide-react";

const features = [
  { icon: BarChart3, title: "Real-time Analytics", desc: "Live dashboards with velocity tracking, burndown charts, and sprint metrics." },
  { icon: Users, title: "Team Collaboration", desc: "Role-based access, member assignment, and activity feeds — everyone aligned." },
  { icon: Layers, title: "Kanban Workflows", desc: "Visual task management across Todo, In Progress, Review, and Done stages." },
  { icon: Shield, title: "Enterprise Security", desc: "JWT authentication, role-based permissions, and audit logs built-in." },
  { icon: Globe, title: "Cross-project Visibility", desc: "See all your tasks and deadlines in one unified command center." },
  { icon: CheckCircle, title: "Priority Management", desc: "Four-tier priority system: Critical, High, Medium, Low with visual indicators." },
];

const testimonials = [
  { name: "Sarah K.", role: "Engineering Lead @ Vertex", text: "TaskerPro transformed how our team operates. The real-time visibility into every project is unlike anything we've used before." },
  { name: "Marcus T.", role: "CTO @ Foundry Labs", text: "We cut our sprint planning time in half. The analytics alone justify every penny — our velocity has never been this clear." },
  { name: "Anika P.", role: "Product Manager @ Orbital", text: "The dashboard feels like mission control. Our entire team is obsessed with it. Adoption was immediate." },
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 ring-1 ring-primary/40">
              <Zap className="h-4 w-4 text-primary" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold tracking-tight">TaskerPro</span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            {["Features", "How it works", "Team", "Pricing"].map((item) => (
              <a key={item} href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                {item}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[0_0_16px_rgba(59,130,246,0.4)] transition-all hover:bg-primary/90 hover:shadow-[0_0_24px_rgba(59,130,246,0.6)]"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/8 blur-[120px]" />
          <div className="absolute top-1/3 -left-40 h-[400px] w-[400px] rounded-full bg-accent/6 blur-[100px]" />
          <div className="absolute top-1/3 -right-40 h-[400px] w-[400px] rounded-full bg-chart-3/5 blur-[100px]" />
        </div>
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
          <motion.div {...fadeUp} className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Now in open beta — join 2,400+ teams
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-6 text-5xl font-extrabold leading-tight tracking-tight text-foreground md:text-7xl"
          >
            The command center
            <br />
            <span className="bg-gradient-to-r from-primary via-accent to-chart-3 bg-clip-text text-transparent">
              for elite teams.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground"
          >
            TaskerPro gives engineering teams the clarity, velocity, and control they need to ship extraordinary products. Real-time analytics, intelligent task management, and seamless collaboration — all in one cinematic workspace.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link
              href="/signup"
              className="group flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-[0_0_24px_rgba(59,130,246,0.4)] transition-all hover:shadow-[0_0_36px_rgba(59,130,246,0.7)] hover:scale-[1.02]"
            >
              Launch your workspace
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-border bg-card px-8 py-3.5 text-base font-semibold text-foreground transition-all hover:border-primary/40 hover:bg-primary/5"
            >
              Sign in
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-5 text-xs text-muted-foreground"
          >
            Demo account: <span className="font-mono text-primary">alex@nexus.dev</span> / <span className="font-mono text-primary">nexus123</span>
          </motion.p>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-28 px-6">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/4 blur-[120px]" />
        </div>
        <div className="relative mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-16 text-center"
          >
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Capabilities</span>
            <h2 className="mt-3 text-4xl font-bold tracking-tight">Built for how teams actually work</h2>
            <p className="mt-4 text-muted-foreground">Every feature designed to reduce friction and amplify output.</p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {features.map(({ icon: Icon, title, desc }) => (
              <motion.div
                key={title}
                variants={fadeUp}
                className="group rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-[0_0_32px_rgba(59,130,246,0.08)]"
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/20 transition-all group-hover:bg-primary/25 group-hover:ring-primary/40">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-6 border-y border-border">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { value: "2,400+", label: "Active teams" },
              { value: "98%", label: "Uptime SLA" },
              { value: "40ms", label: "Avg response" },
              { value: "4.9/5", label: "User rating" },
            ].map(({ value, label }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-3xl font-extrabold text-primary md:text-4xl">{value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-28 px-6">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Testimonials</span>
            <h2 className="mt-3 text-4xl font-bold tracking-tight">Trusted by high-performance teams</h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-1 gap-6 md:grid-cols-3"
          >
            {testimonials.map(({ name, role, text }) => (
              <motion.div
                key={name}
                variants={fadeUp}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <p className="mb-6 text-sm text-muted-foreground leading-relaxed">"{text}"</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary ring-1 ring-primary/30">
                    {name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{name}</p>
                    <p className="text-xs text-muted-foreground">{role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-28 px-6 text-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        </div>
        <div className="relative mx-auto max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="mb-4 text-5xl font-extrabold tracking-tight">
              Your team deserves
              <br />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">mission-grade tools.</span>
            </h2>
            <p className="mb-10 text-muted-foreground">Start free. No credit card required. Up and running in 60 seconds.</p>
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 rounded-xl bg-primary px-10 py-4 text-base font-semibold text-primary-foreground shadow-[0_0_32px_rgba(59,130,246,0.5)] transition-all hover:shadow-[0_0_48px_rgba(59,130,246,0.8)] hover:scale-[1.03]"
            >
              Get started free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="font-bold text-foreground">TaskerPro</span>
            <span className="mx-2 text-border">·</span>
            <span>Enterprise Task Management</span>
          </div>
          <p>© {new Date().getFullYear()} TaskerPro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
