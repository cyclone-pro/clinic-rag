import { type FormEvent, useEffect, useState } from "react";
import { LogIn, LogOut, ShieldAlert } from "lucide-react";

import { AdminPanel } from "@/components/AdminPanel";
import { ChatWindow } from "@/components/ChatWindow";
import { UploadZone } from "@/components/UploadZone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AUTH_EXPIRED_EVENT, login, setAuthToken } from "@/lib/api";

export function AppPage(): JSX.Element {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const clearSession = (message = ""): void => {
    setSessionToken(null);
    setAuthToken(null);
    localStorage.removeItem("clinicdocs_token");
    setAuthError(message);
  };

  useEffect(() => {
    const cachedToken = localStorage.getItem("clinicdocs_token");
    if (cachedToken) {
      setSessionToken(cachedToken);
      setAuthToken(cachedToken);
    }
  }, []);

  useEffect(() => {
    const handleAuthExpired = (): void => {
      clearSession("Your session expired. Please sign in again.");
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
  }, []);

  const handleSignIn = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setIsLoggingIn(true);
    setAuthError("");
    try {
      const token = await login(email, password);
      setSessionToken(token);
      setAuthToken(token);
      localStorage.setItem("clinicdocs_token", token);
      setPassword("");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (!sessionToken) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-10">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>ClinicDocs AI Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSignIn}>
              <Input
                type="email"
                placeholder="Staff email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <Button className="w-full gap-2" type="submit" disabled={isLoggingIn}>
                <LogIn className="h-4 w-4" />
                {isLoggingIn ? "Signing in..." : "Sign in"}
              </Button>
              {authError ? <p className="text-sm text-red-700">{authError}</p> : null}
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">
      <div className="mb-4 flex flex-col gap-3 rounded-md border border-border bg-muted/70 p-3 text-sm font-medium sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4" />
          For staff reference only — do not input patient PHI
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full gap-2 sm:w-auto"
          onClick={() => clearSession()}
        >
          <LogOut className="h-4 w-4" />
          Log out
        </Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <ChatWindow />
        <div className="space-y-4">
          <UploadZone />
          <AdminPanel />
        </div>
      </div>
    </main>
  );
}
