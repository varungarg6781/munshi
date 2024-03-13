"use client";
import { useUser } from "@clerk/nextjs";
import axios from "axios";
import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";

//2. Extend Window interface for webkitSpeechRecognition
declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

//3. Main functional component declaration
export default function VoiceAssistant() {
  const { user } = useUser();
  const userId = user?.id;
  //4. State hooks for various functionalities
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>("");
  // const [model, setModel] = useState<string>("");
  const [response, setResponse] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // New state for listener functionality
  const [isListening, setIsListening] = useState<boolean>(false);
  const [activeButton, setActiveButton] = useState<string | null>(null); // "listener", "question", or null

  //5. Ref hooks for speech recognition and silence detection
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const isListeningRef = useRef(isListening);

  //7. Asynchronous function to handle backend communication
  const sendToBackend = async (message: string): Promise<void> => {
    setIsLoading(true);

    try {
      stopRecording();

      const response = await axios.post(
        "/api/ask-question",
        // {
        //   message: message,
        // },
        { question: message, userId },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      console.log("API response -", response.data);
      const { data } = response.data;

      if (data.data && data.contentType === "audio/mp3") {
        const audioSrc = `data:audio/mp3;base64,${data.data}`;
        const audio = new Audio(audioSrc);
        setIsPlaying(true);
        audio
          .play()
          .catch((error) => console.error("Error playing audio:", error));

        audio.onended = () => {
          setIsPlaying(false);
          startRecording();
        };
      }
    } catch (error) {
      //7.5 Handle errors during data transmission or audio playback
      console.error("Error sending data to backend or playing audio:", error);
    }
    setIsLoading(false);
  };

  //9. Process speech recognition results
  const handleResult = (event: any): void => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    let interimTranscript = "";
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      interimTranscript += event.results[i][0].transcript;
    }
    setTranscript(interimTranscript);
    silenceTimerRef.current = setTimeout(() => {
      if (isListeningRef.current) {
        console.log("entering listener component");
        sendToListenerEndpoint(interimTranscript);
      } else {
        console.log("entering question component");
        sendToBackend(interimTranscript);
      }
      setTranscript("");
    }, 2000);
  };

  //10. Initialize speech recognition
  const startRecording = (listening = false) => {
    setIsRecording(true);
    // if (isListening) {
    //   setIsListening(true);
    // }
    setIsListening(listening); // Directly set based on the argument
    setTranscript("");
    // setResponse("");
    console.log("Current state of listening, ", isListening);
    recognitionRef.current = new window.webkitSpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.onresult = handleResult;
    recognitionRef.current.onend = () => {
      setIsRecording(false);
      setIsListening(false); // Ensure listening is reset when stopped
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
    recognitionRef.current.start();
  };

  //11. Clean up with useEffect on component unmount
  useEffect(
    () => () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    },
    []
  );

  //12. Function to terminate speech recognition
  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false); // Reset listening state
    }
  };

  //13. Toggle recording state
  const handleToggleRecording = () => {
    setIsListening(false); // Ensure we're in listening mode.
    if (!isRecording && !isPlaying) {
      startRecording(false); // Explicitly not listening
    }
    // else if (isRecording) stopRecording();
    else stopRecording();
  };

  // New toggle for the "Listener" functionality
  const handleToggleListening = () => {
    setIsListening(true); // Ensure we're in listening mode.
    if (!isRecording && !isPlaying) {
      startRecording(true); // Explicitly listening
    } else {
      stopRecording();
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

  const sendToListenerEndpoint = async (transcript: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        "/api/process-voice",
        { transcript: transcript },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      const { success, message } = response.data;
      if (success) {
        toast.success("Voice processed successfully!");
      } else {
        toast.error(message || "Failed to process voice");
      }
    } catch (error) {
      console.error("Error sending data to listener endpoint:", error);
    }
    setIsLoading(false);
  };

  const handleToggleRecordingWithEffect = () => {
    setActiveButton("question"); // Set active button to question
    handleToggleRecording(); // Existing toggle recording function
  };

  const handleToggleListeningWithEffect = () => {
    setActiveButton("listener"); // Set active button to listener
    handleToggleListening(); // Existing toggle listening function
  };

  return (
    <main className="flex flex-col items-center p-4">
      <div className="flex items-stretch w-full mt-10">
        {" "}
        {/* Change to items-stretch for equal height */}
        <div className="flex-1 flex justify-center">
          {" "}
          {/* Wrap button in a flex container for centering */}
          <div className="text-center">
            {" "}
            {/* This div becomes the flex item */}
            <button
              onClick={handleToggleListeningWithEffect}
              className="flex flex-col items-center justify-center rounded-full p-4 focus:outline-none relative"
            >
              <img
                src="listen.svg"
                alt="Listen to User"
                className={`w-24 h-24 ${
                  isLoading && activeButton === "listener" ? "animate-spin" : ""
                }`}
              />
              <span className="mt-8 block">
                Hi, I can listen to all your queries
              </span>{" "}
              {/* Ensure block display */}
            </button>
            {isRecording && transcript && isListening && (
              <div className="mt-4 bg-white bg-opacity-50 p-2 rounded">
                <p className="text-lg mb-0">{transcript}</p>
              </div>
            )}
          </div>
        </div>
        <div className="mx-4 border-l-2 border-dotted border-gray-400"></div>{" "}
        {/* Dotted line */}
        <div className="flex-1 flex justify-center">
          {" "}
          {/* Apply same flex container strategy here */}
          <div className="text-center">
            {" "}
            {/* This div becomes the flex item */}
            <button
              onClick={handleToggleRecordingWithEffect}
              className="flex flex-col items-center justify-center rounded-full p-4 focus:outline-none relative"
            >
              <img
                src="question.svg"
                alt="Ask Question"
                className={`w-24 h-24 ${
                  isLoading && activeButton === "question" ? "animate-spin" : ""
                }`}
              />
              <span className="mt-8 block">Ask me anything about yourself</span>{" "}
              {/* Ensure block display */}
            </button>
            {isRecording && transcript && !isListening && (
              <div className="mt-4 bg-white bg-opacity-50 p-2 rounded">
                <p className="text-lg mb-0">{transcript}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <button
          onClick={handleRefreshChat}
          className="text-white font-bold py-2 px-4 rounded focus:outline-none"
          style={{ backgroundColor: "rgb(88 132 123)" }}
        >
          Refresh Chat
        </button>
      </div>
      <div className="mt-4 text-center">
        <span>Upload your context in form of pdf </span>
        <a href="" className="text-blue-600 hover:text-blue-800">
          here
        </a>
        .
      </div>
    </main>
  );
}
