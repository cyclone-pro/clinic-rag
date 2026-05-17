import { answerQuestion, searchDocuments } from "./ai";
import { ApiError } from "./errors";
import { corsHeaders, json, sse } from "./http";
import { buildPdfRedirect, indexPdfUpload, isFile } from "./pdf";
import { fetchQueryLogs, insertRows, loginWithPassword } from "./supabase";
import { buildCitations } from "./text";
import type { Env } from "./types";

export async function handleLogin(request: Request, env: Env): Promise<Response> {
  const payload = await request.json().catch(() => ({})) as { email?: string; password?: string };
  if (!payload.email || !payload.password) {
    throw new ApiError(400, "Email and password are required.");
  }

  return json(request, env, await loginWithPassword(env, payload.email, payload.password));
}

export async function handleUploadPdf(request: Request, env: Env): Promise<Response> {
  const formData = await request.formData();
  const file = formData.get("file");
  if (!isFile(file)) {
    throw new ApiError(400, "PDF file is required.");
  }

  return json(request, env, await indexPdfUpload(env, file));
}

export function handleGetPdf(env: Env, filename: string): Response {
  return buildPdfRedirect(env, filename);
}

export async function handleQueryLogs(request: Request, env: Env): Promise<Response> {
  return json(request, env, await fetchQueryLogs(env));
}

export function handleReindex(request: Request, env: Env): Response {
  return json(request, env, {
    indexed_files: 0,
    chunks: 0,
    detail: "Cloudflare backend indexes documents during upload. Re-upload PDFs to reindex.",
  });
}

export async function handleChatStream(request: Request, env: Env): Promise<Response> {
  const payload = await request.json().catch(() => ({})) as { question?: string };
  const question = payload.question?.trim();
  if (!question || question.length < 5) {
    throw new ApiError(400, "Question must be at least 5 characters.");
  }

  const startedAt = Date.now();
  const chunks = await searchDocuments(env, question);
  if (chunks.length === 0) {
    throw new ApiError(404, "No indexed documents were found. Upload SOP PDFs first.");
  }

  const citations = buildCitations(chunks);
  const answer = await answerQuestion(env, question, chunks);
  const latencyMs = Date.now() - startedAt;
  await insertRows(env, "query_logs", [{ question, answer, latency_ms: latencyMs }]);

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(sse("citations", { citations }));
      controller.enqueue(sse("done", { answer, latency_ms: latencyMs }));
      controller.close();
    },
  });

  const headers = corsHeaders(request, env);
  headers.set("Content-Type", "text/event-stream");
  headers.set("Cache-Control", "no-cache");
  headers.set("Connection", "keep-alive");
  return new Response(stream, { headers });
}
