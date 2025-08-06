// mutators.ts
import type { CustomMutatorDefs } from "@rocicorp/zero";
import type { Schema } from "./schema";

export function createMutators() {
  return {} as const satisfies CustomMutatorDefs<Schema>;
}

export type Mutators = ReturnType<typeof createMutators>;
