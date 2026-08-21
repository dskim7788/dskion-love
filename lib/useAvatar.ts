"use client";

import { useEffect, useState, useCallback } from "react";
import { loadAvatarUrl, saveAvatarUrl } from "./storage";

export function useAvatar(personaId: string, customAvatarPrompt?: string) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAvatarUrl(loadAvatarUrl(personaId));
  }, [personaId]);

  const generate = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personaId,
          customPersona: customAvatarPrompt ? { avatarPrompt: customAvatarPrompt } : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "이미지 생성에 실패했어");
      }
      saveAvatarUrl(personaId, data.imageDataUrl);
      setAvatarUrl(data.imageDataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했어");
    } finally {
      setIsGenerating(false);
    }
  }, [personaId, customAvatarPrompt]);

  return { avatarUrl, isGenerating, error, generate };
}
