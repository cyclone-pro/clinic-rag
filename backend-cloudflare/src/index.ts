import { ApiError } from "./errors";
import {
  handleChatStream,
  handleGetPdf,
  handleLogin,
  handleQueryLogs,
  handleReindex,
  handleUploadPdf,
} from "./handlers";
import { corsHeaders, json } from "./http";
import { requireStaffUser } from "./supabase";
import type { Env } from "./types";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(request, env) });
    }

    const url = new URL(request.url);

    try {
      if (request.method === "GET" && url.pathname === "/health") {
        return json(request, env, { status: "ok" });
      }

      if (request.method === "POST" && url.pathname === "/auth/login") {
        return handleLogin(request, env);
      }

      if (request.method === "GET" && url.pathname === "/auth/me") {
        const user = await requireStaffUser(request, env);
        return json(request, env, { ok: true, email: user.email });
      }

      if (request.method === "POST" && url.pathname === "/upload/pdf") {
        await requireStaffUser(request, env);
        return handleUploadPdf(request, env);
      }

      if (request.method === "GET" && url.pathname.startsWith("/pdf/")) {
        const filename = decodeURIComponent(url.pathname.replace("/pdf/", ""));
        return handleGetPdf(env, filename);
      }

      if (request.method === "POST" && url.pathname === "/chat/stream") {
        return handleChatStream(request, env);
      }

      if (request.method === "GET" && url.pathname === "/admin/query-logs") {
        await requireStaffUser(request, env);
        return handleQueryLogs(request, env);
      }

      if (request.method === "POST" && url.pathname === "/admin/reindex") {
        await requireStaffUser(request, env);
        return handleReindex(request, env);
      }

      return json(request, env, { detail: "Not found." }, 404);
    } catch (error) {
      if (error instanceof ApiError) {
        return json(request, env, { detail: error.message }, error.status);
      }
      return json(request, env, { detail: "Unexpected backend error." }, 500);
    }
  },
} satisfies ExportedHandler<Env>;
