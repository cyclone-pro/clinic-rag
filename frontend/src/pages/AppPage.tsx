import { type FormEvent, useEffect, useRef, useState } from "react";

import { AdminPanel } from "@/components/AdminPanel";
import { ChatWindow } from "@/components/ChatWindow";
import {
  IconArrowRight, IconBookmark, IconClock, IconDoc, IconEye, IconEyeOff,
  IconLock, IconLogout, IconPin, IconPlus, IconSearch, IconShield, IconUser,
  Mark,
} from "@/components/Icons";
import { UploadZone } from "@/components/UploadZone";
import {
  AUTH_EXPIRED_EVENT, login, setAuthToken, validateToken, type Citation,
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

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

function getDisplayName(email: string | undefined | null): string {
  if (!email) return "there";
  const local = email.split("@")[0];
  const first = local.split(/[._]/)[0];
  return first.charAt(0).toUpperCase() + first.slice(1);
}

function getInitials(email: string | undefined | null): string {
  if (!email) return "??";
  const local = email.split("@")[0];
  const parts = local.split(/[._]/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return local.slice(0, 2).toUpperCase();
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1).trim() + "…";
}

function formatWhen(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

/* ─── Login page ─────────────────────────────────────────────────────────── */

type LoginProps = {
  onLogin: (email: string, password: string) => Promise<void>;
  error: string;
  loading: boolean;
};

function LoginView({ onLogin, error, loading }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void onLogin(email, password);
  };

  return (
    <div style={{ position: "relative", height: "100vh", display: "grid", gridTemplateRows: "auto 1fr", overflow: "hidden", background: "var(--paper)" }}>
      {/* backgrounds */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0, background: "radial-gradient(900px 540px at 85% 110%, rgba(35,78,72,.10), transparent 60%), radial-gradient(700px 480px at 8% -10%, rgba(201,122,74,.08), transparent 60%)" }} />
      <div style={{ position: "absolute", inset: 0, zIndex: 0, opacity: .35, backgroundImage: "linear-gradient(to right, rgba(58,68,65,.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(58,68,65,.06) 1px, transparent 1px)", backgroundSize: "56px 56px", maskImage: "radial-gradient(800px 600px at 50% 50%, black 30%, transparent 80%)" }} />
      <div style={{ position: "absolute", right: -180, top: -180, width: 520, height: 520, borderRadius: "50%", background: "conic-gradient(from 200deg at 50% 50%, rgba(35,78,72,.18), rgba(35,78,72,0) 60%)", filter: "blur(8px)", zIndex: 0 }} />

      {/* topbar */}
      <header style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 40px" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Mark size={22} />
          <div>
            <div style={{ fontFamily: "var(--serif)", fontWeight: 500, fontSize: 18, letterSpacing: "-0.01em", color: "var(--ink)" }}>ClinicDocs</div>
            <div style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: ".04em", textTransform: "uppercase", marginTop: 1 }}>Internal SOP Assistant</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "var(--ink-3)" }}>
          <span style={{ width: 7, height: 7, borderRadius: 99, background: "var(--ok)", boxShadow: "0 0 0 4px rgba(58,163,122,.15)", display: "inline-block" }} />
          <span>All systems normal</span>
        </div>
      </header>

      {/* main 2-col */}
      <main style={{ position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: "minmax(420px,1fr) minmax(440px,520px)", gap: 48, padding: "8px 40px 40px", alignItems: "stretch", minHeight: 0 }}>
        {/* left editorial */}
        <section style={{ display: "flex", flexDirection: "column", justifyContent: "center", paddingRight: 24, maxWidth: 640 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--ink-3)", fontWeight: 500 }}>
            <span style={{ width: 6, height: 6, background: "var(--accent)", borderRadius: 99, display: "inline-block" }} />
            <span>Staff Portal · SOP Reference</span>
          </div>
          <h1 style={{ fontFamily: "var(--serif)", fontWeight: 400, fontSize: "clamp(40px, 4.6vw, 64px)", lineHeight: 1.04, letterSpacing: "-0.02em", color: "var(--ink)", marginTop: 18 }}>
            A quiet place for the <em style={{ fontStyle: "italic", color: "var(--brand)" }}>protocols</em> your team relies on.
          </h1>
          <p style={{ marginTop: 18, fontSize: 16, lineHeight: 1.55, color: "var(--ink-2)", maxWidth: 520 }}>
            Search procedures, surface citations, and answer questions from your indexed standard-operating documents — without ever leaving the floor.
          </p>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 0, marginTop: 36, paddingTop: 24, borderTop: "1px solid var(--line-2)" }}>
            {[["216", "SOP pages indexed"], ["3.9s", "Median answer time"], ["262", "Searchable chunks"]].map(([n, l], i) => (
              <div key={i} style={{ display: "flex", flex: 1, alignItems: "flex-end", gap: 0 }}>
                {i > 0 && <div style={{ width: 1, alignSelf: "stretch", background: "var(--line-2)", margin: "0 24px" }} />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "var(--serif)", fontSize: 32, fontWeight: 500, color: "var(--ink)", letterSpacing: "-0.02em" }}>{n}</div>
                  <div style={{ marginTop: 4, fontSize: 12, color: "var(--ink-3)" }}>{l}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 28, padding: "14px 16px", background: "rgba(35,78,72,.05)", border: "1px solid rgba(35,78,72,.15)", borderRadius: 10, display: "flex", gap: 12, alignItems: "flex-start", maxWidth: 520 }}>
            <IconShield style={{ color: "var(--brand)", flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--brand-2)" }}>For staff reference only</div>
              <div style={{ fontSize: 12, color: "var(--ink-2)", lineHeight: 1.5, marginTop: 2 }}>Do not enter patient PHI. Sessions are logged for audit &amp; retraining of the index.</div>
            </div>
          </div>
        </section>

        {/* right card */}
        <section style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: "100%", maxWidth: 460, position: "relative" }}>
            <div style={{ position: "absolute", top: -12, right: 0, fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-3)", letterSpacing: ".06em" }}>01 / Sign in</div>
            <form style={{ background: "var(--card)", border: "1px solid var(--line-2)", borderRadius: 20, padding: "32px 32px 28px", boxShadow: "var(--shadow-lg)", display: "flex", flexDirection: "column", gap: 16 }} onSubmit={submit} noValidate>
              <div style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 11, color: "var(--brand)", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>Welcome back</div>
                <h2 style={{ fontFamily: "var(--serif)", fontWeight: 500, fontSize: 28, letterSpacing: "-0.015em", color: "var(--ink)", marginTop: 6 }}>Sign in to continue</h2>
                <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 6, lineHeight: 1.5 }}>Use your clinic credentials. Single sign-on coming Q3.</div>
              </div>

              <LoginField label="Email" hint="Usually firstname.lastname@clinic.com" icon={<IconUser />} value={email} onChange={setEmail} placeholder="rosa.mendez@clinic.com" type="email" autoFocus />
              <LoginField
                label="Password"
                icon={<IconLock />}
                value={password}
                onChange={setPassword}
                type={show ? "text" : "password"}
                placeholder="••••••••••"
                trailing={
                  <button type="button" onClick={() => setShow(s => !s)} style={{ border: "none", background: "transparent", color: "var(--ink-3)", cursor: "pointer", padding: 4, display: "flex", borderRadius: 6 }}>
                    {show ? <IconEyeOff /> : <IconEye />}
                  </button>
                }
                rightLink={<a href="#" style={{ fontSize: 12, color: "var(--brand)", fontWeight: 500, borderBottom: "1px dotted rgba(35,78,72,.4)" }}>Forgot?</a>}
              />

              {error && (
                <div style={{ fontSize: 12, color: "var(--danger)", display: "flex", alignItems: "center", gap: 8, background: "rgba(164,69,58,.07)", padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(164,69,58,.18)" }}>
                  <span style={{ width: 6, height: 6, borderRadius: 99, background: "var(--danger)", flexShrink: 0, display: "inline-block" }} />
                  {error}
                </div>
              )}

              <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--ink-2)", cursor: "pointer", userSelect: "none", marginTop: 2 }}>
                <span style={{ position: "relative", width: 18, height: 18, display: "inline-flex", flexShrink: 0 }}>
                  <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", margin: 0 }} />
                  <span style={{ width: 18, height: 18, borderRadius: 5, border: remember ? "none" : "1.5px solid var(--line-2)", background: remember ? "var(--brand)" : "#fffdf7", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}>
                    {remember && <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5.2l2 2L8 3" stroke="#f6f1e6" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </span>
                </span>
                <span>Keep me signed in on this device</span>
              </label>

              <button type="submit" disabled={loading} style={{ marginTop: 8, height: 48, borderRadius: 10, border: "none", background: loading ? "var(--brand-3)" : "var(--brand)", color: "#f6f1e6", fontSize: 14, fontWeight: 500, letterSpacing: ".02em", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: loading ? "wait" : "pointer", boxShadow: "inset 0 1px 0 rgba(255,255,255,.06)" }}>
                <span>{loading ? "Signing in…" : "Enter"}</span>
                <IconArrowRight />
              </button>

              <div style={{ display: "flex", justifyContent: "center", gap: 6, fontSize: 12, color: "var(--ink-3)", marginTop: 6, paddingTop: 16, borderTop: "1px dashed var(--line-2)" }}>
                <span>Need access?</span>
                <a href="#" style={{ color: "var(--brand)", fontWeight: 500, borderBottom: "1px dotted rgba(35,78,72,.4)" }}>Contact your administrator</a>
              </div>
            </form>
            <div style={{ marginTop: 18, padding: "0 4px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "var(--ink-4)" }}>
              <span>ClinicDocs AI · St. Louis Health Network</span>
              <span style={{ display: "flex", gap: 14 }}>
                {["Privacy", "Acceptable use", "Help"].map(l => <a key={l} href="#" style={{ color: "var(--ink-3)" }}>{l}</a>)}
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

type LoginFieldProps = {
  label: string;
  hint?: string;
  icon: React.ReactNode;
  trailing?: React.ReactNode;
  rightLink?: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoFocus?: boolean;
};

function LoginField({ label, hint, icon, trailing, rightLink, value, onChange, type = "text", placeholder, autoFocus }: LoginFieldProps) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <label style={{ fontSize: 12, fontWeight: 500, color: "var(--ink-2)" }}>{label}</label>
        {rightLink}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fffdf7", border: `1px solid ${focus ? "var(--brand)" : "var(--line-2)"}`, borderRadius: 10, padding: "0 12px", height: 44, transition: "border-color .15s, box-shadow .15s", boxShadow: focus ? "0 0 0 4px rgba(35,78,72,.10)" : "none" }}>
        <span style={{ color: "var(--ink-3)", display: "flex" }}>{icon}</span>
        <input style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 14, color: "var(--ink)", letterSpacing: ".01em" }} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} type={type} autoFocus={autoFocus} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} spellCheck={false} autoComplete="off" />
        {trailing}
      </div>
      {hint && <div style={{ fontSize: 11, color: "var(--ink-4)" }}>{hint}</div>}
    </div>
  );
}

