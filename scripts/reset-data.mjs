// Deletes the saved data file so the next start begins again from the sample data. All accounts are removed.
import fs from "node:fs";
import path from "node:path";
const file = path.resolve(process.env.ANNA_DATA_FILE ?? "data/anna.json");
fs.rmSync(file, { force: true });
console.log(`Removed ${file} (if it existed). Stop the server before running this, then start it again.`);
