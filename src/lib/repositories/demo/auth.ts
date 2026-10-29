import { createHash, randomBytes, randomUUID } from "node:crypto";
import { hashPassword, verifyPassword } from "../../auth/password";
import type { AuthRepository } from "../interfaces";
import { persist, store } from "./store";

const SESSION_DAYS = 30;
const MAX_FAILURES = 5;
const WINDOW_MS = 10 * 60_000;
const DUMMY_HASH = hashPassword("not-a-real-password"); // so unknown emails take as long as wrong passwords
const failures = new Map<string, { count: number; resetAt: number }>();

const normEmail = (e: string) => e.trim().toLowerCase();
const sha = (t: string) => createHash("sha256").update(t).digest("hex");

export const localAuth: AuthRepository = {
  async register({ name, email, password, role, district }) {
    const s = store();
    const e = normEmail(email);
    if (s.credentials.some((c) => c.email === e)) return { ok: false, error: "emailTaken" };
    const user = { id: `u-${randomUUID().slice(0, 8)}`, name: name.trim(), role, district, isDemo: false };
    s.users.push(user);
    s.credentials.push({ userId: user.id, email: e, passwordHash: hashPassword(password) });
    persist();
    return { ok: true, user };
  },

  async verify(email, password) {
    const e = normEmail(email);
    const now = Date.now();
    const f = failures.get(e);
    if (f && f.resetAt > now && f.count >= MAX_FAILURES) return { ok: false, error: "tooMany" };

    const s = store();
    const cred = s.credentials.find((c) => c.email === e);
    const good = verifyPassword(password, cred?.passwordHash ?? DUMMY_HASH) && !!cred;
    if (!good) {
      const live = f && f.resetAt > now ? f : { count: 0, resetAt: now + WINDOW_MS };
      failures.set(e, { count: live.count + 1, resetAt: live.resetAt });
      return { ok: false, error: "badLogin" };
    }
    failures.delete(e);
    const user = s.users.find((u) => u.id === cred!.userId);
    return user ? { ok: true, user } : { ok: false, error: "badLogin" };
  },

  async createSession(userId) {
    const s = store();
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000).toISOString();
    s.sessions = s.sessions.filter((x) => x.expiresAt > new Date().toISOString()); // drop expired
    s.sessions.push({ tokenHash: sha(token), userId, expiresAt }); // only the hash is stored
    persist();
    return { token, expiresAt };
  },

  async userForSession(token) {
    const s = store();
    const row = s.sessions.find((x) => x.tokenHash === sha(token));
    if (!row || row.expiresAt <= new Date().toISOString()) return null;
    return s.users.find((u) => u.id === row.userId) ?? null;
  },

  async deleteSession(token) {
    const s = store();
    s.sessions = s.sessions.filter((x) => x.tokenHash !== sha(token));
    persist();
  },
};
