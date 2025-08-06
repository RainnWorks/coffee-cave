import "dmno/auto-inject-globals";

import { createServer } from "http";
import express from "express";
import postgres from "postgres";
import { Sequelize } from "sequelize";
import {
  PushProcessor,
  ZQLDatabase,
  PostgresJSConnection,
} from "@rocicorp/zero/pg";
import { schema } from "./schema";
import { createMutators } from "./mutators";
import { createAdminJS } from "./admin";
import { createFrontendRouter } from "./frontend";

// === DB connection for Sequelize ===
const sequelize = new Sequelize(DMNO_CONFIG.ZERO_UPSTREAM_DB, {
  dialect: "postgres",
});

// === Create AdminJS & router ===
const { admin, router: adminRouter } = createAdminJS(sequelize);

// === Zero Push Processor ===
const processor = new PushProcessor(
  new ZQLDatabase(
    new PostgresJSConnection(postgres(DMNO_CONFIG.ZERO_UPSTREAM_DB)),
    schema
  )
);

// === Express app ===
const app = express();

// Push endpoint for Zero
app.post("/push", express.raw({ type: "*/*" }), async (req, res) => {
  const result = await processor.process(createMutators(), req.body);
  res.json(result);
});

// AdminJS UI
app.use(admin.options.rootPath, adminRouter);

// Frontend router (dev: vite, prod: Bun.file)
await createFrontendRouter(app);

// === Start HTTP server inside Bun ===
const server = createServer(app);
server.listen(3000, () => {
  console.log(`Server running at http://localhost:3000`);
  console.log(`AdminJS at http://localhost:3000${admin.options.rootPath}`);
});