/* ─── Main layout ─────────────────────────────────────────────────────────── */

type MainProps = {
  userEmail: string | null;
  messages: ChatMessage[];
  isStreaming: boolean;
  activeId: number | null;
  composerRef: React.RefObject<HTMLTextAreaElement>;
  onAsk: (q: string) => void;
  onActivate: (id: number) => void;
  onPin: (id: number) => void;
  onLogout: () => void;
};

function MainLayout({ userEmail, messages, isStreaming, activeId, composerRef, onAsk, onActivate, onPin, onLogout }: MainProps) {
  const displayName = getDisplayName(userEmail);
  const initials = getInitials(userEmail);
  const activeMsg = messages.find(m => m.id === activeId) ?? messages[messages.length - 1] ?? null;
  const pinned = messages.filter(m => m.pinned);
  const recent = messages.filter(m => !m.pending).slice(-5).reverse();
  const avgLatency = messages.filter(m => m.latencyMs).reduce((s, m) => s + (m.latencyMs ?? 0), 0) / Math.max(1, messages.filter(m => m.latencyMs).length);

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateRows: "auto 1fr", position: "relative", background: "var(--paper)" }}>
      {/* bg */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", background: "radial-gradient(900px 540px at 92% 0%, rgba(35,78,72,.08), transparent 55%), radial-gradient(700px 500px at 0% 100%, rgba(201,122,74,.06), transparent 60%)" }} />
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", opacity: .4, backgroundImage: "linear-gradient(to right, rgba(58,68,65,.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(58,68,65,.05) 1px, transparent 1px)", backgroundSize: "56px 56px" }} />

      {/* header */}
      <header style={{ position: "sticky", top: 0, zIndex: 10, display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: 24, padding: "14px 28px", background: "rgba(246,241,230,.86)", backdropFilter: "saturate(140%) blur(10px)", borderBottom: "1px solid var(--line-2)" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Mark size={24} />
          <div>
            <div style={{ fontFamily: "var(--serif)", fontWeight: 500, fontSize: 18, letterSpacing: "-0.01em", color: "var(--ink)" }}>ClinicDocs <span style={{ color: "var(--ink-4)", margin: "0 2px" }}>/</span> Assistant</div>
            <div style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: ".02em", marginTop: 1 }}>St. Louis Health Network · Internal SOP reference</div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 99, background: "rgba(35,78,72,.06)", border: "1px solid rgba(35,78,72,.18)", fontSize: 12, color: "var(--ink-2)" }}>
            <IconShield style={{ color: "var(--brand)" }} />
            <span><b style={{ color: "var(--brand-2)", fontWeight: 600 }}>For staff reference only</b> — do not input patient PHI.</span>
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
              <div style={{ fontSize: 10.5, color: "var(--ink-3)" }}>{userEmail}</div>
            </div>
          </div>
          <button onClick={onLogout} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8, border: "1px solid var(--line-2)", background: "#fffdf7", fontSize: 12, color: "var(--ink-2)" }}>
            <IconLogout />
            <span>Log out</span>
          </button>
        </div>
      </header>

      {/* grid */}
      <main style={{ display: "grid", gridTemplateColumns: "260px 1fr 360px", gap: 24, padding: "24px 28px", minHeight: 0, position: "relative", zIndex: 1 }}>
        {/* left nav */}
        <aside style={{ display: "flex", flexDirection: "column", gap: 18, position: "sticky", top: 80, alignSelf: "start", maxHeight: "calc(100vh - 100px)", overflow: "auto", paddingRight: 4 }}>
          <button onClick={() => composerRef.current?.focus()} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: "var(--brand)", color: "#f6f1e6", border: "none", fontSize: 13, fontWeight: 500, boxShadow: "inset 0 1px 0 rgba(255,255,255,.06)" }}>
            <IconPlus />
            <span>New question</span>
            <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,.12)", color: "#f6f1e6" }}>⌘K</span>
          </button>

          <NavSection label="Pinned answers">
            {pinned.map(m => (
              <NavItem key={m.id} active={activeId === m.id} onClick={() => onActivate(m.id)} icon={<IconPin />}>{truncate(m.question, 38)}</NavItem>
            ))}
            {pinned.length === 0 && <div style={{ padding: "6px 8px", fontSize: 12, color: "var(--ink-4)", fontStyle: "italic" }}>Pin any answer to keep it here.</div>}
          </NavSection>

          <NavSection label="Recent">
            {recent.map(m => (
              <NavItem key={m.id} icon={<IconClock />} meta={formatWhen(m.createdAt)} onClick={() => onActivate(m.id)} active={activeId === m.id}>{truncate(m.question, 32)}</NavItem>
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
              <span style={{ width: 7, height: 7, borderRadius: 99, background: "var(--ok)", boxShadow: "0 0 0 4px rgba(58,163,122,.15)", display: "inline-block" }} />
              <span>Index healthy</span>
            </div>
            <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 4, fontFamily: "var(--mono)" }}>262 chunks · 216 pages · v2.4</div>
          </div>
        </aside>

        {/* center */}
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

        {/* right */}
        <aside style={{ display: "flex", flexDirection: "column", gap: 14, position: "sticky", top: 80, alignSelf: "start", maxHeight: "calc(100vh - 100px)", overflow: "auto", paddingLeft: 2 }}>
          <ActiveSourcesPanel turn={activeMsg} />
          <UploadZone />
          <AdminPanel />
        </aside>
      </main>
    </div>
  );
}

function NavSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600, padding: "0 8px" }}>{label}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>{children}</div>
    </div>
  );
}

function NavItem({ children, icon, meta, active, onClick }: { children: React.ReactNode; icon: React.ReactNode; meta?: string; active?: boolean; onClick?: () => void }) {
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
      {sources.length > 0 ? sources.slice(0, 4).map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 0", borderTop: "1px dashed var(--line-2)" }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--brand)", fontWeight: 600, marginTop: 1 }}>[{i + 1}]</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{truncate(s.file, 30)}</div>
            <div style={{ fontSize: 11, color: "var(--ink-3)", lineHeight: 1.45, marginTop: 2, fontStyle: "italic" }}>{truncate(s.snippet, 64)}</div>
          </div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-2)", marginLeft: 6, whiteSpace: "nowrap" }}>p.{s.page}</div>
        </div>
      )) : (
        <div style={{ padding: "8px 0" }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-2)" }}>No citations.</div>
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>This question fell outside the indexed corpus.</div>
        </div>
      )}
    </section>
  );
}

/* ─── Root component ──────────────────────────────────────────────────────── */

export function AppPage(): JSX.Element | null {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [authError, setAuthError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

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
    if (!cachedToken) { setIsValidating(false); return; }
    setAuthToken(cachedToken);
    validateToken()
      .then(info => {
        if (info) { setSessionToken(cachedToken); setUserEmail(info.email ?? null); }
        else clearSession("Your session expired. Please sign in again.");
      })
      .catch(() => clearSession("Your session expired. Please sign in again."))
      .finally(() => setIsValidating(false));
  }, []);

  useEffect(() => {
    const handle = (e: Event) => {
      const detail = e instanceof CustomEvent && typeof e.detail === "string" ? e.detail : "";
      clearSession(detail || "Your session expired. Please sign in again.");
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, handle);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handle);
  }, []);

  const handleLogin = async (email: string, password: string) => {
    if (!email || !password) { setAuthError("Enter your email and password to continue."); return; }
    setIsLoggingIn(true);
    setAuthError("");
    try {
      const token = await login(email, password);
      setAuthToken(token);
      setSessionToken(token);
      setUserEmail(email);
      localStorage.setItem("clinicdocs_token", token);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => clearSession();

  const handleAsk = async (question: string) => {
    const { streamChat } = await import("@/lib/api");
    const id = Date.now();
    const newMsg: ChatMessage = { id, question, answer: "", citations: [], pending: true, pinned: false, createdAt: new Date() };
    setMessages(prev => [...prev, newMsg]);
    setActiveId(id);
    setIsStreaming(true);
    try {
      await streamChat(question, {
        onToken: token => setMessages(prev => prev.map(m => m.id === id ? { ...m, answer: m.answer + token } : m)),
        onCitations: citations => setMessages(prev => prev.map(m => m.id === id ? { ...m, citations } : m)),
        onDone: ({ answer, latency_ms }) => setMessages(prev => prev.map(m => m.id === id ? { ...m, answer, latencyMs: latency_ms, pending: false } : m)),
      });
    } catch (err) {
      setMessages(prev => prev.map(m => m.id === id ? { ...m, answer: err instanceof Error ? err.message : "Unable to generate answer", pending: false } : m));
    } finally {
      setIsStreaming(false);
    }
  };

  const handlePin = (id: number) => setMessages(prev => prev.map(m => m.id === id ? { ...m, pinned: !m.pinned } : m));
  const handleActivate = (id: number) => setActiveId(id);

  if (isValidating) return null;

  if (!sessionToken) {
    return <LoginView onLogin={handleLogin} error={authError} loading={isLoggingIn} />;
  }

  return (
    <MainLayout
      userEmail={userEmail}
      messages={messages}
      isStreaming={isStreaming}
      activeId={activeId}
      composerRef={composerRef}
      onAsk={handleAsk}
      onActivate={handleActivate}
      onPin={handlePin}
      onLogout={handleLogout}
    />
  );
}
