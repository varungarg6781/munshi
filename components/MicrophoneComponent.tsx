"use client";
import { useEffect, useState, useRef } from "react";
import { Mic, Pause } from "lucide-react";
import { useRouter } from "next/navigation"; // Import useRouter at the top
import { jsPDF } from "jspdf";
import { uploadToS3 } from "@/lib/s3";
import toast from "react-hot-toast";
import axios from "axios";

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
    const fullTranscript = transcripts.join("");
    const doc = new jsPDF();

    // Define the maximum width for text lines
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20; // Define a margin
    const maxWidth = pageWidth - margin * 2; // Calculate max width of the text

    // Use splitTextToSize to split the transcript into lines that fit within the max width
    const lines = doc.splitTextToSize(fullTranscript, maxWidth);

    // Add the text to the PDF, starting at position (x, y) = (margin, 20)
    doc.text(lines, margin, 20);

    // Generate a unique file name with current date
    const date = new Date();
    const dateString = date.toISOString().split("T")[0]; // Format: YYYY-MM-DD
    const uniqueIdentifier = Date.now(); // or any other unique identifier
    const fileName = `transcript_${dateString}_${uniqueIdentifier}.pdf`;

    const pdfBlob = doc.output("blob");
    const file = new File([pdfBlob], fileName, { type: "application/pdf" });

    // Use the existing upload logic
    try {
      const data = await uploadToS3(file);
      if (!data?.file_key || !data.file_name) {
        toast.error("Something went wrong with the upload");
        return;
      }
      console.log("Upload to S3 completed");

      // Assuming you have an endpoint setup to handle chat creation post-upload
      const response = await axios.post("/api/create-chat", {
        file_key: data.file_key,
        file_name: data.file_name,
      });

      const { chat_id } = response.data;
      toast.success("Chat created!");
      router.push(`/chat/${chat_id}`);
    } catch (error) {
      console.error("Upload failed", error);
      toast.error("Failed to create chat");
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
      </div>
    </div>
  );
}
