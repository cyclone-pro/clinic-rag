import { useEffect, useState } from "react";
import { RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchQueryLogs, reindexAll, type QueryLog } from "@/lib/api";

export function AdminPanel(): JSX.Element {
  const [logs, setLogs] = useState<QueryLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string>("");

  const loadLogs = async (): Promise<void> => {
    try {
      const data = await fetchQueryLogs();
      setLogs(data);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to load query logs");
    }
  };

  useEffect(() => {
    void loadLogs();
  }, []);

  const handleReindex = async (): Promise<void> => {
    setIsLoading(true);
    setStatus("Re-indexing...");
    try {
      const result = await reindexAll();
      setStatus(`Re-index complete: ${result.indexed_files} files, ${result.chunks} chunks.`);
      await loadLogs();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to re-index");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Admin Panel
          <Button type="button" size="sm" className="gap-2" onClick={handleReindex} disabled={isLoading}>
            <RefreshCcw className="h-4 w-4" />
            {isLoading ? "Re-indexing..." : "Re-index"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Question</TableHead>
              <TableHead>Latency (ms)</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length > 0 ? (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{log.question}</TableCell>
                  <TableCell>{log.latency_ms}</TableCell>
                  <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="text-muted-foreground" colSpan={3}>
                  No query logs yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

