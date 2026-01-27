import { styleText } from "node:util";

type Style = Parameters<typeof styleText>[0];

const DEFAULT_STYLES = [
  "red", // red
  "green", // green
  "yellow", // yellow
  "blue", // blue
  "magenta", // magenta
  "cyan", // cyan
] as const satisfies Style[];

type CommandSpec = string | { cmd: string; alias: string; style?: Style };

type BunRunConfig = {
  up: (CommandSpec | CommandSpec[])[];
  down?: (CommandSpec | CommandSpec[])[];
};

function normalizeSpec(spec: CommandSpec, index: number) {
  const defaultStyle = DEFAULT_STYLES[index % DEFAULT_STYLES.length];
  return typeof spec === "string"
    ? {
        cmd: spec,
        alias: spec,
        style: defaultStyle,
      }
    : {
        ...spec,
        style: spec.style ?? defaultStyle,
      };
}

function log(style: Style, alias: string, message: string) {
  const prefix = styleText(style, `[${alias}]`);
  console.log(`${prefix} ${message}`);
}

async function runCommand(spec: CommandSpec, index: number) {
  const { cmd, alias, style } = normalizeSpec(spec, index);
  log(style, alias, styleText("gray", cmd));

  try {
    // Use Bun.spawn instead of $ to have more control over stdout and stderr
    const proc = Bun.spawn(["/bin/sh", "-c", cmd], {
      stdout: "pipe",
      stderr: "pipe",
    });

    // Stream stdout
    if (proc.stdout) {
      const reader = proc.stdout.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      (async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.trim()) {
                log(style, alias, line);
              }
            }
          }
          // Handle any remaining content
          if (buffer.trim()) {
            log(style, alias, buffer);
          }
        } catch (err) {
          console.error("Error reading stdout:", err);
        }
      })();
    }

    // Stream stderr with the same format but mark it as stderr
    if (proc.stderr) {
      const reader = proc.stderr.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      (async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.trim()) {
                // Use the same formatting for stderr
                log(style, `${alias} (stderr)`, line);
              }
            }
          }
          // Handle any remaining content
          if (buffer.trim()) {
            log(style, `${alias} (stderr)`, buffer);
          }
        } catch (err) {
          console.error("Error reading stderr:", err);
        }
      })();
    }

    // Wait for process to complete
    const exitCode = await proc.exited;
    if (exitCode !== 0) {
      throw new Error(`Command failed with exit code ${exitCode}`);
    }
  } catch (error) {
    const errorAlias = `${alias}`;
    if (error instanceof Error) {
      log(style, errorAlias, error.message);

      // Access stderr if available (from Bun shell error)
      const shellError = error as any;
      if (shellError.stderr) {
        const stderrText = shellError.stderr.toString();
        for (const line of stderrText.split("\n").filter(Boolean)) {
          log(style, errorAlias, line);
        }
      }
      if (shellError.stdout) {
        const stdoutText = shellError.stdout.toString();
        for (const line of stdoutText.split("\n").filter(Boolean)) {
          log(style, errorAlias, line);
        }
      }
    }

    // Re-throw to propagate the error
    throw error;
  }
}

async function runSteps(
  steps: (CommandSpec | CommandSpec[])[],
  startIndex = 0,
): Promise<number> {
  let index = startIndex;

  for (const step of steps) {
    if (Array.isArray(step)) {
      await Promise.all(step.map((spec) => runCommand(spec, index++)));
    } else {
      await runCommand(step, index++);
    }
  }

  return index;
}

export async function bunRun({ up, down }: BunRunConfig) {
  // Handle cleanup
  if (down) {
    process.on("SIGINT", async () => {
      await runSteps(down);
      process.exit(0);
    });
  }
  try {
    // Run "up" sequence
    await runSteps(up);
  } catch {
    process.exit(1);
  }
}
