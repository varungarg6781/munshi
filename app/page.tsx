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
    await checkAndInsertUser(user);
  }

  return (
    <div className="w-screen min-h-screen bg-gradient-to-r from-rose-50 to-teal-100">
      {/* Position UserButton at the top right */}
      <div className="absolute top-0 right-0 p-4">
        <UserButton afterSignOutUrl="/" />
      </div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-6 md:p-12 ">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center">
            <h2 className="text-4xl md:text-5xl font-semibold whitespace-nowrap">
              Just converse with yourself
            </h2>
            {/* <UserButton afterSignOutUrl="/" /> */}
          </div>

          <p className="max-w-xl mt-1 text-lg text-slate-600">
            Click on any below to start
          </p>
        </div>
        <div className="flex flex-col justify-center items-center mt-4">
          {isAuth ? (
            <>
              <div className="w-full ">
                <VoiceAssistant />
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
      {/* <div className="fixed bottom-0 right-0 mb-4 mr-4 text-sm text-gray-600">
        Made with love by
        <a
          href="https://yourlink.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          Varun
        </a>
      </div> */}
    </div>
  );
}
