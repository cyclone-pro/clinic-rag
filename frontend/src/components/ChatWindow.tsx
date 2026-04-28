import { type FormEvent, useState } from "react";
import { MessageSquareMore, Send } from "lucide-react";

import { CitationChip } from "@/components/CitationChip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { streamChat, type Citation } from "@/lib/api";

type ChatMessage = {
  question: string;
  answer: string;
  citations: Citation[];
  latencyMs?: number;
};

export function ChatWindow(): JSX.Element {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!question.trim() || isStreaming) {
      return;
    }

    const currentQuestion = question.trim();
    setQuestion("");
    setIsStreaming(true);
    setMessages((prev) => [...prev, { question: currentQuestion, answer: "", citations: [] }]);

    try {
      await streamChat(currentQuestion, {
        onToken: (token) => {
          setMessages((prev) => {
            const copy = [...prev];
            const index = copy.length - 1;
            copy[index] = { ...copy[index], answer: copy[index].answer + token };
            return copy;
          });
        },
        onCitations: (citations) => {
          setMessages((prev) => {
            const copy = [...prev];
            const index = copy.length - 1;
            copy[index] = { ...copy[index], citations };
            return copy;
          });
        },
        onDone: ({ answer, latency_ms }) => {
          setMessages((prev) => {
            const copy = [...prev];
            const index = copy.length - 1;
            copy[index] = { ...copy[index], answer, latencyMs: latency_ms };
            return copy;
          });
        }
      });
    } catch (error) {
      setMessages((prev) => {
        const copy = [...prev];
        const index = copy.length - 1;
        copy[index] = {
          ...copy[index],
          answer: error instanceof Error ? error.message : "Unable to generate answer"
        };
        return copy;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquareMore className="h-5 w-5" />
          ClinicDocs Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="flex h-[70vh] flex-col gap-4">
        <div className="flex-1 space-y-4 overflow-y-auto rounded-md border border-border bg-white p-4">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ask a clinic SOP question to start. Answers include source citations.
            </p>
          ) : null}
          {messages.map((item, idx) => (
            <div key={`${item.question}-${idx}`} className="space-y-2 border-b border-border pb-4">
              <p className="text-sm font-semibold">Q: {item.question}</p>
              <p className="text-sm leading-relaxed">A: {item.answer || "Thinking..."}</p>
              {typeof item.latencyMs === "number" ? (
                <p className="text-xs text-muted-foreground">Latency: {item.latencyMs} ms</p>
              ) : null}
              {item.citations.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {item.citations.map((citation, citationIdx) => (
                    <CitationChip key={`${citation.file}-${citation.page}-${citationIdx}`} citation={citation} />
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <form className="flex gap-2" onSubmit={onSubmit}>
          <Input
            placeholder="Ask about SOP workflows, procedures, or protocols..."
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
          />
          <Button type="submit" disabled={isStreaming}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
