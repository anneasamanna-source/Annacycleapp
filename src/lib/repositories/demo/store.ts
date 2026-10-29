import fs from "node:fs";
import path from "node:path";
import { createSeed, type Seed } from "../../../data/demo/seed";

/**
 * The in-memory store behind the repositories.
 *  - ANNA_DATA_MODE=demo  (default): sample data, memory only, resets on restart.
 *  - ANNA_DATA_MODE=local: sample data PLUS real accounts and anything created on the site, saved to a JSON
 *    file (ANNA_DATA_FILE, default data/anna.json) after every change, so it survives restarts.
 * Every change runs synchronously in one process, which is what keeps reservations and bookings atomic.
 * Run ONE server process only. The file is not safe for several servers writing at once.
 */
const g = globalThis as unknown as { __annaStore?: Seed };

export const isLocalMode = () => process.env.ANNA_DATA_MODE === "local";
const dataFile = () => path.resolve(process.env.ANNA_DATA_FILE ?? "data/anna.json");

function write(s: Seed) {
  const file = dataFile();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(s));
  fs.renameSync(tmp, file); // atomic replace: a crash never leaves a half-written file
}

function loadOrCreate(): Seed {
  const file = dataFile();
  if (fs.existsSync(file)) {
    try {
      return JSON.parse(fs.readFileSync(file, "utf8")) as Seed;
    } catch (e) {
      // Never silently replace a file we can't read: that would destroy real data.
      throw new Error(`Could not read ${file} (${(e as Error).message}). Fix it, or delete it to start over.`);
    }
  }
  const fresh = createSeed();
  write(fresh);
  return fresh;
}

export function store(): Seed {
  return (g.__annaStore ??= isLocalMode() ? loadOrCreate() : createSeed());
}

/** Call after every change. Does nothing in demo mode. */
export function persist() {
  if (isLocalMode()) write(store());
}

/** For tests: forget the in-memory copy so the next call reloads or reseeds. */
export function resetDemoStore() {
  g.__annaStore = undefined;
}
