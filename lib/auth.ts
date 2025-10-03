import { currentUser } from "@clerk/nextjs/server";
import type { User } from "@clerk/nextjs/server";

export class OwnerAccessError extends Error {
  constructor(message = "Owner access required") {
    super(message);
    this.name = "OwnerAccessError";
  }
}

type Metadata = Record<string, unknown> | undefined | null;

export function userHasOwnerRole(user: User | null | undefined): boolean {
  const metadata = user?.publicMetadata as Metadata;
  const role = metadata && typeof metadata["platformRole"] === "string" ? metadata["platformRole"] : null;
  return role === "owner";
}

export async function requireOwner(): Promise<User> {
  const user = await currentUser();
  if (!userHasOwnerRole(user)) {
    throw new OwnerAccessError();
  }
  return user!;
}

export async function getOwnerRole(): Promise<{ user: User | null; platformRole: string | null }> {
  const user = await currentUser();
  const metadata = user?.publicMetadata as Metadata;
  const role = metadata && typeof metadata["platformRole"] === "string" ? (metadata["platformRole"] as string) : null;
  return { user, platformRole: role };
}
