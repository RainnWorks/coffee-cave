import "dmno/auto-inject-globals";

import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { authRoutes } from "./plugins/auth";
import { frontendPlugin } from "./plugins/frontend";
import { platformApiPlugin } from "./plugins/platform-api";
import { tenantPlugin } from "./plugins/tenant";
import { zeroPushPlugin } from "./plugins/zero-push";
import { zeroQueryPlugin } from "./plugins/zero-query";

// ------------ Elysia instance ------------
let app = new Elysia({ name: "pos-server" })
  // Global middleware
  .use(cors())
  .use(tenantPlugin) // Resolve tenant from subdomain/dev override

  // Platform API routes (tenant management)
  .use(platformApiPlugin)

  // Zero endpoints (tenant-scoped)
  .use(zeroPushPlugin)
  .use(zeroQueryPlugin)

  // Auth routes (tenant login, OAuth, platform)
  .use(authRoutes)

  // Health-check
  .get("/health", ({ tenant }) => ({
    ok: true,
    tenant: tenant.tenantSlug ?? "none",
    tenantId: tenant.tenantId ?? null,
  }));

if (DMNO_CONFIG.NODE_ENV === "production") {
  app = app.use(frontendPlugin());
}

app.listen(3000, () => {
  console.log("Elysia server running at http://localhost:3000");
});

export type App = typeof app;
