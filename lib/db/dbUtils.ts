// /lib/dbUtils.js

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function fetchActiveChatVersion(userId: any) {
  //   Fetch the current active chat version from users table based on userId
  const userChatVersionResult = await db
    .select()
    .from(users)
    .where(eq(users.userId, String(userId)))
    .execute();

  const activeChatVersion =
    userChatVersionResult.length > 0
      ? userChatVersionResult[0].activeChatVersion
      : null;

  if (activeChatVersion === undefined || activeChatVersion == null) {
    throw new Error("User chat version not found");
  }

  return activeChatVersion;
}

export async function getPineconeNamespace(userId: any) {
  const activeChatVersion = await fetchActiveChatVersion(userId);
  return `user-${userId}-chat-${activeChatVersion}`;
}
