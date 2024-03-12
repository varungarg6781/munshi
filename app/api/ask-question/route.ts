import { Configuration, OpenAIApi } from "openai-edge";
import { getContext } from "@/lib/context";
import { db } from "@/lib/db";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { voiceMessages } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { fetchActiveChatVersion } from "@/lib/db/dbUtils";

const openai = new OpenAIApi(
  new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  })
);

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

    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: messagesForOpenAI,
      stream: true,
    });

    const stream = OpenAIStream(response, {
      onStart: async () => {
        // TODO: also seed the activechatId here
        // save user question into db
        await db.insert(voiceMessages).values({
          userId: String(userId),
          content: question,
          role: "user_questioner",
          chatVersion: activeChatVersion,
        });
      },
      onCompletion: async (completion) => {
        // save ai message into db
        await db.insert(voiceMessages).values({
          userId: String(userId),
          content: completion,
          role: "system",
          chatVersion: activeChatVersion,
        });
      },
    });
    return new StreamingTextResponse(stream);
  } catch (error) {}
}
