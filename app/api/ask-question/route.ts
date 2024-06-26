// import { Configuration, OpenAIApi } from "openai-edge";
import { getContext } from "@/lib/context";
import { db } from "@/lib/db";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { voiceMessages } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { fetchActiveChatVersion } from "@/lib/db/dbUtils";

import OpenAIApi from "openai";

enum Role {
  User = "user",
  System = "system",
}

const openai = new OpenAIApi({ apiKey: process.env.OPENAI_API_KEY });

// const openai = new OpenAI();
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

export async function POST(req: Request) {
  try {
    console.log("Entering ask question component");

    const { question, userId } = await req.json();
    const activeChatVersion = await fetchActiveChatVersion(userId);

    const _voiceMessages = await db
      .select()
      .from(voiceMessages)
      .where(
        (eq(voiceMessages.userId, String(userId)),
        eq(voiceMessages.chatVersion, activeChatVersion))
      );

    if (_voiceMessages.length == 0) {
      return NextResponse.json(
        { error: "No voice chats found" },
        { status: 404 }
      );
    }

    const messagesForOpenAI = _voiceMessages
      .filter(
        (msg) => msg.role === "user_listener" || msg.role === "user_questioner"
      )
      .map((msg) => ({
        role: Role.User,
        content: msg.content,
      }));

    const context = await getContext(question, String(userId));

    // console.log("context from pinecone - ", context);

    messagesForOpenAI.push({
      role: Role.System,
      content: `START CONTEXT BLOCK
        ${context}
        END OF CONTEXT BLOCK
        Please provide information or answer the user's question based on the context provided above. 
        Do not add any extra knowledge from yourself
        Answer in 1-2 sentences only`,
    });

    console.log("messagesForOpenAI is -", messagesForOpenAI);
    let fullMessage;
    try {
      const completionResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: messagesForOpenAI,
      });
      // Adjusted based on the actual structure of 'completionResponse'
      fullMessage = completionResponse.choices[0].message.content;
    } catch (error) {
      console.error("Error in chat completion:", error);
    }

    console.log("Return from Open AI is -", fullMessage);
    if (!fullMessage) {
    }

    await db.insert(voiceMessages).values({
      userId: String(userId),
      content: question,
      role: "user_questioner",
      chatVersion: activeChatVersion,
    });

    if (!fullMessage) {
      throw new Error("No Response from Open AI");
    }

    await db.insert(voiceMessages).values({
      userId: String(userId),
      content: fullMessage,
      role: "system",
      chatVersion: activeChatVersion,
    });

    const voice = "echo";
    const base64Audio = await createAudio(fullMessage, voice);
    console.log("Response from questions api -", fullMessage);
    return NextResponse.json(
      {
        data: {
          data: base64Audio,
          contentType: "audio/mp3",
        },
      },
      { status: 200 }
    );
    // return new StreamingTextResponse(stream);
  } catch (error) {
    console.error("Error in POST function:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
