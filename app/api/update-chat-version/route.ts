import { db } from "@/lib/db";
import { fetchActiveChatVersion } from "@/lib/db/dbUtils";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request, res: Response) {
  try {
    const body = await req.json();
    const { userId } = body;

    // Fetch the current activeChatVersion for the user

    const currentActiveChatVersion = await fetchActiveChatVersion(userId);
    // Increament the currentActiveChatVersion
    const updatedVersion = currentActiveChatVersion + 1;

    // Update the user's activeChatVersion in the database
    await db
      .update(users)
      .set({
        activeChatVersion: updatedVersion,
      })
      .where(eq(users.userId, String(userId)))
      .execute();

    // Successfully updated
    return NextResponse.json(
      {
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to process voice", error);
    return NextResponse.json(
      { error: "Error updating chat version" },
      { status: 500 }
    );
  }
}
