import { type ChangeEvent, useRef, useState } from "react";

import { IconPdf, IconUpload } from "@/components/Icons";
import { uploadPdf } from "@/lib/api";

type UploadedFile = {
  name: string;
  pages: number;
  chunks: number;
  status: string;
};

export function UploadZone(): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pct, setPct] = useState(0);
  const [uploaded, setUploaded] = useState<UploadedFile | null>(null);
  const [error, setError] = useState("");

  const doUpload = async (file: File) => {
    setUploading(true);
    setError("");
    setPct(0);
    const interval = setInterval(() => {
      setPct(p => {
        const next = p + 6 + Math.random() * 10;
        return next >= 90 ? 90 : next;
      });
    }, 180);
    try {
      const result = await uploadPdf(file);
      clearInterval(interval);
      setPct(100);
      setUploaded({ name: result.source_file, pages: result.pages_processed, chunks: result.chunks_created, status: result.extraction_summary });
      setTimeout(() => { setUploading(false); setPct(0); }, 600);
    } catch (err) {
      clearInterval(interval);
      setError(err instanceof Error ? err.message : "Upload failed");
      setUploading(false);
      setPct(0);
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void doUpload(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files[0];
    if (file) void doUpload(file);
  };

  return (
    <section style={{ background: "var(--card)", border: "1px solid var(--line-2)", borderRadius: 14, padding: 16, boxShadow: "var(--shadow-sm)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>Document upload</div>
        <span style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: ".06em", border: "1px solid var(--line-2)", borderRadius: 99, padding: "2px 8px" }}>SOP corpus</span>
      </div>

      <input ref={inputRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={onInputChange} />

      <div
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "20px 16px", borderRadius: 12, border: `1.5px dashed ${drag ? "var(--brand)" : "var(--line-2)"}`, background: drag ? "rgba(35,78,72,.04)" : "#fffdf7", transition: "border-color .12s, background .12s" }}
      >
        <IconUpload style={{ color: "var(--brand)" }} />
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", marginTop: 6 }}>Drop a PDF or browse</div>
        <div style={{ fontSize: 11, color: "var(--ink-3)" }}>Native text preferred · OCR up to 500 pages</div>
        <button onClick={() => inputRef.current?.click()} disabled={uploading} style={{ marginTop: 8, padding: "8px 14px", borderRadius: 8, background: "var(--brand)", color: "#f6f1e6", border: "none", fontSize: 12, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 6 }}>
          <IconUpload />{uploading ? "Uploading…" : "Upload SOP PDF"}
        </button>
      </div>

      {uploading && (
        <div style={{ marginTop: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--ink-3)", marginBottom: 4 }}>
            <span>Indexing…</span>
            <span style={{ fontFamily: "var(--mono)" }}>{Math.floor(pct)}%</span>
          </div>
          <div style={{ height: 4, background: "var(--paper-2)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, var(--brand) 0%, var(--brand-3) 100%)", transition: "width .18s linear" }} />
          </div>
        </div>
      )}

      {error && <div style={{ marginTop: 10, fontSize: 12, color: "var(--danger)", padding: "6px 10px", background: "rgba(164,69,58,.07)", borderRadius: 8, border: "1px solid rgba(164,69,58,.18)" }}>{error}</div>}

      {uploaded && (
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: "1px solid var(--line-2)", borderRadius: 10, background: "#fffdf7" }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--brand-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <IconPdf style={{ color: "var(--brand)" }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{uploaded.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--ink-3)", marginTop: 2, fontFamily: "var(--mono)" }}>
              <span>{uploaded.pages} pages</span>
              <span style={{ width: 3, height: 3, borderRadius: 99, background: "var(--ink-4)", display: "inline-block" }} />
              <span>{uploaded.chunks} chunks</span>
              <span style={{ width: 3, height: 3, borderRadius: 99, background: "var(--ink-4)", display: "inline-block" }} />
              <span style={{ color: "var(--ok)" }}>{uploaded.status}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
