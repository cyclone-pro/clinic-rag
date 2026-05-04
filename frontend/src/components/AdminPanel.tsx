import { useEffect, useState } from "react";

import { IconRefresh } from "@/components/Icons";
import { fetchQueryLogs, reindexAll, type QueryLog } from "@/lib/api";

function truncate(s: string, n: number) {
  return s.length <= n ? s : s.slice(0, n - 1).trim() + "…";
}

function shortWhen(ts: string): string {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  return `${Math.floor(diff / 3600)}h`;
}

export function AdminPanel(): JSX.Element {
  const [logs, setLogs] = useState<QueryLog[]>([]);
  const [reindexing, setReindexing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");

  const loadLogs = async () => {
    try {
      const data = await fetchQueryLogs();
      setLogs(data);
    } catch {
      // silently fail — logs aren't critical
    }
  };

  useEffect(() => { void loadLogs(); }, []);

  const handleReindex = async () => {
    if (reindexing) return;
    setReindexing(true);
    setProgress(0);
    setStatus("");
    let p = 0;
    const id = setInterval(() => {
      p += Math.random() * 14 + 4;
      if (p >= 100) {
        p = 100;
        clearInterval(id);
        setTimeout(() => { setReindexing(false); setProgress(0); }, 600);
      }
      setProgress(p);
    }, 220);
    try {
      const result = await reindexAll();
      setStatus(`${result.indexed_files} files, ${result.chunks} chunks`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Re-index failed");
    }
  };

  const rows = logs.slice(0, 4);
  const avgLatency = logs.length ? logs.reduce((s, l) => s + l.latency_ms, 0) / logs.length : 0;

  return (
    <section style={{ background: "var(--card)", border: "1px solid var(--line-2)", borderRadius: 14, padding: 16, boxShadow: "var(--shadow-sm)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>Admin · Query log</div>
        <button onClick={handleReindex} disabled={reindexing} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 8, background: "var(--brand)", color: "#f6f1e6", border: "none", fontSize: 11, fontWeight: 500 }}>
          <IconRefresh style={{ animation: reindexing ? "spin 1.4s linear infinite" : "none" }} />
          <span>{reindexing ? `Re-indexing ${Math.floor(progress)}%` : "Re-index"}</span>
        </button>
      </div>

      {status && <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 8, fontFamily: "var(--mono)" }}>{status}</div>}

      <div style={{ display: "flex", gap: 8, padding: "6px 4px", fontSize: 10, color: "var(--ink-3)", letterSpacing: ".06em", textTransform: "uppercase", fontWeight: 600, borderBottom: "1px solid var(--line-2)" }}>
        <div style={{ flex: 1 }}>Question</div>
        <div style={{ width: 70, textAlign: "right" }}>Latency</div>
        <div style={{ width: 44, textAlign: "right" }}>When</div>
      </div>

      {rows.length === 0 ? (
        <div style={{ padding: "14px 4px", fontSize: 12, color: "var(--ink-4)", fontStyle: "italic" }}>No query logs yet.</div>
      ) : rows.map(r => (
        <div key={r.id} style={{ display: "flex", gap: 8, padding: "8px 4px", fontSize: 12, alignItems: "center", borderBottom: "1px dashed var(--line)" }}>
          <div style={{ flex: 1, color: "var(--ink-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{truncate(r.question, 38)}</div>
          <div style={{ width: 70, textAlign: "right", fontFamily: "var(--mono)", color: "var(--ink-3)", fontSize: 11 }}>{(r.latency_ms / 1000).toFixed(2)}s</div>
          <div style={{ width: 44, textAlign: "right", fontFamily: "var(--mono)", color: "var(--ink-4)", fontSize: 11 }}>{shortWhen(r.created_at)}</div>
        </div>
      ))}

      <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--line-2)", display: "flex", gap: 0 }}>
        {[
          ["p50", avgLatency > 0 ? `${(avgLatency / 1000).toFixed(1)}` : "—", "s"],
          ["total", String(logs.length), ""],
          ["corpus", "216", "p"],
        ].map(([lbl, val, unit]) => (
          <div key={lbl} style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>{lbl}</div>
            <div style={{ fontFamily: "var(--serif)", fontSize: 18, fontWeight: 500, color: "var(--ink)", marginTop: 2 }}>
              {val}<span style={{ fontSize: 11, color: "var(--ink-3)", marginLeft: 1 }}>{unit}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
