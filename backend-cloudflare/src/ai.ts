import { matchDocuments } from "./supabase";
import type { ChatResponse, EmbeddingResponse, Env, RetrievedChunk } from "./types";

const DEFAULT_CHAT_MODEL = "@cf/meta/llama-3.1-8b-instruct";
const DEFAULT_EMBEDDING_MODEL = "@cf/baai/bge-base-en-v1.5";

export async function embedTexts(env: Env, texts: string[]): Promise<number[][]> {
  const results: number[][] = [];
  for (let index = 0; index < texts.length; index += 100) {
    const batch = texts.slice(index, index + 100);
    const response = await env.AI.run(env.EMBEDDING_MODEL ?? DEFAULT_EMBEDDING_MODEL, {
      text: batch,
    }) as EmbeddingResponse;
    results.push(...response.data);
  }
  return results;
}

export async function searchDocuments(env: Env, question: string): Promise<RetrievedChunk[]> {
  const [queryVector] = await embedTexts(env, [question]);
  return matchDocuments(env, queryVector);
}

export async function answerQuestion(
  env: Env,
  question: string,
  chunks: RetrievedChunk[],
): Promise<string> {
  const context = chunks
    .map((chunk) => `[${chunk.source_file} p.${chunk.page_number}] ${chunk.content}`)
    .join("\n\n");

  const aiResponse = await env.AI.run(env.CHAT_MODEL ?? DEFAULT_CHAT_MODEL, {
    messages: [
      {
        role: "system",
        content:
          "You are ClinicDocs AI. Answer using only provided SOP context. If the answer is not in context, say you cannot find it in SOP docs.",
      },
      {
        role: "user",
        content: `Question:\n${question}\n\nContext:\n${context}\n\nRespond in concise staff-friendly language.`,
      },
    ],
  }) as ChatResponse;

  return aiResponse.response ?? aiResponse.result?.response ?? "";
}
