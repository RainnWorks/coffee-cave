// createFrontendRouter.ts
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function createFrontendRouter(): Promise<express.Router> {
  const router = express.Router();

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const configFile = path.resolve(__dirname, "..", "vite.config.ts");

    const vite = await createViteServer({
      configFile,
      root: path.resolve(__dirname, "client"),
      appType: "spa",
      server: { middlewareMode: true },
    });

    router.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, "client", "dist");

    // Serve static files
    router.use(
      express.static(distDir, {
        maxAge: "1y",
        immutable: true,
      })
    );

    // Fallback to index.html for client-side routes
    router.use("*", async (_, res, next) => {
      try {
        const indexFile = Bun.file(path.join(distDir, "index.html"));
        if (await indexFile.exists()) {
          const html = await indexFile.text();
          res.setHeader("Content-Type", "text/html");
          return res.status(200).send(html);
        } else {
          return res.status(500).send("index.html missing");
        }
      } catch (err) {
        next(err);
      }
    });
  }

  return router;
}
