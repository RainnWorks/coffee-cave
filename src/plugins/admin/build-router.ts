import type {
  ActionRequest,
  ApiController,
  AppController,
  CurrentAdmin,
} from "adminjs";
import { AdminJS } from "adminjs";
import { Router as AdminJSRouter } from "adminjs";
import type { AnyElysia, InferContext } from "elysia";
import { Elysia } from "elysia";
import { createResponse } from "node-mocks-http";

export const buildAssets = (
  admin: AdminJS,
  assets: (typeof AdminJSRouter)["assets"],
  routes: (typeof AdminJSRouter)["routes"]
) => {
  const router = new Elysia();

  // copied from adminjs-express
  // Note: We want components.bundle.js to be globally available. In production it is served as a .js asset, meanwhile
  // in local environments it's a route with "bundleComponents" action assigned.
  const componentBundlerRoute = routes.find(
    (r) => r.action === "bundleComponents"
  );
  if (componentBundlerRoute) {
    buildRoute(componentBundlerRoute, router, admin);
  }

  assets.forEach((asset) => {
    router.get(asset.path, () => Bun.file(asset.src));
  });

  return router;
};

const routeHandler =
  <T extends Elysia>(
    admin: AdminJS,
    route: (typeof AdminJSRouter)["routes"][0],
    adminGetter?: (ctx: InferContext<T>) => CurrentAdmin
  ) =>
  async (ctx: InferContext<T>) => {
    let { params, query, request, set, body } = ctx;
    const currentAdmin = adminGetter?.(ctx);

    const controller = new (route.Controller as AdminJSController)(
      { admin },
      currentAdmin
    );

    let payload = {};
    if (request.method.toUpperCase() === "POST") {
      payload = {
        ...(body || {}),
        // ...(formData?.files || {}),
      };
    }

    const actionRequest: ActionRequest = {
      ...request,
      payload,
      params: params as any,
      query: query as any,
      method: request.method.toLowerCase() as "get" | "post",
    };

    const response = createResponse();
    const html = await controller[route.action as keyof typeof controller](
      actionRequest,
      response
    );

    if (html) {
      set.headers["Content-Type"] =
        route?.contentType ?? "text/html;charset=utf-8";
      return html;
    }

    set.status = response.statusCode || 200;
    return response._getData();
  };

export const buildRoute = <T extends Elysia>(
  route: (typeof AdminJSRouter)["routes"][number],
  router: Elysia,
  admin: AdminJS,
  adminGetter?: (ctx: InferContext<T>) => CurrentAdmin
) => {
  const elysiaPath = route.path.replace(/{/g, ":").replace(/}/g, ""); //change routes from {recordId} to :recordId
  const handler = routeHandler(admin, route, adminGetter);
  router.route(route.method, elysiaPath, handler);
};

export const buildRoutes = <T extends AnyElysia>(
  admin: AdminJS,
  routes: (typeof AdminJSRouter)["routes"],
  adminGetter?: (ctx: InferContext<T>) => CurrentAdmin
) => {
  return routes.reduce((router, route) => {
    buildRoute<T>(route, router, admin, adminGetter);
    return router;
  }, new Elysia());
};

type AdminJSController = typeof ApiController | typeof AppController;

export const buildRouter = async (admin: AdminJS) => {
  // initialize bundler
  await admin.initialize();
  await admin.watch();

  // create router
  const { routes, assets } = AdminJSRouter;
  return new Elysia({ prefix: admin.options.rootPath })
    .use(buildAssets(admin, assets, routes))
    .use(buildRoutes(admin, routes));
};
