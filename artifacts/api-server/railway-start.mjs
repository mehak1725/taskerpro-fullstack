import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { existsSync } from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..", "..");

process.env.NODE_ENV = process.env.NODE_ENV || "production";

// Find the drizzle-kit binary without assuming pnpm is in PATH at runtime.
function findBinary(name) {
  const candidates = [
    path.join(root, "node_modules", ".bin", name),
    path.join(root, "lib", "db", "node_modules", ".bin", name),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return name; // fallback – hope it's in PATH (npx / global)
}

const drizzleKit = findBinary("drizzle-kit");

// Push schema changes to the database.
// NOTE: For a production app with live data, switch to drizzle-kit migrate + generated migrations.
try {
  execSync(`"${drizzleKit}" push --config ./lib/db/drizzle.config.ts`, {
    stdio: "inherit",
    cwd: root,
  });
} catch (err) {
  console.error("\n❌ Database migration failed.");
  console.error("Make sure DATABASE_URL is set and the Postgres service is provisioned.\n");
  console.error(err);
  process.exit(1);
}

// Start the API server (which also serves the built frontend)
await import("./dist/index.mjs");
