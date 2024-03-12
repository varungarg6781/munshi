// 0. Import Dependencies
import OpenAI from "openai";
import dotenv from "dotenv";
import { OpenAI as LangchainOpenAI } from "@langchain/openai";
import { Ollama } from "@langchain/community/llms/ollama";
import api from "api";
import { NextResponse } from "next/server";

// 1. Initialize the Perplexity SDK
const sdk = api("@pplx/v0#rht322clnm9gt25");

// 2. Configure environment variables
dotenv.config();
sdk.auth(process.env.PERPLEXITY_API_KEY);

// 3. Define the response data structure
interface ResponseData {
  data: string;
  contentType: string;
  model: string;
}

// 4. Initialize the OpenAI instance
const openai = new OpenAI();

// 5. Function to create audio from text
async function createAudio(
  fullMessage: string,
  voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer"
) {
  const mp3 = await openai.audio.speech.create({
    model: "tts-1",
    voice: voice,
    input: fullMessage,
  });
  const buffer = Buffer.from(await mp3.arrayBuffer());
  return buffer.toString("base64");
}

// 6. HTTP POST handler function
export async function POST(req: Request, res: Response) {
  const body = await req.json();
  const { message } = body;
  // let message = body.message.toLowerCase();
  // let modelName = body.model || "gpt";

  // 8. Initialize variables for messages and audio
  let introMessage = "",
    base64Audio,
    voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" = "echo",
    gptMessage,
    fullMessage;

  // 9. Common prompt for all models
  const commonPrompt =
    "Be precise and concise, never respond in more than 1-2 sentences! " +
    message;

  // 10. Handle different model cases

  const llm = new LangchainOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "gpt-4",
  });
  gptMessage = await llm.invoke(commonPrompt);
  introMessage = "GPT-4 here, ";
  voice = "echo";

  // 18. Compile the full message and create the audio
  fullMessage = introMessage + gptMessage;
  base64Audio = await createAudio(fullMessage, voice);

  // 19. Return the response
  // return Response.json({
  //   data: base64Audio,
  //   contentType: "audio/mp3",
  //   model: modelName,
  // });

  return NextResponse.json(
    {
      data: {
        data: base64Audio,
        contentType: "audio/mp3",
      },
    },
    { status: 200 }
  );
}
