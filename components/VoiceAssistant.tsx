"use client";
import axios from "axios";
import { useEffect, useState, useRef } from "react";

//2. Extend Window interface for webkitSpeechRecognition
declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

//3. Main functional component declaration
export default function VoiceAssistant() {
  //4. State hooks for various functionalities
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>("");
  const [model, setModel] = useState<string>("");
  const [response, setResponse] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  //5. Ref hooks for speech recognition and silence detection
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);

  //6. Determine CSS class for model display based on state
  const getModelClassName = (model: string): string =>
    model === model && isPlaying ? " prominent-pulse" : "";

  //7. Asynchronous function to handle backend communication
  const sendToBackend = async (message: string): Promise<void> => {
    setIsLoading(true);

    try {
      //7.1 Stop recording before sending data
      stopRecording();
      //7.2 Send POST request to backend
      // const response = await fetch("/api/chat", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ message, model: modelKeyword }),
      // });

      const response = await axios.post(
        "/api/chat",
        {
          message: message,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      console.log("API response -", response.data);
      const { data } = response.data;
      // const data = await response.json();
      // console.log("Data retruned is -", data);
      //7.3 Check for response validity
      // if (!response.ok)
      //   throw new Error(`HTTP error! status: ${response.status}`);
      //7.4 Process and play audio response if available
      // const data = await response.json();
      // const data = responseData;
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
          if (data.model) setModel(data.model);
        };
      }
    } catch (error) {
      //7.5 Handle errors during data transmission or audio playback
      console.error("Error sending data to backend or playing audio:", error);
    }
    setIsLoading(false);
  };

  //8. Render individual model selection bubbles
  const renderModelBubble = (
    model: string,
    displayName: string,
    bgColor: string
  ): JSX.Element => (
    <div
      className={`flex flex-col items-center model-bubble text-center${getModelClassName(
        model
      )}`}
    >
      {isLoading && model === model && (
        <div className="loading-indicator"></div>
      )}
      <div
        className={`w-48 h-48 flex items-center justify-center ${bgColor} text-white rounded-full`}
      >
        {displayName}
      </div>
    </div>
  );

  //9. Process speech recognition results
  const handleResult = (event: any): void => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    let interimTranscript = "";
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      interimTranscript += event.results[i][0].transcript;
    }
    setTranscript(interimTranscript);
    silenceTimerRef.current = setTimeout(() => {
      sendToBackend(interimTranscript);
      setTranscript("");
    }, 2000);
  };

  //10. Initialize speech recognition
  const startRecording = () => {
    setIsRecording(true);
    setTranscript("");
    setResponse("");
    recognitionRef.current = new window.webkitSpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.onresult = handleResult;
    recognitionRef.current.onend = () => {
      setIsRecording(false);
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
    if (recognitionRef.current) recognitionRef.current.stop();
  };

  //13. Toggle recording state
  const handleToggleRecording = () => {
    if (!isRecording && !isPlaying) startRecording();
    else if (isRecording) stopRecording();
  };

  //14. Main component rendering method
  return (
    //14.1 Render recording and transcript status
    <main className="flex flex-col items-center bg-gray-100">
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
      {/* 14.2 Render model selection and recording button */}
      <div className="flex items-center justify-center  w-full">
        <div className="w-full">
          <div className="grid grid-cols-3 gap-8 mt-10">
            {renderModelBubble("gpt", "GPT-3.5", "bg-indigo-500")}

            <div className="flex flex-col items-center">
              <button
                onClick={handleToggleRecording}
                className={`m-auto flex items-center justify-center ${
                  isRecording ? "bg-red-500 prominent-pulse" : "bg-blue-500"
                } rounded-full w-48 h-48 focus:outline-none`}
              ></button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
