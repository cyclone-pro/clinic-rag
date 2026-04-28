import { FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Citation } from "@/lib/api";

type Props = {
  citation: Citation;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export function CitationChip({ citation }: Props): JSX.Element {
  const handleClick = (): void => {
    const encodedFile = encodeURIComponent(citation.file);
    window.open(`${API_BASE_URL}/pdf/${encodedFile}#page=${citation.page}`, "_blank");
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-8 gap-1 text-xs"
      onClick={handleClick}
      title={citation.snippet}
    >
      <FileText className="h-3.5 w-3.5" />
      {citation.file} p.{citation.page}
    </Button>
  );
}
