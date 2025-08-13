import { AdminJS, Router as AdminJSRouter, type CurrentAdmin } from "adminjs";
import { Elysia } from "elysia";
import { buildAssets, buildRoutes } from "./build-router";
import { authedPlugin, type AuthPayload } from "../auth";


/**
 * Convert AuthPayload to AdminJS CurrentAdmin format
 */
const authPayloadToCurrentAdmin = (
  authPayload?: AuthPayload | null
): CurrentAdmin => {
  if (!authPayload) throw new Error("No auth payload");
  if (authPayload.role !== "admin") throw new Error("Not an admin");

  return {
    id: authPayload.sub,
    email: `${authPayload.adminId}@coffeecave.admin`,
    role: authPayload.role,
  };
};

export const buildAuthenticatedRouter = async (
  admin: AdminJS,
) => {
  // initialize bundler
  await admin.initialize();
  await admin.watch();

  // create router with auth plugin
  const { routes, assets } = AdminJSRouter;
  const elysia = new Elysia({ prefix: admin.options.rootPath })
    .use(buildAssets(admin, assets, routes))
    .use(authedPlugin) // Use your existing auth plugin
    .derive(({ authPayload }) => {
      console.log("osindgoinsdgiondgoinsoigdnd");
      // Convert your AuthPayload to AdminJS CurrentAdmin format
      const currentAdmin = authPayload
        ? authPayloadToCurrentAdmin(authPayload)
        : null;
      return { currentAdmin };
    })
    .onBeforeHandle(async ({ redirect, authPayload, path }) => {
      console.log('ofnoisdfnisoadnf')

      // Skip auth for static assets
      if (path.includes("/frontend/assets/")) {
        return;
      }

      // If no valid auth, redirect to main login with return URL
      if (!authPayload || authPayload.role !== "admin") {
        const returnUrl = encodeURIComponent(path);
        return redirect(`/login?redirect=${returnUrl}`, 302);
      }
    });

  return elysia.use(
    buildRoutes<typeof elysia>(admin, routes, (ctx) => {
      return authPayloadToCurrentAdmin(ctx.authPayload);
    })
  );
};
