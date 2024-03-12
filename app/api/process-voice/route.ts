import { storeTextInPinecone } from "@/lib/pinecone";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { users, voiceMessages } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { fetchActiveChatVersion } from "@/lib/db/dbUtils";

export async function POST(req: Request, res: Response) {
  const { userId } = await auth();
  //   console.log("NextApiRequest is -", req.body);
  console.log("User Id  -", userId);
  const body = await req.json();
  const { transcript } = body;
  try {
    // Fetch the current active chat version from users table based on userId
    const activeChatVersion = await fetchActiveChatVersion(userId);

    await db.insert(voiceMessages).values({
      userId: String(userId),
      content: transcript,
      role: "user_listener",
      chatVersion: activeChatVersion,
    });
    await storeTextInPinecone(transcript, String(userId));
    return NextResponse.json(
      {
        success: true,
      },
      { status: 200 }
    );
    // res.status(200).json({ success: true });
  } catch (error) {
    console.error("Failed to process voice", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
