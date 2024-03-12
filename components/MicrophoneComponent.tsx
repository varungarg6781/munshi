"use client";
import { useEffect, useState, useRef } from "react";
import { Mic, Pause } from "lucide-react";
import { useRouter } from "next/navigation"; // Import useRouter at the top
import toast from "react-hot-toast";
import axios from "axios";
import { voiceMessages } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { useUser } from "@clerk/nextjs";

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export default function MicrophoneComponent() {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  // Explicitly define the state type as string[]
  const [transcripts, setTranscripts] = useState<string[]>([]);
  // Define the ref type more specifically
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const router = useRouter();
  const { user } = useUser();
  const userId = user?.id;

  const startRecording = () => {
    setIsRecording(true);
    const SpeechRecognition =
      window.webkitSpeechRecognition || window.SpeechRecognition;
    // Direct assignment after instantiation should not trigger the TypeScript error
    recognitionRef.current = new SpeechRecognition();
    if (recognitionRef.current) {
      // Explicitly check for null before accessing properties
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            interimTranscript += event.results[i][0].transcript + " ";
          }
        }
        setTranscripts((prevTranscripts) => [
          ...prevTranscripts,
          interimTranscript.trim(),
        ]);
      };

      recognitionRef.current.start();
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      // This check should satisfy TypeScript's concern
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  useEffect(() => {
    return () => {
      // Check for null before calling stop
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleToggleRecording = () => {
    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  };

  const handleSubmit = async () => {
    const fullTranscript = transcripts.join(" ");
    // Send the transcript directly to the backend for processing
    try {
      console.log("fullTransscript -", fullTranscript);
      const response = await axios.post(
        "/api/process-voice",
        {
          transcript: fullTranscript,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const { success, message } = response.data;
      if (success) {
        toast.success("Voice processed successfully!");
      } else {
        toast.error(message || "Failed to process voice");
      }
    } catch (error) {
      console.error("Processing failed", error);
      toast.error("Processing failed");
    }
  };

  const handleRefreshChat = async () => {
    try {
      // Update the user's activeChatVersion in the database
      const response = await axios.post(
        "/api/update-chat-version",
        {
          userId,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const { success } = response.data;
      if (success) {
        toast.success("Chat refreshed successfully!");
      } else {
        toast.error("Chat can't be refreshed");
      }

      // Optionally, perform any additional actions upon successful update
    } catch (error) {
      console.error("Failed to refresh chat", error);
      toast.error("Failed to refresh chat");
    }
  };

  return (
    <div className="p-2 bg-white rounded-xl">
      <div className="border-dashed border-2 rounded-xl p-4 cursor-pointer bg-gray-50 flex justify-center items-center flex-col">
        {isRecording ? (
          <button
            onClick={handleToggleRecording}
            className="flex items-center justify-center hover:bg-red-100 rounded-full w-20 h-20 focus:outline-none"
          >
            <Pause className="w-10 h-10 text-blue-500" />
          </button>
        ) : (
          <button
            onClick={handleToggleRecording}
            className="flex items-center justify-center hover:bg-blue-100 rounded-full w-20 h-20 focus:outline-none"
          >
            <Mic className="w-10 h-10 text-blue-500" />
          </button>
        )}
        <p className="text-sm text-slate-400">
          Or Just record your Voice Notes and start chatting{" "}
        </p>
        <textarea
          value={transcripts.join("")}
          readOnly
          className="w-full mt-4 p-2 border overflow-y-auto h-24" // Set a fixed height for the textarea
          placeholder="Your speech will appear here..."
        ></textarea>
        <button
          onClick={handleSubmit}
          className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Submit
        </button>
        <button
          onClick={handleRefreshChat}
          className="mt-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Refresh Chat
        </button>
      </div>
    </div>
  );
}
