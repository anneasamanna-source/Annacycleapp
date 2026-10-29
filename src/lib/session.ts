import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDemoSeller, getDemoUser } from "./demo-session";
import type { User } from "./domain/types";
import { getRepositories } from "./repositories";

/** demo = "Viewing as" dropdown with sample users. local = real accounts with sign-in. */
export const authMode = (): "demo" | "local" => (process.env.ANNA_DATA_MODE === "local" ? "local" : "demo");
export const SESSION_COOKIE = "anna_session";

/** The person using the site, or null if nobody is signed in (local mode only). */
export async function getViewer(): Promise<User | null> {
  if (authMode() === "demo") return getDemoUser();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? getRepositories().auth.userForSession(token) : null;
}

export async function requireViewer(): Promise<User> {
  const user = await getViewer();
  if (!user) redirect("/login");
  return user;
}

/** Who a new listing belongs to. */
export async function getListingSeller(): Promise<User | undefined> {
  if (authMode() === "demo") return getDemoSeller();
  const user = await getViewer();
  return user?.role === "vendor" ? user : undefined;
}
