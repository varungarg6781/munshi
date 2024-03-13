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

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    console.log(`Recording: ${isRecording}, Listening: ${isListening}`);
    // Adjust logic or add cleanup based on state changes here if necessary.
  }, [isRecording, isListening]);

  useEffect(() => {
    console.log(`Listening State Updated: ${isListening}`);
  }, [isListening]);

  //14. Main component rendering method
  return (
    //14.1 Render recording and transcript status
    <main className="flex flex-col items-center bg-gray-100">
      {/* 14.2 Render model selection and recording button */}
      <div className="flex items-center justify-center  w-full mt-10">
        {/* <div className="w-full">
          <div className="grid grid-cols-3 gap-8 mt-10">
            {renderModelBubble("gpt", "GPT-3.5", "bg-indigo-500")}

            <div className="flex flex-col items-center"> */}
        <button
          onClick={handleToggleRecording}
          className={`m-auto flex items-center justify-center ${
            isRecording ? "bg-red-500 prominent-pulse" : "bg-blue-500"
          } rounded-full w-48 h-48 focus:outline-none`}
        >
          Ask question
        </button>

        <button
          onClick={handleToggleListening}
          className={`m-auto flex items-center justify-center ${
            isRecording ? "bg-red-500 prominent-pulse" : "bg-blue-500"
          } rounded-full w-48 h-48 focus:outline-none`}
        >
          Listen to user
        </button>

        <button
          onClick={handleRefreshChat}
          className={`m-auto flex items-center justify-center ${
            isRecording ? "bg-red-500 prominent-pulse" : "bg-blue-500"
          } rounded-full w-48 h-48 focus:outline-none`}
        >
          Refresh chat
        </button>

        {/* </div>
          </div>
        </div> */}
      </div>
      {(isRecording || transcript || response) && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full m-auto p-4 bg-white">
          <div className="flex justify-center items-center w-full">
            <div className="text-center">
              <p className="text-xl font-bold">
                {isRecording ? "Listening" : ""}
              </p>
              {transcript && (
                <div className="p-2 h-full mt-4 text-center">
                  <p className="text-lg mb-0">{transcript}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
