import { Button } from "@/components/ui/button";
import { UserButton, auth, clerkClient } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight, LogIn } from "lucide-react";
import FileUpload from "@/components/FileUpload";
// import { checkSubscription } from "@/lib/subscription";
// import SubscriptionButton from "@/components/SubscriptionButton";
import { db } from "@/lib/db";
import { chats, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import MicrophoneComponent from "@/components/MicrophoneComponent";
import QuestionAskerComponent from "@/components/QuestionAskerComponent";
import { User } from "@clerk/nextjs/server";

async function checkAndInsertUser(user: User) {
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

export default async function Home() {
  const { userId } = await auth();
  const isAuth = !!userId;
  // const isPro = await checkSubscription();

  if (userId) {
    const user = await clerkClient.users.getUser(userId);
    console.log("user details - ", user);
    await checkAndInsertUser(user);
    // check if entry exists in users table or not
    // if not then we will feed this entry in db
    // get user_id from clerk and email
  }

  // let firstChat;
  // if (userId) {
  //   firstChat = await db.select().from(chats).where(eq(chats.userId, userId));
  //   if (firstChat) {
  //     firstChat = firstChat[0];
  //   }
  // }

  return (
    <div className="w-screen min-h-screen bg-gradient-to-r from-rose-50 to-rose-100">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center">
            <h2 className="mr-2 text-5xl font-semibold">
              Chat with PDF Or Voice Notes
            </h2>
            <UserButton afterSignOutUrl="/" />
          </div>

          {/* <div className="flex flex-col mt-2">
            {isAuth && firstChat && (
              <>
                <Link href={`/chat/${firstChat.id}`}>
                  <Button>
                    Go to Chats <ArrowRight className="ml-2" />
                  </Button>
                </Link>
              </>
            )}
          </div> */}

          <p className="max-w-xl mt-1 text-lg text-slate-600">
            Drop in a document or effortlessly generate your own voice memos to
            converse with them later using our AI-powered platform
          </p>
        </div>
        <div className="flex flex-col justify-center items-center mt-4">
          {isAuth ? (
            <>
              {/* <div className="w-full ">
                <FileUpload />
              </div>
              <div className="w-full h-5 "></div> */}
              <div className="w-full flex flex-col">
                <MicrophoneComponent />
              </div>
              <div className="w-full flex flex-col">
                <QuestionAskerComponent />
              </div>
            </>
          ) : (
            <Link href="/sign-in">
              <Button>
                Login to get Started!
                <LogIn className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
