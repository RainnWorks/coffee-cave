import path from "path";
import { staticPlugin } from "@elysiajs/static";

export async function frontendPlugin() {
  const distDir = path.join(__dirname, "client", "dist");

  return staticPlugin({
    assets: distDir,
    prefix: "/", // same URL scheme as before
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
}
