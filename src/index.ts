import "dmno/auto-inject-globals";
import { Elysia } from "elysia";
import { frontendPlugin } from "./plugins/frontend";
import { zeroPushPlugin } from "./plugins/zero-push";
import { authRoutes } from "./plugins/auth";
import { cors } from "@elysiajs/cors";

const isProd = process.env.NODE_ENV === "production";

// ------------ Elysia instance ------------
let app = new Elysia({ name: "pos-server" })

  .use(zeroPushPlugin)
  // .use(adminPlugin())
  .use(authRoutes)
  // Health-check
  .use(cors())
  .get("/health", () => ({ ok: true }));

if (DMNO_CONFIG.NODE_ENV === "production") {
  app = app.use(frontendPlugin());
}

app.listen(3000, () => {
  console.log("Elysia server running at http://localhost:3000");
});

export type App = typeof app;
