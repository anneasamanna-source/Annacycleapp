import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { demoRepositories as repo, resetDemoStore } from "@/lib/repositories/demo";
import { validateLogin, validateRegister } from "@/lib/validation/auth";
import { hashPassword as scriptHash, verifyPassword as scriptVerify } from "../scripts/password.mjs";

let dir: string, file: string;
const save = { mode: process.env.ANNA_DATA_MODE, file: process.env.ANNA_DATA_FILE };
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "anna-"));
  file = path.join(dir, "anna.json");
  process.env.ANNA_DATA_MODE = "local";
  process.env.ANNA_DATA_FILE = file;
  resetDemoStore();
});
afterEach(() => {
  process.env.ANNA_DATA_MODE = save.mode; process.env.ANNA_DATA_FILE = save.file;
  if (save.mode === undefined) delete process.env.ANNA_DATA_MODE;
  if (save.file === undefined) delete process.env.ANNA_DATA_FILE;
  resetDemoStore(); fs.rmSync(dir, { recursive: true, force: true });
});
const reg = (email: string, role: "vendor" | "buyer" = "buyer") =>
  repo.auth.register({ name: "Test", email, password: "correct-horse", role, district: "Hooghly" });

describe("passwords", () => {
  it("are salted and never stored in plain text", () => {
    const a = hashPassword("secret-pass"), b = hashPassword("secret-pass");
    expect(a).not.toBe(b); expect(a).not.toContain("secret-pass");
    expect(verifyPassword("secret-pass", a)).toBe(true);
    expect(verifyPassword("wrong", a)).toBe(false);
    expect(verifyPassword("x", "garbage")).toBe(false);
  });
  it("the website and the create-user script produce compatible hashes", () => {
    expect(verifyPassword("pw-12345678", scriptHash("pw-12345678"))).toBe(true);
    expect(scriptVerify("pw-12345678", hashPassword("pw-12345678"))).toBe(true);
  });
});

describe("accounts", () => {
  it("register, sign in, and reject wrong passwords and duplicate emails", async () => {
    const r = await reg("Ana@Example.com");
    expect(r.ok && r.user.role).toBe("buyer");
    expect(await reg("ana@example.com")).toEqual({ ok: false, error: "emailTaken" });
    expect(await repo.auth.verify(" ANA@example.com ", "correct-horse")).toMatchObject({ ok: true });
    expect(await repo.auth.verify("ana@example.com", "nope")).toEqual({ ok: false, error: "badLogin" });
    expect(await repo.auth.verify("nobody@example.com", "nope")).toEqual({ ok: false, error: "badLogin" }); // same message
  });
  it("locks out after repeated failures, even for the right password", async () => {
    await reg("lock@example.com");
    for (let i = 0; i < 5; i++) await repo.auth.verify("lock@example.com", "bad");
    expect(await repo.auth.verify("lock@example.com", "correct-horse")).toEqual({ ok: false, error: "tooMany" });
  });
  it("sessions work, store only a hash, and end on sign-out", async () => {
    const u = await reg("sess@example.com"); if (!u.ok) throw new Error();
    const { token } = await repo.auth.createSession(u.user.id);
    expect((await repo.auth.userForSession(token))?.id).toBe(u.user.id);
    expect(fs.readFileSync(file, "utf8")).not.toContain(token);
    expect(await repo.auth.userForSession("forged")).toBeNull();
    await repo.auth.deleteSession(token);
    expect(await repo.auth.userForSession(token)).toBeNull();
  });
  it("sign-up can only create vendors and buyers", () => {
    const base = { name: "A", email: "a@b.co", password: "longenough", district: "Hooghly" };
    expect(validateRegister({ ...base, role: "admin" })).toMatchObject({ ok: false, errors: { role: "roleInvalid" } });
    expect(validateRegister({ ...base, role: "hub_operator" }).ok).toBe(false);
    expect(validateRegister({ ...base, role: "buyer" }).ok).toBe(true);
    expect(validateRegister({ ...base, role: "buyer", password: "short" })).toMatchObject({ errors: { password: "passwordShort" } });
    expect(validateRegister({ ...base, role: "buyer", email: "nope" })).toMatchObject({ errors: { email: "emailInvalid" } });
    expect(validateLogin({ email: "", password: "" })).toMatchObject({ ok: false });
  });
});

