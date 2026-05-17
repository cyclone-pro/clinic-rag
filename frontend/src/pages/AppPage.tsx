import { type ReactNode, type RefObject, useEffect, useRef, useState } from "react";

import { AdminPanel } from "@/components/AdminPanel";
import { ChatWindow } from "@/components/ChatWindow";
import {
  IconBookmark,
  IconClock,
  IconDoc,
  IconPin,
  IconPlus,
  IconSearch,
  IconShield,
  IconUser,
  Mark,
} from "@/components/Icons";
import { UploadZone } from "@/components/UploadZone";
import {
  AUTH_EXPIRED_EVENT,
  login,
  setAuthToken,
  streamChat,
  validateToken,
  type Citation,
} from "@/lib/api";

export type ChatMessage = {
  id: number;
  question: string;
  answer: string;
  citations: Citation[];
  latencyMs?: number;
  pending: boolean;
  pinned: boolean;
  createdAt: Date;
};

function getDisplayName(email: string | undefined | null): string {
  if (!email) {
    return "Guest";
  }
  const local = email.split("@")[0];
  const first = local.split(/[._]/)[0];
  return first.charAt(0).toUpperCase() + first.slice(1);
}

function getInitials(email: string | undefined | null): string {
  if (!email) {
    return "AI";
  }
  const local = email.split("@")[0];
  const parts = local.split(/[._]/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
}

function truncate(value: string, length: number): string {
  return value.length <= length ? value : `${value.slice(0, length - 1).trim()}...`;
}

function formatWhen(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

type MainProps = {
  userEmail: string | null;
  isAuthenticated: boolean;
  authError: string;
  isLoggingIn: boolean;
  messages: ChatMessage[];
  isStreaming: boolean;
  activeId: number | null;
  composerRef: RefObject<HTMLTextAreaElement>;
  onAsk: (question: string) => void;
  onActivate: (id: number) => void;
  onPin: (id: number) => void;
  onLogin: (email: string, password: string) => Promise<void>;
  onLogout: () => void;
};

function MainLayout({
  userEmail,
  isAuthenticated,
  authError,
  isLoggingIn,
  messages,
  isStreaming,
  activeId,
  composerRef,
  onAsk,
  onActivate,
  onPin,
  onLogin,
  onLogout,
}: MainProps): JSX.Element {
  const displayName = getDisplayName(userEmail);
  const initials = getInitials(userEmail);
  const activeMsg = messages.find((message) => message.id === activeId) ?? messages[messages.length - 1] ?? null;
  const pinned = messages.filter((message) => message.pinned);
  const recent = messages.filter((message) => !message.pending).slice(-5).reverse();
  const latencyValues = messages.filter((message) => message.latencyMs).map((message) => message.latencyMs ?? 0);
  const avgLatency = latencyValues.reduce((sum, value) => sum + value, 0) / Math.max(1, latencyValues.length);

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateRows: "auto 1fr", position: "relative", background: "var(--paper)" }}>
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", background: "radial-gradient(900px 540px at 92% 0%, rgba(35,78,72,.08), transparent 55%), radial-gradient(700px 500px at 0% 100%, rgba(201,122,74,.06), transparent 60%)" }} />
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.4, backgroundImage: "linear-gradient(to right, rgba(58,68,65,.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(58,68,65,.05) 1px, transparent 1px)", backgroundSize: "56px 56px" }} />

      <header style={{ position: "sticky", top: 0, zIndex: 10, display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: 24, padding: "14px 28px", background: "rgba(246,241,230,.86)", backdropFilter: "saturate(140%) blur(10px)", borderBottom: "1px solid var(--line-2)" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Mark size={24} />
          <div>
            <div style={{ fontFamily: "var(--serif)", fontWeight: 500, fontSize: 18, letterSpacing: "-0.01em", color: "var(--ink)" }}>ClinicDocs <span style={{ color: "var(--ink-4)", margin: "0 2px" }}>/</span> Assistant</div>
            <div style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: ".02em", marginTop: 1 }}>Public chat, protected uploads, public PDF viewing</div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 99, background: "rgba(35,78,72,.06)", border: "1px solid rgba(35,78,72,.18)", fontSize: 12, color: "var(--ink-2)" }}>
            <IconShield style={{ color: "var(--brand)" }} />
            <span><b style={{ color: "var(--brand-2)", fontWeight: 600 }}>Do not input patient PHI.</b> Public chat still uses your indexed clinic documents.</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
            <span style={{ width: 7, height: 7, borderRadius: 99, background: "var(--ok)", boxShadow: "0 0 0 4px rgba(58,163,122,.15)", display: "inline-block" }} />
            <span style={{ color: "var(--ink-2)" }}>Indexed</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, paddingLeft: 14, borderLeft: "1px solid var(--line-2)" }}>
            <div style={{ width: 34, height: 34, borderRadius: 99, background: "var(--brand)", color: "#f6f1e6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, letterSpacing: ".04em" }}>{initials}</div>
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ fontSize: 12, fontWeight: 500 }}>{displayName}</div>
              <div style={{ fontSize: 10.5, color: "var(--ink-3)" }}>{isAuthenticated ? userEmail : "Chat access without login"}</div>
            </div>
          </div>
        </div>
      </header>

      <main style={{ display: "grid", gridTemplateColumns: "260px 1fr 360px", gap: 24, padding: "24px 28px", minHeight: 0, position: "relative", zIndex: 1 }}>
        <aside style={{ display: "flex", flexDirection: "column", gap: 18, position: "sticky", top: 80, alignSelf: "start", maxHeight: "calc(100vh - 100px)", overflow: "auto", paddingRight: 4 }}>
          <button onClick={() => composerRef.current?.focus()} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: "var(--brand)", color: "#f6f1e6", border: "none", fontSize: 13, fontWeight: 500, boxShadow: "inset 0 1px 0 rgba(255,255,255,.06)" }}>
            <IconPlus />
            <span>New question</span>
          </button>

          <NavSection label="Pinned answers">
            {pinned.map((message) => (
              <NavItem key={message.id} active={activeId === message.id} onClick={() => onActivate(message.id)} icon={<IconPin />}>
                {truncate(message.question, 38)}
              </NavItem>
            ))}
            {pinned.length === 0 && <div style={{ padding: "6px 8px", fontSize: 12, color: "var(--ink-4)", fontStyle: "italic" }}>Pin any answer to keep it here.</div>}
          </NavSection>

          <NavSection label="Recent">
            {recent.map((message) => (
              <NavItem key={message.id} icon={<IconClock />} meta={formatWhen(message.createdAt)} onClick={() => onActivate(message.id)} active={activeId === message.id}>
                {truncate(message.question, 32)}
              </NavItem>
            ))}
            {recent.length === 0 && <div style={{ padding: "6px 8px", fontSize: 12, color: "var(--ink-4)", fontStyle: "italic" }}>No questions yet.</div>}
          </NavSection>

          <NavSection label="Library">
            <NavItem icon={<IconDoc />} meta="SOP">SOP corpus</NavItem>
            <NavItem icon={<IconBookmark />}>Saved replies</NavItem>
            <NavItem icon={<IconSearch />}>All searches</NavItem>
          </NavSection>

          <div style={{ marginTop: "auto", padding: 12, border: "1px solid var(--line-2)", borderRadius: 10, background: "var(--card)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--ink-2)", fontWeight: 500 }}>
              <IconUser style={{ color: "var(--brand)" }} />
              <span>{isAuthenticated ? "Upload session active" : "Anonymous chat mode"}</span>
            </div>
            <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 4, fontFamily: "var(--mono)" }}>
              {isAuthenticated ? userEmail : "Sign in only when you need to upload or use admin tools."}
            </div>
          </div>
        </aside>

        <ChatWindow
          messages={messages}
          isStreaming={isStreaming}
          activeId={activeId}
          composerRef={composerRef}
          displayName={displayName}
          avgLatency={avgLatency}
          onAsk={onAsk}
          onActivate={onActivate}
          onPin={onPin}
        />

        <aside style={{ display: "flex", flexDirection: "column", gap: 14, position: "sticky", top: 80, alignSelf: "start", maxHeight: "calc(100vh - 100px)", overflow: "auto", paddingLeft: 2 }}>
          <ActiveSourcesPanel turn={activeMsg} />
          <UploadZone
            isAuthenticated={isAuthenticated}
            userEmail={userEmail}
            authError={authError}
            isLoggingIn={isLoggingIn}
            onLogin={onLogin}
            onLogout={onLogout}
          />
          {isAuthenticated && <AdminPanel />}
        </aside>
      </main>
    </div>
  );
}

function NavSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600, padding: "0 8px" }}>{label}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>{children}</div>
    </div>
  );
}

function NavItem({
  children,
  icon,
  meta,
  active,
  onClick,
}: {
  children: ReactNode;
  icon: ReactNode;
  meta?: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 8px", borderRadius: 8, border: "none", background: active ? "var(--card)" : "transparent", boxShadow: active ? "inset 0 0 0 1px var(--line-2)" : "none", fontSize: 13, color: "var(--ink-2)", textAlign: "left", width: "100%" }}>
      <span style={{ color: "var(--ink-3)", display: "flex", flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{children}</span>
      {meta && <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-4)" }}>{meta}</span>}
    </button>
  );
}

function ActiveSourcesPanel({ turn }: { turn: ChatMessage | null }) {
  const sources = turn?.citations ?? [];

  return (
    <section style={{ background: "var(--card)", border: "1px solid var(--line-2)", borderRadius: 14, padding: 16, boxShadow: "var(--shadow-sm)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>Active sources</div>
        <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--brand)", background: "rgba(35,78,72,.08)", border: "1px solid rgba(35,78,72,.16)", borderRadius: 99, padding: "2px 8px" }}>{sources.length}</span>
      </div>

      {sources.length > 0 ? sources.slice(0, 4).map((source, index) => (
        <div key={index} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 0", borderTop: "1px dashed var(--line-2)" }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--brand)", fontWeight: 600, marginTop: 1 }}>[{index + 1}]</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{truncate(source.file, 30)}</div>
            <div style={{ fontSize: 11, color: "var(--ink-3)", lineHeight: 1.45, marginTop: 2, fontStyle: "italic" }}>{truncate(source.snippet, 64)}</div>
          </div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-2)", marginLeft: 6, whiteSpace: "nowrap" }}>p.{source.page}</div>
        </div>
      )) : (
        <div style={{ padding: "8px 0" }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-2)" }}>No citations yet.</div>
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>Ask a question to see the referenced PDF pages here.</div>
        </div>
      )}
    </section>
  );
}

