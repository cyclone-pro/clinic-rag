import { type ChangeEvent, useRef, useState } from "react";
import { UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { uploadPdf } from "@/lib/api";

export function UploadZone(): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  const handleSelectFile = (): void => {
    inputRef.current?.click();
  };

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setIsUploading(true);
    setStatus("Indexing document...");
    try {
      const result = await uploadPdf(file);
      setStatus(
        `${result.source_file}: ${result.pages_processed} pages, ${result.chunks_created} chunks (${result.extraction_summary})`
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Document Upload</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleUpload}
        />
        <Button className="w-full gap-2" onClick={handleSelectFile} disabled={isUploading}>
          <UploadCloud className="h-4 w-4" />
          {isUploading ? "Uploading..." : "Upload SOP PDF"}
        </Button>
        {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
      </CardContent>
    </Card>
  );
}
