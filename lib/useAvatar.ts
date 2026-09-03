"use client";

import { useEffect, useState, useCallback } from "react";
import { loadAvatarUrls, addAvatarUrl } from "./storage";

export function useAvatar(personaId: string, customAvatarPrompt?: string) {
  const [avatarUrls, setAvatarUrls] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAvatarUrls(loadAvatarUrls(personaId));
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
      // Each generation adds a new photo to this persona's rotating set
      // (capped in storage.ts) rather than replacing the previous one.
      setAvatarUrls(addAvatarUrl(personaId, data.imageDataUrl));
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했어");
    } finally {
      setIsGenerating(false);
    }
  }, [personaId, customAvatarPrompt]);

  return {
    // Most-recently-generated photo, for spots that only show one (cards,
    // headers, message bubbles).
    avatarUrl: avatarUrls[0] ?? null,
    // The full rotating set, for spots that cycle through them (video call).
    avatarUrls,
    isGenerating,
    error,
    generate,
  };
}
