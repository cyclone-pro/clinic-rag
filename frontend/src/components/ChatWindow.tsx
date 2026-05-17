import { type KeyboardEvent, useEffect, useRef, useState } from "react";

import type { ChatMessage } from "@/pages/AppPage";
import { buildPdfUrl, type Citation } from "@/lib/api";
import {
  IconClock, IconCopy, IconDoc, IconExternal, IconChev,
  IconPdf, IconPin, IconSend, IconSpark, IconThumb,
} from "@/components/Icons";

const SUGGESTED = [
  "What is the medication reconciliation protocol?",
  "How do we handle a needlestick injury?",
  "When is a refrigerator temperature log required?",
  "What is the controlled substance disposal procedure?",
];

function truncate(s: string, n: number) {
  return s.length <= n ? s : s.slice(0, n - 1).trim() + "…";
}

function formatWhen(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

/* ─── Source card ─────────────────────────────────────────────────────────── */

function SourceCard({ citation, index }: { citation: Citation; index: number }) {
  return (
    <button
      type="button"
      onClick={() => window.open(buildPdfUrl(citation.file, citation.page), "_blank")}
      style={{ textAlign: "left", border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 12px", background: "#fffdf7", display: "flex", flexDirection: "column", gap: 6, width: "100%" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--ink-3)" }}>
        <span style={{ fontFamily: "var(--mono)", color: "var(--brand)", fontWeight: 500 }}>[{index + 1}]</span>
        <IconPdf style={{ color: "var(--brand)" }} />
        <span style={{ fontFamily: "var(--mono)", color: "var(--ink-2)" }}>p.{citation.page}</span>
        <IconExternal style={{ color: "var(--ink-4)", marginLeft: "auto" }} />
      </div>
      <div style={{ fontSize: 12, fontWeight: 500, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{citation.file}</div>
      <div style={{ fontSize: 11.5, color: "var(--ink-3)", lineHeight: 1.45, fontStyle: "italic", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>"{citation.snippet}"</div>
    </button>
  );
}

/* ─── Turn (one Q&A pair) ─────────────────────────────────────────────────── */

type TurnProps = {
  turn: ChatMessage;
  index: number;
  isActive: boolean;
  onActivate: () => void;
  onPin: () => void;
};

function Turn({ turn, index, isActive, onActivate, onPin }: TurnProps) {
  const copyAnswer = (e: React.MouseEvent) => {
    e.stopPropagation();
    void navigator.clipboard.writeText(turn.answer);
  };

  return (
    <article
      onClick={onActivate}
      style={{ display: "grid", gridTemplateColumns: "56px 1fr", gap: 12, padding: "16px 4px", cursor: "pointer", borderRadius: 14, background: isActive ? "linear-gradient(to right, rgba(35,78,72,.04), rgba(35,78,72,0) 70%)" : "transparent", transition: "background .15s", animation: "fadeIn .2s ease" }}
    >
      {/* rail */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <div style={{ width: 36, height: 36, borderRadius: 99, border: "1px solid var(--line-2)", background: "#fffdf7", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-3)" }}>
          {String(index).padStart(2, "0")}
        </div>
        <div style={{ width: 1, flex: 1, background: "var(--line-2)", minHeight: 24 }} />
      </div>

      {/* body */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 4, minWidth: 0 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>You asked</div>
          <h3 style={{ fontFamily: "var(--serif)", fontSize: 22, fontWeight: 500, lineHeight: 1.25, letterSpacing: "-.01em", color: "var(--ink)" }}>{turn.question}</h3>
        </div>

        {turn.pending ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "14px 16px", border: "1px solid var(--line-2)", borderRadius: 14, background: "var(--card)" }}>
            {[94, 86, 58].map(w => (
              <div key={w} style={{ height: 10, borderRadius: 6, width: `${w}%`, background: "linear-gradient(90deg, #e9e2cf 0%, #f3eeda 50%, #e9e2cf 100%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s linear infinite" }} />
            ))}
          </div>
        ) : (
          <div style={{ background: "var(--card)", border: "1px solid var(--line-2)", borderRadius: 14, padding: "18px 20px", boxShadow: "var(--shadow-sm)" }}>
            {/* answer head */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--brand-2)", fontWeight: 600 }}>
                <span style={{ width: 7, height: 7, borderRadius: 99, background: "var(--brand)", display: "inline-block" }} />
                <span>ClinicDocs</span>
              </div>
              <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--mono)" }}>
                {turn.latencyMs && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <IconClock /> {(turn.latencyMs / 1000).toFixed(2)}s
                  </span>
                )}
                <span>{formatWhen(turn.createdAt)}</span>
              </div>
            </div>

            <p style={{ fontSize: 15, lineHeight: 1.62, color: "var(--ink)" }}>{turn.answer}</p>

            {/* source cards */}
            {turn.citations.length > 0 && (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px dashed var(--line-2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>Sources</div>
                  <span style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--mono)" }}>{turn.citations.length} citation{turn.citations.length > 1 ? "s" : ""}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
                  {turn.citations.map((c, i) => <SourceCard key={i} citation={c} index={i} />)}
                </div>
              </div>
            )}

            {/* action buttons */}
            <div style={{ display: "flex", gap: 6, marginTop: 14, paddingTop: 12, borderTop: "1px dashed var(--line-2)" }}>
              <ActionBtn icon={<IconPin />} label={turn.pinned ? "Pinned" : "Pin"} onClick={e => { e.stopPropagation(); onPin(); }} />
              <ActionBtn icon={<IconCopy />} label="Copy" onClick={copyAnswer} />
              <ActionBtn icon={<IconThumb />} label="Helpful" onClick={e => e.stopPropagation()} />
              <ActionBtn icon={<IconThumb style={{ transform: "scaleY(-1)" }} />} label="" onClick={e => e.stopPropagation()} />
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function ActionBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button onClick={onClick} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 8, border: "1px solid transparent", background: "transparent", fontSize: 12, color: "var(--ink-2)" }}>
      {icon}{label && <span>{label}</span>}
    </button>
  );
}

/* ─── Thinking indicator ─────────────────────────────────────────────────── */

function Thinking() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "56px 1fr", gap: 12, padding: "8px 4px" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: 36, height: 36, borderRadius: 99, border: "none", background: "var(--brand)", color: "#f6f1e6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>··</div>
      </div>
      <div style={{ padding: "6px 0" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "10px 14px", background: "var(--card)", border: "1px solid var(--line-2)", borderRadius: 99 }}>
          {[0, .15, .3].map(d => (
            <span key={d} style={{ width: 6, height: 6, background: "var(--brand)", borderRadius: 99, animation: "pulse 1.2s infinite ease-in-out", animationDelay: `${d}s`, display: "inline-block" }} />
          ))}
          <span style={{ marginLeft: 8, color: "var(--ink-3)", fontSize: 13 }}>Searching indexed documents…</span>
        </div>
      </div>
    </div>
  );
}

/* ─── ChatWindow ─────────────────────────────────────────────────────────── */

type Props = {
  messages: ChatMessage[];
  isStreaming: boolean;
  activeId: number | null;
  composerRef: React.RefObject<HTMLTextAreaElement>;
  displayName: string;
  avgLatency: number;
  onAsk: (q: string) => void;
  onActivate: (id: number) => void;
  onPin: (id: number) => void;
};

export function ChatWindow({ messages, isStreaming, activeId, composerRef, displayName, avgLatency, onAsk, onActivate, onPin }: Props): JSX.Element {
  const [query, setQuery] = useState("");
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages.length, isStreaming]);

  const ask = (q?: string) => {
    const text = (q ?? query).trim();
    if (!text || isStreaming) return;
    setQuery("");
    onAsk(text);
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(); }
  };

  return (
    <section style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 18 }}>
      {/* center header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24, padding: "4px 4px 14px", borderBottom: "1px solid var(--line-2)" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--ink-3)", fontWeight: 600 }}>
            <span style={{ width: 6, height: 6, background: "var(--accent)", borderRadius: 99, display: "inline-block" }} />
            <span>Conversation</span>
          </div>
          <h1 style={{ fontFamily: "var(--serif)", fontWeight: 400, fontSize: 42, lineHeight: 1.05, letterSpacing: "-0.02em", color: "var(--ink)", marginTop: 6 }}>
            Good {getGreeting()}, <em style={{ fontStyle: "italic", color: "var(--brand)" }}>{displayName}.</em>
          </h1>
          <div style={{ marginTop: 8, fontSize: 14, color: "var(--ink-2)", maxWidth: 560 }}>Ask anything about the indexed SOP corpus. Answers cite the page they came from.</div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 18 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "var(--serif)", fontSize: 24, color: "var(--ink)", fontWeight: 500, letterSpacing: "-.02em" }}>{messages.length}</div>
            <div style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: ".02em", marginTop: 2 }}>questions today</div>
          </div>
          <div style={{ width: 1, height: 34, background: "var(--line-2)" }} />
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "var(--serif)", fontSize: 24, color: "var(--ink)", fontWeight: 500, letterSpacing: "-.02em" }}>
              {avgLatency > 0 ? Math.round(avgLatency) : "—"}<span style={{ fontSize: 14, color: "var(--ink-3)", marginLeft: 1 }}>ms</span>
            </div>
            <div style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: ".02em", marginTop: 2 }}>avg. response</div>
          </div>
        </div>
      </div>

      {/* thread */}
      <div ref={threadRef} style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 8, overflowY: "auto", maxHeight: "calc(100vh - 420px)", minHeight: 200 }}>
        {messages.length === 0 && (
          <div style={{ padding: "40px 0", textAlign: "center", color: "var(--ink-3)", fontSize: 14 }}>
            Ask a question below to get started.
          </div>
        )}
        {messages.map((m, i) => (
          <Turn key={m.id} turn={m} index={i + 1} isActive={activeId === m.id} onActivate={() => onActivate(m.id)} onPin={() => onPin(m.id)} />
        ))}
        {isStreaming && <Thinking />}
        <div style={{ height: 24 }} />
      </div>

      {/* composer */}
      <div style={{ position: "sticky", bottom: 16, marginTop: "auto", display: "flex", flexDirection: "column", gap: 10, background: "linear-gradient(to top, var(--paper) 70%, transparent)", paddingTop: 18, paddingBottom: 4 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {SUGGESTED.map(s => (
            <button key={s} onClick={() => ask(s)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 99, border: "1px solid var(--line-2)", background: "#fffdf7", fontSize: 12, color: "var(--ink-2)" }}>
              <IconSpark style={{ color: "var(--accent)" }} />{s}
            </button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", background: "var(--card)", border: "1px solid var(--line-2)", borderRadius: 14, boxShadow: "var(--shadow-md)", padding: "6px 6px 6px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 8, background: "rgba(35,78,72,.06)", color: "var(--brand-2)", fontSize: 12, fontWeight: 500, marginRight: 8 }}>
            <IconDoc /><span>SOP corpus</span><IconChev />
          </div>
          <textarea
            ref={composerRef}
            rows={1}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder="Ask about SOP workflows, procedures, or protocols…"
            style={{ border: "none", outline: "none", background: "transparent", fontSize: 14, color: "var(--ink)", padding: "12px 0", resize: "none", maxHeight: 120, lineHeight: 1.5, width: "100%" }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 12, paddingLeft: 8 }}>
            <span style={{ fontSize: 11, color: "var(--ink-4)" }}>Enter to send · Shift+Enter for newline</span>
            <button onClick={() => ask()} disabled={!query.trim() || isStreaming} style={{ width: 36, height: 36, borderRadius: 10, background: (!query.trim() || isStreaming) ? "#cbc8bd" : "var(--brand)", color: "#f6f1e6", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: (!query.trim() || isStreaming) ? "not-allowed" : "pointer" }}>
              <IconSend />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
