// import { Configuration, OpenAIApi } from "openai-edge";
import { getContext } from "@/lib/context";
import { db } from "@/lib/db";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { voiceMessages } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { fetchActiveChatVersion } from "@/lib/db/dbUtils";

// const openai = new OpenAIApi(
//   new Configuration({
//     apiKey: process.env.OPENAI_API_KEY,
//   })
// );

// import Configuration from "openai";
import OpenAIApi from "openai";

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

    const messagesForOpenAI = _voiceMessages.map((msg) => {
      // Ensure the role is directly compatible with OpenAI's expected roles
      const roleForOpenAI: "user" | "system" =
        msg.role === "user_listener" || msg.role === "user_questioner"
          ? "user"
          : "system";

      return {
        role: roleForOpenAI,
        content: msg.content,
      };
    });

    const context = await getContext(question, String(userId));

    console.log("context from pinecone - ", context);

    messagesForOpenAI.push({
      role: "system",
      content: `AI assistant is a brand new, powerful, human-like artificial intelligence.
        The traits of AI include expert knowledge, helpfulness, cleverness, and articulateness.
        AI is a well-behaved and well-mannered individual.
        AI is always friendly, kind, and inspiring, and he is eager to provide vivid and thoughtful responses to the user.
        AI has the sum of all knowledge in their brain, and is able to accurately answer nearly any question about any topic in conversation.
        AI assistant is a big fan of Pinecone and Vercel.
        START CONTEXT BLOCK
        ${context}
        END OF CONTEXT BLOCK
        AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation.
        If the context does not provide the answer to question, the AI assistant will say, "I'm sorry, but I don't know the answer to that question".
        AI assistant will not apologize for previous responses, but instead will indicated new information was gained.
        AI assistant will not invent anything that is not drawn directly from the context.
        `,
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
