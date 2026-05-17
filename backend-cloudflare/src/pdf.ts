import { extractText, getDocumentProxy } from "unpdf";

import { embedTexts } from "./ai";
import { ApiError } from "./errors";
import { insertRows, publicStorageObjectUrl, uploadStorageObject } from "./supabase";
import { splitText } from "./text";
import type { Env } from "./types";
import { vectorLiteral } from "./vectors";

const PDF_CONTENT_TYPE = "application/pdf";

export async function indexPdfUpload(
  env: Env,
  file: File,
): Promise<{
  source_file: string;
  pages_processed: number;
  chunks_created: number;
  extraction_summary: string;
}> {
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    throw new ApiError(400, "Only PDF files are allowed.");
  }

  const pdfBytes = new Uint8Array(await file.arrayBuffer());
  if (pdfBytes.byteLength === 0) {
    throw new ApiError(400, "Uploaded file is empty.");
  }

  await uploadStorageObject(env, file.name, pdfBytes, PDF_CONTENT_TYPE);

  const pdf = await getDocumentProxy(pdfBytes);
  const extracted = await extractText(pdf, { mergePages: false });
  const pages = extracted.text.map((content, index) => ({
    pageNumber: index + 1,
    content: content.trim(),
  }));

  const chunks = pages.flatMap((page) =>
    splitText(page.content, env).map((content) => ({
      pageNumber: page.pageNumber,
      content,
    })),
  );

  if (chunks.length > 0) {
    const vectors = await embedTexts(
      env,
      chunks.map((chunk) => chunk.content),
    );
    const rows = chunks.map((chunk, index) => ({
      content: chunk.content,
      embedding: vectorLiteral(vectors[index]),
      source_file: file.name,
      page_number: chunk.pageNumber,
    }));
    await insertRows(env, "documents", rows);
  }

  return {
    source_file: file.name,
    pages_processed: extracted.totalPages,
    chunks_created: chunks.length,
    extraction_summary: "native",
  };
}

export function buildPdfRedirect(env: Env, filename: string): Response {
  const key = filename.trim();
  if (!key) {
    throw new ApiError(400, "PDF filename is required.");
  }

  return Response.redirect(publicStorageObjectUrl(env, key), 302);
}

export function isFile(value: unknown): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    "arrayBuffer" in value
  );
}
