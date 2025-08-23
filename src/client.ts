import { treaty } from "@elysiajs/eden";
import type { App } from "./index";

export const client = (options: Parameters<typeof treaty<App>>[0]) =>
  treaty<App>(options);