describe("saved data survives a restart", () => {
  it("keeps accounts, listings, reservations and id counters", async () => {
    const v = await reg("vendor@example.com", "vendor"); const b = await reg("buyer@example.com");
    if (!v.ok || !b.ok) throw new Error();
    const l = await repo.listings.create({
      sellerId: v.user.id, cropKey: "carrot", produceName: "Carrots", category: "root", totalKg: 50, displayUnit: "kg", askingPricePerKg: 30,
      place: { district: "Hooghly", area: "x" }, reportedCondition: "good", collectionFrom: new Date().toISOString(),
      collectionUntil: new Date(Date.now() + 86_400_000).toISOString(), recoverBy: new Date(Date.now() + 2 * 86_400_000).toISOString(),
    });
    expect(l.isDemo).toBe(false); // real record, not sample
    expect(await repo.reservations.reserve({ listingId: l.id, buyerId: b.user.id, quantityKg: 20 })).toMatchObject({ ok: true });
    const { token } = await repo.auth.createSession(b.user.id);

    resetDemoStore(); // simulate stopping and restarting the server
    const back = await repo.listings.getById(l.id);
    expect([back?.reservedKg, back?.availableKg]).toEqual([20, 30]);
    expect(await repo.auth.verify("buyer@example.com", "correct-horse")).toMatchObject({ ok: true });
    expect((await repo.auth.userForSession(token))?.id).toBe(b.user.id);
    const next = await repo.listings.create({ ...back!, sellerId: v.user.id } as never);
    expect(next.id).not.toBe(l.id); // counters continued, no id reused
  });
  it("refuses to overwrite a file it can't read", async () => {
    fs.writeFileSync(file, "{ not json");
    await expect(repo.listings.list()).rejects.toThrow(/Could not read/);
    expect(fs.readFileSync(file, "utf8")).toBe("{ not json"); // untouched
  });
  it("demo mode writes nothing to disk", async () => {
    process.env.ANNA_DATA_MODE = "demo"; resetDemoStore();
    await reg("demo@example.com");
    expect(fs.existsSync(file)).toBe(false);
  });
});

describe("create-user script", () => {
  it("creates a hub operator who can sign in and is assigned the hub", async () => {
    await repo.listings.list(); // creates the data file
    execFileSync("node", ["scripts/create-user.mjs", "--name", "Rina", "--email", "rina@example.com", "--role", "hub_operator", "--hub", "h-3", "--password", "operator-pass-1"], { env: { ...process.env } });
    resetDemoStore();
    const res = await repo.auth.verify("rina@example.com", "operator-pass-1");
    expect(res.ok && res.user.role).toBe("hub_operator");
    expect((await repo.hubs.getById("h-3"))?.operatorId).toBe(res.ok ? res.user.id : "");
  });
  it("rejects weak passwords and unknown hubs", async () => {
    await repo.listings.list();
    const run = (...a: string[]) => { try { execFileSync("node", ["scripts/create-user.mjs", ...a], { env: { ...process.env }, stdio: "pipe" }); return "ok"; } catch { return "failed"; } };
    expect(run("--name", "X", "--email", "x@example.com", "--role", "admin", "--password", "short")).toBe("failed");
    expect(run("--name", "X", "--email", "x@example.com", "--role", "hub_operator", "--hub", "nope", "--password", "long-enough-1")).toBe("failed");
    expect(run("--name", "X", "--email", "x@example.com", "--role", "king", "--password", "long-enough-1")).toBe("failed");
  });
});
