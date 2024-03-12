import { User } from "@clerk/nextjs/server";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function convertToAscii(inputString: string) {
  // remove non ascii characters
  const sanitizedString = inputString
    .replace(/[^\x20-\x7E]+/g, "") // Remove non-ASCII
    .replace(/\//g, "_") // Replace slashes
    .replace(/[\s.-]/g, "");
  return sanitizedString;
}

export async function checkAndInsertUser(user: User) {
  // Assuming user.id is the Clerk user ID and you're using it as userId in your schema
  const clerkUserId = user.id;
  const emailAddress = user.emailAddresses[0].emailAddress; // Assuming the first email is the primary one

  // Check if the user exists in your database
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.userId, clerkUserId))
    .execute();

  // If the user doesn't exist, insert them
  if (existingUser.length === 0) {
    await db
      .insert(users)
      .values({
        userId: clerkUserId,
        emailAddress: emailAddress,
        activeChatVersion: 1, // we want to set this to 1 for new users
        // Include other fields as necessary
      })
      .execute();
    console.log("User inserted into database");
  } else {
    console.log("User already exists in the database");
  }
}
