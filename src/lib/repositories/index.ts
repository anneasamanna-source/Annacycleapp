import { demoRepositories } from "./demo";
import type { Repositories } from "./interfaces";

/** Chooses the data source from ANNA_DATA_MODE. Pages and services only call this. */
export function getRepositories(): Repositories {
  const mode = process.env.ANNA_DATA_MODE ?? "demo";
  if (mode === "demo" || mode === "local") return demoRepositories;
  if (mode === "supabase") {
    throw new Error("ANNA_DATA_MODE=supabase is not built. Use \"local\" for real accounts and saved data, or \"demo\".");
  }
  throw new Error(`Unknown ANNA_DATA_MODE "${mode}". Use "demo" or "local".`);
}
