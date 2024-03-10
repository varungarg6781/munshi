import { OpenAIApi, Configuration } from "openai-edge";

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

console.log("Open AI KEY - ", process.env.OPENAI_API_KEY);

const openai = new OpenAIApi(config);

export async function getEmbeddings(text: string) {
  try {
    console.log("Text being sent to open ai - ", text);
    const response = await openai.createEmbedding({
      model: "text-embedding-ada-002",
      input: text.replace(/\n/g, " "),
    });
    const result = await response.json();
    // Check if data exists and has at least one element
    if (!result.data || result.data.length === 0) {
      throw new Error("No embeddings found in the response");
    }
    return result.data[0].embedding as number[];
  } catch (error) {
    console.log("error calling openai embeddings api", error);
    throw error;
  }
}
