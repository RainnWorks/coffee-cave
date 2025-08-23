import concurrently from "concurrently";
// Parallel services using concurrently API
console.log("🎯 Starting development services...");

const { result } = concurrently(
  [
    {
      command: "bun run dev:zero-cache",
      name: "zero-cache",
      prefixColor: "cyan",
    },
    {
      command: "bun run dev:server",
      name: "server",
      prefixColor: "magenta",
    },
    {
      command: "bun run dev:frontend",
      name: "frontend",
      prefixColor: "yellow",
    },
  ],
  {
    prefix: "name",
    restartTries: 3,
    killOthersOn: "failure",
  }
);

result.then(
  () => {
    console.log("✅ All services completed successfully");
  },
  () => {
    process.exit(1);
  }
);
