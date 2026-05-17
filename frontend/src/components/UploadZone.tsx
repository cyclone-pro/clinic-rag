import { type ChangeEvent, type DragEvent, type FormEvent, type ReactNode, useRef, useState } from "react";

import {
  IconArrowRight,
  IconEye,
  IconEyeOff,
  IconLock,
  IconLogout,
  IconPdf,
  IconUpload,
  IconUser,
} from "@/components/Icons";
import { buildPdfUrl, uploadPdf } from "@/lib/api";

type UploadedFile = {
  name: string;
  pages: number;
  chunks: number;
  status: string;
};

type Props = {
  isAuthenticated: boolean;
  userEmail: string | null;
  authError: string;
  isLoggingIn: boolean;
  onLogin: (email: string, password: string) => Promise<void>;
  onLogout: () => void;
};

type CredentialFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: ReactNode;
  type?: string;
  placeholder: string;
  trailing?: ReactNode;
};

function CredentialField({
  label,
  value,
  onChange,
  icon,
  type = "text",
  placeholder,
  trailing,
}: CredentialFieldProps): JSX.Element {
  const [focused, setFocused] = useState(false);

  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 500, color: "var(--ink-2)" }}>{label}</span>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "#fffdf7",
          border: `1px solid ${focused ? "var(--brand)" : "var(--line-2)"}`,
          borderRadius: 10,
          padding: "0 12px",
          height: 42,
          transition: "border-color .15s, box-shadow .15s",
          boxShadow: focused ? "0 0 0 4px rgba(35,78,72,.10)" : "none",
        }}
      >
        <span style={{ color: "var(--ink-3)", display: "flex" }}>{icon}</span>
        <input
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: 14,
            color: "var(--ink)",
          }}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          type={type}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          spellCheck={false}
          autoComplete="off"
        />
        {trailing}
      </div>
    </label>
  );
}

export function UploadZone({
  isAuthenticated,
  userEmail,
  authError,
  isLoggingIn,
  onLogin,
  onLogout,
}: Props): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pct, setPct] = useState(0);
  const [uploaded, setUploaded] = useState<UploadedFile | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const doUpload = async (file: File) => {
    if (!isAuthenticated) {
      setUploadError("Sign in with staff credentials before uploading a PDF.");
      return;
    }

    setUploading(true);
    setUploadError("");
    setPct(0);
    const interval = setInterval(() => {
      setPct((value) => {
        const next = value + 6 + Math.random() * 10;
        return next >= 90 ? 90 : next;
      });
    }, 180);

    try {
      const result = await uploadPdf(file);
      clearInterval(interval);
      setPct(100);
      setUploaded({
        name: result.source_file,
        pages: result.pages_processed,
        chunks: result.chunks_created,
        status: result.extraction_summary,
      });
      setTimeout(() => {
        setUploading(false);
        setPct(0);
      }, 600);
    } catch (error) {
      clearInterval(interval);
      setUploadError(error instanceof Error ? error.message : "Upload failed");
      setUploading(false);
      setPct(0);
    }

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      void doUpload(file);
    }
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDrag(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      void doUpload(file);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void onLogin(email, password);
  };

  return (
    <section style={{ background: "var(--card)", border: "1px solid var(--line-2)", borderRadius: 14, padding: 16, boxShadow: "var(--shadow-sm)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600 }}>Document upload</div>
        <span style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: ".06em", border: "1px solid var(--line-2)", borderRadius: 99, padding: "2px 8px" }}>
          {isAuthenticated ? "Staff access" : "Credentials required"}
        </span>
      </div>

      {!isAuthenticated ? (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>Upload requires staff credentials</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4, lineHeight: 1.5 }}>
              Chat and PDF downloads are public. Only document upload stays protected.
            </div>
          </div>
          <CredentialField
            label="Email"
            value={email}
            onChange={setEmail}
            icon={<IconUser />}
            type="email"
            placeholder="rosa.mendez@clinic.com"
          />
          <CredentialField
            label="Password"
            value={password}
            onChange={setPassword}
            icon={<IconLock />}
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            trailing={(
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                style={{ border: "none", background: "transparent", color: "var(--ink-3)", cursor: "pointer", padding: 4, display: "flex" }}
              >
                {showPassword ? <IconEyeOff /> : <IconEye />}
              </button>
            )}
          />
          {(authError || uploadError) && (
            <div style={{ fontSize: 12, color: "var(--danger)", padding: "8px 10px", background: "rgba(164,69,58,.07)", borderRadius: 8, border: "1px solid rgba(164,69,58,.18)" }}>
              {authError || uploadError}
            </div>
          )}
          <button
            type="submit"
            disabled={isLoggingIn}
            style={{ height: 44, borderRadius: 10, border: "none", background: isLoggingIn ? "var(--brand-3)" : "var(--brand)", color: "#f6f1e6", fontSize: 13, fontWeight: 500, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: isLoggingIn ? "wait" : "pointer" }}
          >
            <span>{isLoggingIn ? "Signing in..." : "Sign in for upload"}</span>
            <IconArrowRight />
          </button>
        </form>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12, padding: "10px 12px", borderRadius: 10, background: "rgba(35,78,72,.05)", border: "1px solid rgba(35,78,72,.14)" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--brand-2)" }}>Signed in for upload</div>
              <div style={{ fontSize: 11, color: "var(--ink-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userEmail}</div>
            </div>
            <button
              type="button"
              onClick={onLogout}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 10px", borderRadius: 8, border: "1px solid var(--line-2)", background: "#fffdf7", fontSize: 11, color: "var(--ink-2)" }}
            >
              <IconLogout />
              <span>Sign out</span>
            </button>
          </div>

          <input ref={inputRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={onInputChange} />

          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "20px 16px", borderRadius: 12, border: `1.5px dashed ${drag ? "var(--brand)" : "var(--line-2)"}`, background: drag ? "rgba(35,78,72,.04)" : "#fffdf7", transition: "border-color .12s, background .12s" }}
          >
            <IconUpload style={{ color: "var(--brand)" }} />
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", marginTop: 6 }}>Drop a PDF or browse</div>
            <div style={{ fontSize: 11, color: "var(--ink-3)" }}>Native text preferred. OCR up to 500 pages.</div>
            <button onClick={() => inputRef.current?.click()} disabled={uploading} style={{ marginTop: 8, padding: "8px 14px", borderRadius: 8, background: "var(--brand)", color: "#f6f1e6", border: "none", fontSize: 12, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <IconUpload />
              {uploading ? "Uploading..." : "Upload SOP PDF"}
            </button>
          </div>

          {uploading && (
            <div style={{ marginTop: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--ink-3)", marginBottom: 4 }}>
                <span>Indexing...</span>
                <span style={{ fontFamily: "var(--mono)" }}>{Math.floor(pct)}%</span>
              </div>
              <div style={{ height: 4, background: "var(--paper-2)", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, var(--brand) 0%, var(--brand-3) 100%)", transition: "width .18s linear" }} />
              </div>
            </div>
          )}

          {uploadError && <div style={{ marginTop: 10, fontSize: 12, color: "var(--danger)", padding: "6px 10px", background: "rgba(164,69,58,.07)", borderRadius: 8, border: "1px solid rgba(164,69,58,.18)" }}>{uploadError}</div>}

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
                <a href={buildPdfUrl(uploaded.name)} target="_blank" rel="noreferrer" style={{ display: "inline-flex", marginTop: 6, fontSize: 11, color: "var(--brand)", fontWeight: 600 }}>
                  Open uploaded PDF
                </a>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
