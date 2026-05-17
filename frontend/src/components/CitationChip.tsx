import { FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { buildPdfUrl, type Citation } from "@/lib/api";

type Props = {
  citation: Citation;
};

export function CitationChip({ citation }: Props): JSX.Element {
  const handleClick = (): void => {
    window.open(buildPdfUrl(citation.file, citation.page), "_blank");
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
