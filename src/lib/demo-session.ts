import { cookies } from "next/headers";
import { getRepositories } from "./repositories";
import type { User } from "./domain/types";

/**
 * "Demo view": choose which SAMPLE user you are looking as.
 * This is NOT authentication. It exists so the buyer, vendor and operator screens can be
 * demonstrated before real accounts exist (Stage 10), and it is removed when sign-in arrives.
 */
export const DEMO_USER_COOKIE = "anna_demo_user";
const DEFAULT_DEMO_USER = "u-b3";

export async function getDemoUser(): Promise<User> {
  const { users } = getRepositories();
  const id = (await cookies()).get(DEMO_USER_COOKIE)?.value;
  return (id ? await users.getById(id) : null) ?? (await users.getById(DEFAULT_DEMO_USER))!;
}

/** The vendor that new demo listings are created under. */
export async function getDemoSeller(): Promise<User | undefined> {
  const me = await getDemoUser();
  if (me.role === "vendor") return me;
  return (await getRepositories().users.listByRole("vendor"))[0];
}
