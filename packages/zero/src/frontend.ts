// createFrontendRouter.ts
import type { Express } from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function createFrontendRouter(app: Express) {
  if (process.env.NODE_ENV !== "production") {
    // Dev mode: use Vite middleware
    const { createServer: createViteServer } = await import("vite");
    const configFile = path.resolve(__dirname, "..", "vite.config.ts");

    const vite = await createViteServer({
      configFile,
      root: path.resolve(__dirname, "client"),
      appType: "spa",
      server: { middlewareMode: true },
    });
    app.use(vite.middlewares);
  } else {
    // Prod mode: serve built frontend with Bun.file()
    app.use(async (req, res, next) => {
      const filePath = path.join(
        __dirname,
        "client",
        "dist",
        req.path === "/" || req.path === "" ? "index.html" : req.path
      );

      try {
        const file = Bun.file(filePath);
        if (await file.exists()) {
          if (file.type) {
            res.setHeader("Content-Type", file.type);
          }
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
          return res.send(await file.arrayBuffer());
        }
      } catch {
        // ignore and fall through
      }

      next();
    });
  }
}
