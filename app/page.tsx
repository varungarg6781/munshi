import { Button } from "@/components/ui/button";
import { UserButton, auth, clerkClient } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight, LogIn } from "lucide-react";
import MicrophoneComponent from "@/components/MicrophoneComponent";
import QuestionAskerComponent from "@/components/QuestionAskerComponent";
import { checkAndInsertUser } from "@/lib/utils";
import VoiceAssistant from "@/components/VoiceAssistant";

export default async function Home() {
  const { userId } = await auth();
  const isAuth = !!userId;
  // const isPro = await checkSubscription();

  if (userId) {
    const user = await clerkClient.users.getUser(userId);
    // await checkAndInsertUser(user);
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
              <div className="w-full ">
                <VoiceAssistant />
              </div>
              <div className="w-full h-5 "></div>
              {/* <div className="w-full flex flex-col">
                <MicrophoneComponent />
              </div>
              <div className="w-full flex flex-col">
                <QuestionAskerComponent />
              </div> */}
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
