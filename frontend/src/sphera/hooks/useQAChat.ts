import { useState, useCallback } from "react";
import { askStudyQuestion } from "../services/spheraService";
import type { QAMessage } from "../types/sphera.types";
import { formatUserErrorMessage } from "@/lib/errorUtils";

interface UseQAChatOptions {
  sessionId: number;
  initialHistory?: QAMessage[];
}

export function useQAChat({ sessionId, initialHistory = [] }: UseQAChatOptions) {
  const [messages, setMessages] = useState<QAMessage[]>(initialHistory);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendQuestion = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || isLoading) return;

      setIsLoading(true);
      setError(null);

      try {
        const res = await askStudyQuestion(sessionId, trimmed);
        if (res.success && res.data) {
          setMessages((prev) => [...prev, res.data]);
        }
      } catch (err: any) {
        setError(formatUserErrorMessage(err, "Une erreur est survenue lors de l'envoi de la question."));
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, isLoading]
  );

  const clearError = () => setError(null);

  return { messages, isLoading, error, sendQuestion, clearError };
}
