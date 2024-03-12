import { Pinecone } from "@pinecone-database/pinecone";
import { convertToAscii } from "./utils";
import { getEmbeddings } from "./embeddings";

export async function getMatchesFromEmbeddings(
  embeddings: number[],
  index: string
) {
  try {
    const client = new Pinecone({
      //   environment: process.env.PINECONE_ENVIRONMENT!,
      apiKey: process.env.PINECONE_API_KEY!,
    });
    const pineconeIndex = await client.index("chatpdf");
    // console.log("Got pineconeIndex ", pineconeIndex);
    const namespace = pineconeIndex.namespace(convertToAscii(index));
    // console.log("namespace is -", namespace);
    const queryResult = await namespace.query({
      topK: 5,
      vector: embeddings,
      includeMetadata: true,
    });
    // console.log("Query Result", queryResult);
    return queryResult.matches || [];
  } catch (error) {
    console.log("error querying embeddings", error);
    throw error;
  }
}

export async function getContext(query: string, index: string) {
  const queryEmbeddings = await getEmbeddings(query);
  // console.log("query embeddings -", queryEmbeddings);
  const matches = await getMatchesFromEmbeddings(queryEmbeddings, index);

  const qualifyingDocs = matches.filter(
    (match) => match.score && match.score > 0.7
  );

  type Metadata = {
    text: string;
    pageNumber: number;
  };

  let docs = qualifyingDocs.map((match) => (match.metadata as Metadata).text);
  // 5 vectors
  return docs.join("\n").substring(0, 3000);
}
