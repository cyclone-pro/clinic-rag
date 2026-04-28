export type Citation = {
  file: string;
  page: number;
  snippet: string;
};

export type QueryLog = {
  id: number;
  question: string;
  answer: string;
  latency_ms: number;
  created_at: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
export const AUTH_EXPIRED_EVENT = "clinicdocs:auth-expired";
let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

function authHeaders(): HeadersInit {
  if (!authToken) {
    return {};
  }
  return { Authorization: `Bearer ${authToken}` };
}

function notifyAuthExpired(): void {
  window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
}

async function parseJSON<T>(response: Response, notifyOnUnauthorized = true): Promise<T> {
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ detail: "Unexpected error" }));
    if (response.status === 401 && notifyOnUnauthorized) {
      notifyAuthExpired();
    }
    throw new Error(payload.detail ?? "Request failed");
  }
  return response.json() as Promise<T>;
}

export async function login(email: string, password: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const data = await parseJSON<{ access_token: string }>(response, false);
  return data.access_token;
}

export async function uploadPdf(file: File): Promise<{
  source_file: string;
  pages_processed: number;
  chunks_created: number;
  extraction_summary: string;
}> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${API_BASE_URL}/upload/pdf`, {
    method: "POST",
    headers: authHeaders(),
    body: formData
  });
  return parseJSON(response);
}

export async function fetchQueryLogs(): Promise<QueryLog[]> {
  const response = await fetch(`${API_BASE_URL}/admin/query-logs`, {
    headers: authHeaders()
  });
  return parseJSON<QueryLog[]>(response);
}

export async function reindexAll(): Promise<{ indexed_files: number; chunks: number }> {
  const response = await fetch(`${API_BASE_URL}/admin/reindex`, {
    method: "POST",
    headers: authHeaders()
  });
  return parseJSON(response);
}

export async function streamChat(
  question: string,
  callbacks: {
    onToken: (token: string) => void;
    onCitations: (citations: Citation[]) => void;
    onDone: (payload: { answer: string; latency_ms: number }) => void;
  }
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ question })
  });

  if (!response.ok || !response.body) {
    const payload = await response.json().catch(() => ({ detail: "Chat stream failed" }));
    if (response.status === 401) {
      notifyAuthExpired();
    }
    throw new Error(payload.detail ?? "Chat stream failed");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });

    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";
    for (const rawEvent of events) {
      const eventLine = rawEvent.split("\n").find((line) => line.startsWith("event: "));
      const dataLine = rawEvent.split("\n").find((line) => line.startsWith("data: "));
      if (!eventLine || !dataLine) {
        continue;
      }
      const eventName = eventLine.replace("event: ", "").trim();
      const payload = JSON.parse(dataLine.replace("data: ", "").trim()) as {
        token?: string;
        citations?: Citation[];
        answer?: string;
        latency_ms?: number;
        detail?: string;
      };
      if (eventName === "error") {
        throw new Error(payload.detail ?? "Chat stream failed");
      }
      if (eventName === "token" && payload.token) {
        callbacks.onToken(payload.token);
      }
      if (eventName === "citations" && payload.citations) {
        callbacks.onCitations(payload.citations);
      }
      if (eventName === "done" && payload.answer && typeof payload.latency_ms === "number") {
        callbacks.onDone({ answer: payload.answer, latency_ms: payload.latency_ms });
      }
    }
  }
}
