import { bunRun } from "./bun-runner";

await bunRun({
  up: [
    "bun run dev:db-up",
    "bun run dev:db-reset",
    ["bun run dev:zero-cache", "bun run dev:server"],
  ],
  down: ["bun run dev:db-down"],
});
