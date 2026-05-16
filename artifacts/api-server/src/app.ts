import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import path from "node:path";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Serve static files from the React frontend build
const staticDir = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "nexus",
  "dist",
  "public",
);
app.use(express.static(staticDir));

// SPA fallback: serve index.html for any non-API route
app.get("*", (_req, res) => {
  res.sendFile(path.join(staticDir, "index.html"));
});

export default app;