export function AppPage(): JSX.Element {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  const clearSession = (message = "") => {
    setSessionToken(null);
    setUserEmail(null);
    setAuthToken(null);
    localStorage.removeItem("clinicdocs_token");
    setAuthError(message);
  };

  useEffect(() => {
    const cachedToken = localStorage.getItem("clinicdocs_token");
    if (!cachedToken) {
      return;
    }

    setAuthToken(cachedToken);
    validateToken()
      .then((info) => {
        if (info) {
          setSessionToken(cachedToken);
          setUserEmail(info.email ?? null);
          setAuthError("");
          return;
        }
        clearSession("Your upload session expired. Sign in again to upload.");
      })
      .catch(() => clearSession("Your upload session expired. Sign in again to upload."));
  }, []);

  useEffect(() => {
    const handle = (event: Event) => {
      const detail = event instanceof CustomEvent && typeof event.detail === "string" ? event.detail : "";
      clearSession(detail || "Your upload session expired. Sign in again to upload.");
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handle);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handle);
  }, []);

  const handleLogin = async (email: string, password: string) => {
    if (!email || !password) {
      setAuthError("Enter your email and password to upload PDFs.");
      return;
    }

    setIsLoggingIn(true);
    setAuthError("");
    try {
      const token = await login(email, password);
      setAuthToken(token);
      setSessionToken(token);
      localStorage.setItem("clinicdocs_token", token);

      const user = await validateToken();
      setUserEmail(user?.email ?? email);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAsk = async (question: string) => {
    const id = Date.now();
    const newMessage: ChatMessage = {
      id,
      question,
      answer: "",
      citations: [],
      pending: true,
      pinned: false,
      createdAt: new Date(),
    };

    setMessages((current) => [...current, newMessage]);
    setActiveId(id);
    setIsStreaming(true);

    try {
      await streamChat(question, {
        onToken: (token) => setMessages((current) => current.map((message) => message.id === id ? { ...message, answer: message.answer + token } : message)),
        onCitations: (citations) => setMessages((current) => current.map((message) => message.id === id ? { ...message, citations } : message)),
        onDone: ({ answer, latency_ms }) => setMessages((current) => current.map((message) => message.id === id ? { ...message, answer, latencyMs: latency_ms, pending: false } : message)),
      });
    } catch (error) {
      setMessages((current) => current.map((message) => message.id === id ? { ...message, answer: error instanceof Error ? error.message : "Unable to generate answer.", pending: false } : message));
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <MainLayout
      userEmail={userEmail}
      isAuthenticated={Boolean(sessionToken)}
      authError={authError}
      isLoggingIn={isLoggingIn}
      messages={messages}
      isStreaming={isStreaming}
      activeId={activeId}
      composerRef={composerRef}
      onAsk={handleAsk}
      onActivate={setActiveId}
      onPin={(id) => setMessages((current) => current.map((message) => message.id === id ? { ...message, pinned: !message.pinned } : message))}
      onLogin={handleLogin}
      onLogout={() => clearSession("")}
    />
  );
}
