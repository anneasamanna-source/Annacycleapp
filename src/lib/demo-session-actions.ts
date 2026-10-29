"use server";

import { cookies } from "next/headers";
import { DEMO_USER_COOKIE } from "./demo-session";
import { getRepositories } from "./repositories";

export async function setDemoUser(id: string) {
  if (!(await getRepositories().users.getById(id))) return;
  (await cookies()).set(DEMO_USER_COOKIE, id, { path: "/", maxAge: 60 * 60 * 24 * 30, sameSite: "lax" });
}
