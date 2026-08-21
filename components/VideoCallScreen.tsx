"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage, Persona } from "@/lib/types";
import { getAffectionStage } from "@/lib/personas";
import AvatarImage from "./AvatarImage";
import FloatingParticles from "./FloatingParticles";

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function VideoCallScreen({
  persona,
  avatarUrl,
  isGeneratingAvatar,
  onGenerateAvatar,
  messages,
  isSending,
  onSend,
  onEndCall,
  affection = 0,
}: {
  persona: Persona;
  avatarUrl: string | null;
  isGeneratingAvatar: boolean;
  onGenerateAvatar: () => void;
  messages: ChatMessage[];
  isSending: boolean;
  onSend: (text: string) => void;
  onEndCall: () => void;
  affection?: number;
}) {
  const [seconds, setSeconds] = useState(0);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isConnecting, setIsConnecting] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsConnecting(false), 1100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isConnecting) return;
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [isConnecting]);

  useEffect(() => {
    if (!cameraOn) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      return;
    }

    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ video: true })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCameraError(null);
      })
      .catch(() => {
        setCameraError("카메라 접근 권한이 필요해");
        setCameraOn(false);
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [cameraOn]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === "assistant");
  const affectionStage = getAffectionStage(affection);
  const particleCount = Math.min(6, Math.max(0, Math.floor(affection / 20)));

  function handleSend() {
    const text = input.trim();
    if (!text || isSending) return;
    onSend(text);
    setInput("");
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="absolute inset-0">
        {avatarUrl ? (
          <AvatarImage
            persona={persona}
            avatarUrl={avatarUrl}
            className="h-full w-full animate-breathe"
          />
        ) : (
          <div
            className={`h-full w-full bg-gradient-to-br ${persona.gradient} flex flex-col items-center justify-center gap-4`}
          >
            <span className="text-7xl">{persona.avatarEmoji}</span>
            <button
              onClick={onGenerateAvatar}
              disabled={isGeneratingAvatar}
              className="text-sm bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full backdrop-blur transition-colors disabled:opacity-50"
            >
              {isGeneratingAvatar ? "사진 생성 중..." : "✨ AI 사진 생성하기"}
            </button>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/40" />
        {!isConnecting && <FloatingParticles count={particleCount} />}
      </div>

      {isConnecting && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-black/50 backdrop-blur-sm">
          <div className="relative">
            <span className="absolute inset-0 rounded-full bg-white/30 animate-pulse-ring" />
            <AvatarImage
              persona={persona}
              avatarUrl={avatarUrl}
              className="relative h-20 w-20 rounded-full border-2 border-white/60"
              emojiClassName="text-3xl"
            />
          </div>
          <div className="text-white text-sm font-medium drop-shadow">
            {persona.name}에게 연결하는 중...
          </div>
        </div>
      )}

      <div className="relative flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <button
          onClick={onEndCall}
          className="h-9 w-9 rounded-full bg-black/30 backdrop-blur text-white flex items-center justify-center active:scale-90 transition-transform"
          aria-label="통화 종료"
        >
          ↓
        </button>
        <div className="text-center text-white">
          <div className="text-sm font-semibold drop-shadow">
            {affectionStage.emoji} {persona.name}
          </div>
          <div className="text-xs text-white/70 drop-shadow">영상통화 중 {formatDuration(seconds)}</div>
        </div>
        <div className="h-9 w-9" />
      </div>

      {cameraOn && (
        <div className="absolute top-20 right-4 w-24 h-32 rounded-xl overflow-hidden border-2 border-white/40 shadow-lg bg-zinc-900">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="h-full w-full object-cover"
            style={{ transform: "scaleX(-1)" }}
          />
        </div>
      )}

      <div className="relative mt-auto flex flex-col gap-3 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        {lastAssistantMessage && (
          <div
            key={lastAssistantMessage.id}
            className="max-w-[85%] self-start rounded-2xl rounded-bl-sm bg-black/40 backdrop-blur px-4 py-2.5 text-sm text-white leading-relaxed animate-fade-in"
          >
            {lastAssistantMessage.content}
          </div>
        )}
        {isSending && (
          <div className="text-xs text-white/70 pl-1">{persona.name}가 입력 중...</div>
        )}
        {cameraError && <div className="text-xs text-rose-300 pl-1">{cameraError}</div>}

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCameraOn((v) => !v)}
            className={`shrink-0 h-11 w-11 rounded-full flex items-center justify-center backdrop-blur transition-all active:scale-90 ${
              cameraOn ? "bg-white text-zinc-900" : "bg-white/20 text-white"
            }`}
            aria-label="카메라 켜기/끄기"
          >
            📷
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={`${persona.name}에게 메시지 보내기...`}
            className="flex-1 rounded-full border border-white/20 bg-black/30 backdrop-blur px-4 py-2.5 text-sm text-white placeholder-white/50 outline-none focus:ring-2 focus:ring-white/40"
          />
          <button
            onClick={handleSend}
            disabled={isSending || !input.trim()}
            className="shrink-0 h-11 w-11 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-90"
            aria-label="전송"
          >
            ➤
          </button>
          <button
            onClick={onEndCall}
            className="shrink-0 h-11 w-11 rounded-full bg-red-500 text-white flex items-center justify-center transition-transform active:scale-90"
            style={{ transform: "rotate(135deg)" }}
            aria-label="통화 종료"
          >
            📞
          </button>
        </div>
      </div>
    </div>
  );
}
