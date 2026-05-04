import type { Citation, Env, RetrievedChunk } from "./types";

export function splitText(text: string, env: Env): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return [];
  }

  const chunkSize = Number(env.CHUNK_SIZE ?? "1200");
  const overlap = Number(env.CHUNK_OVERLAP ?? "150");
  const chunks: string[] = [];
  let cursor = 0;

  while (cursor < normalized.length) {
    const end = Math.min(cursor + chunkSize, normalized.length);
    chunks.push(normalized.slice(cursor, end).trim());
    if (end === normalized.length) {
      break;
    }
    cursor = Math.max(end - overlap, cursor + 1);
  }

  return chunks.filter(Boolean);
}

export function buildCitations(chunks: RetrievedChunk[]): Citation[] {
  const seen = new Set<string>();
  const citations: Citation[] = [];

  for (const chunk of chunks) {
    const key = `${chunk.source_file}:${chunk.page_number}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    citations.push({
      file: chunk.source_file,
      page: chunk.page_number,
      snippet: chunk.content.slice(0, 180).replace(/\s+/g, " ").trim(),
    });
  }

  return citations;
}
