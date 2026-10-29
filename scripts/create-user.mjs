// Creates an account that cannot be created on the website: hub operator or administrator (or any role).
//
//   1. STOP the server first (Ctrl+C). A running server would overwrite this change.
//   2. node scripts/create-user.mjs --name "Rina" --email rina@example.com --role hub_operator --hub h-1
//   3. Start the server again.
//
// Options: --name --email --role (hub_operator|admin|vendor|buyer) --district --hub <hub id> --password
// If --password is left out you are asked for it (what you type is visible, so use a private screen).
// The server must have been opened at least once, so the data file exists (default data/anna.json).
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { randomUUID } from "node:crypto";
import { hashPassword } from "./password.mjs";

const args = {};
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) if (argv[i].startsWith("--")) args[argv[i].slice(2)] = argv[i + 1];

const file = path.resolve(process.env.ANNA_DATA_FILE ?? "data/anna.json");
const fail = (m) => { console.error(`Error: ${m}`); process.exit(1); };
if (!fs.existsSync(file)) fail(`${file} not found. Start the app once with ANNA_DATA_MODE=local so it creates the file.`);

const ROLES = ["hub_operator", "admin", "vendor", "buyer"];
const name = (args.name ?? "").trim();
const email = (args.email ?? "").trim().toLowerCase();
const role = args.role ?? "";
if (!name || name.length > 80) fail("--name is required (80 characters at most).");
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail("--email is missing or not valid.");
if (!ROLES.includes(role)) fail(`--role must be one of: ${ROLES.join(", ")}.`);

let password = args.password;
if (!password) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  password = await rl.question("Password (8 to 128 characters): ");
  rl.close();
}
if (!password || password.length < 8 || password.length > 128) fail("The password must be 8 to 128 characters.");

const data = JSON.parse(fs.readFileSync(file, "utf8"));
if (data.credentials.some((c) => c.email === email)) fail("An account with this email already exists.");
const user = { id: `u-${randomUUID().slice(0, 8)}`, name, role, district: args.district ?? "Kolkata", isDemo: false };

if (args.hub) {
  const hub = data.hubs.find((h) => h.id === args.hub);
  if (!hub) fail(`No hub with id "${args.hub}". Hub ids: ${data.hubs.map((h) => h.id).join(", ")}.`);
  if (role !== "hub_operator") fail("--hub only makes sense with --role hub_operator.");
  hub.operatorId = user.id;
}
data.users.push(user);
data.credentials.push({ userId: user.id, email, passwordHash: hashPassword(password) });

fs.writeFileSync(`${file}.tmp`, JSON.stringify(data));
fs.renameSync(`${file}.tmp`, file);
console.log(`Created ${role} "${name}" (${email})${args.hub ? ` and assigned hub ${args.hub}` : ""}. Now start the server.`);
