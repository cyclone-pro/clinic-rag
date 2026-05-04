import { ApiError } from "./errors";
import type { Env, QueryLog, RetrievedChunk, SupabaseUser } from "./types";
import { vectorLiteral } from "./vectors";

export function supabaseUrl(env: Env, path: string): string {
  return `${env.SUPABASE_URL.replace(/\/$/, "")}${path}`;
}

export async function loginWithPassword(
  env: Env,
  email: string,
  password: string,
): Promise<{
  access_token: string;
  refresh_token: string;
  expires_at: number;
  token_type: string;
}> {
  const response = await fetch(supabaseUrl(env, "/auth/v1/token?grant_type=password"), {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const data = await response.json<{
    access_token: string;
    refresh_token: string;
    expires_at?: number;
    token_type?: string;
  }>();

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at ?? 0,
    token_type: data.token_type ?? "bearer",
  };
}

export async function requireStaffUser(request: Request, env: Env): Promise<SupabaseUser> {
  const userAuth = request.headers.get("Authorization");
  if (!userAuth?.startsWith("Bearer ")) {
    throw new ApiError(401, "Missing auth token.");
  }

  const response = await fetch(supabaseUrl(env, "/auth/v1/user"), {
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: userAuth,
    },
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.warn("supabase_user_validation_failed", {
      status: response.status,
      detail,
      hasAuthorization: Boolean(userAuth),
      hasAnonKey: Boolean(env.SUPABASE_ANON_KEY),
    });
    throw new ApiError(
      401,
      detail ? `Invalid or expired auth token: ${detail}` : "Invalid or expired auth token.",
    );
  }

  const data = await response.json<SupabaseUser>();
  if (!data.id) {
    throw new ApiError(401, "Unauthorized.");
  }
  return data;
}

export async function fetchQueryLogs(env: Env): Promise<QueryLog[]> {
  const response = await fetch(
    supabaseUrl(
      env,
      "/rest/v1/query_logs?select=id,question,answer,latency_ms,created_at&order=created_at.desc&limit=50",
    ),
    { headers: serviceHeaders(env) },
  );
  if (!response.ok) {
    throw new ApiError(500, "Failed to load query logs.");
  }
  return response.json<QueryLog[]>();
}

export async function insertRows(env: Env, table: string, rows: unknown[]): Promise<void> {
  const response = await fetch(supabaseUrl(env, `/rest/v1/${table}`), {
    method: "POST",
    headers: {
      ...Object.fromEntries(serviceHeaders(env)),
      Prefer: "return=minimal",
    },
    body: JSON.stringify(rows),
  });
  if (!response.ok) {
    throw new ApiError(500, `Failed to insert ${table}.`);
  }
}

export async function matchDocuments(env: Env, queryVector: number[]): Promise<RetrievedChunk[]> {
  const response = await fetch(supabaseUrl(env, "/rest/v1/rpc/match_documents"), {
    method: "POST",
    headers: serviceHeaders(env),
    body: JSON.stringify({
      query_embedding: vectorLiteral(queryVector),
      match_count: Number(env.RETRIEVAL_K ?? "5"),
    }),
  });

  if (!response.ok) {
    throw new ApiError(500, "Failed to search indexed documents.");
  }
  return response.json<RetrievedChunk[]>();
}

function serviceHeaders(env: Env): Headers {
  return new Headers({
    apikey: env.SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
    "Content-Type": "application/json",
  });
}
