// QuestionAskerComponent.jsx
"use client";
import { useEffect, useState, useRef } from "react";
import { Mic, Pause } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { useUser } from "@clerk/nextjs";

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export default function QuestionAskerComponent() {
  const { user } = useUser();
  const userId = user?.id;
  const [isRecording, setIsRecording] = useState(false);
  const [questionTranscripts, setQuestionTranscripts] = useState<string[]>([]);

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startRecording = () => {
    setIsRecording(true);
    const SpeechRecognition =
      window.webkitSpeechRecognition || window.SpeechRecognition;
    // Direct assignment after instantiation should not trigger the TypeScript error
    recognitionRef.current = new SpeechRecognition();
    if (recognitionRef.current) {
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            interimTranscript += event.results[i][0].transcript + " ";
          }
        }
        setQuestionTranscripts((prevTranscripts) => [
          ...prevTranscripts,
          interimTranscript.trim(),
        ]);
      };

      recognitionRef.current.start();
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSubmitQuestion = async () => {
    const fullQuestion = questionTranscripts.join(" ");
    try {
      if (!userId) {
        toast.error("You must be logged in to ask a question.");
        return;
      }
      const response = await axios.post(
        "/api/ask-question",
        {
          question: fullQuestion,
          userId,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Message from AI -", response.data);
      toast.success("Question processed successfully!");
    } catch (error) {
      console.error("Question processing failed", error);
      toast.error("Question processing failed");
    }
  };

  return (
    <div className="p-2 bg-white rounded-xl">
      <div className="border-dashed border-2 rounded-xl p-4 cursor-pointer bg-gray-50 flex justify-center items-center flex-col">
        {isRecording ? (
          <button
            onClick={stopRecording}
            className="flex items-center justify-center hover:bg-red-100 rounded-full w-20 h-20 focus:outline-none"
          >
            <Pause className="w-10 h-10 text-blue-500" />
          </button>
        ) : (
          <button
            onClick={startRecording}
            className="flex items-center justify-center hover:bg-blue-100 rounded-full w-20 h-20 focus:outline-none"
          >
            <Mic className="w-10 h-10 text-blue-500" />
          </button>
        )}
        <textarea
          value={questionTranscripts.join(" ")}
          readOnly
          className="w-full mt-4 p-2 border overflow-y-auto h-24"
          placeholder="Your question will appear here..."
        ></textarea>
        <button
          onClick={handleSubmitQuestion}
          className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Ask Question
        </button>
      </div>
    </div>
  );
}
