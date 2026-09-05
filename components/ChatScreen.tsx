"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage, ConversationState, Persona } from "@/lib/types";
import { PHOTO_ONLY_PLACEHOLDER } from "@/lib/types";
import { loadConversation, saveConversation, clearConversation } from "@/lib/storage";
import { useAvatar } from "@/lib/useAvatar";
import { typingDelayMs } from "@/lib/format";
import { detectCasualConsent } from "@/lib/consent";
import { isPushSupported, subscribeToPush, unsubscribeFromPush } from "@/lib/push";
import { pushConversation } from "@/lib/sync";
import { withSubjectParticle, withConjunctionParticle } from "@/lib/korean";
import { downscaleImageFile } from "@/lib/image";
import MessageBubble from "./MessageBubble";
import AffectionBar from "./AffectionBar";
import AvatarImage from "./AvatarImage";
import VideoCallScreen from "./VideoCallScreen";

function newId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function initialState(persona: Persona): ConversationState {
  const useFormalGreeting = !!persona.formalGreeting;
  return {
    personaId: persona.id,
    affection: 5,
    lastInteractionAt: null,
    casualApproved: !useFormalGreeting,
    messages: [
      {
        id: newId(),
        role: "assistant",
        content: useFormalGreeting ? persona.formalGreeting! : persona.greeting,
        createdAt: Date.now(),
      },
    ],
  };
}

const STALE_MS = 12 * 60 * 60 * 1000;

function withWelcomeBack(loaded: ConversationState, persona: Persona): ConversationState {
  if (!loaded.lastInteractionAt) return loaded;
  if (Date.now() - loaded.lastInteractionAt < STALE_MS) return loaded;

  const line =
    persona.welcomeBackLines[Math.floor(Math.random() * persona.welcomeBackLines.length)];

  return {
    ...loaded,
    affection: Math.min(100, loaded.affection + 2),
    lastInteractionAt: Date.now(),
    messages: [
      ...loaded.messages,
      {
        id: newId(),
        role: "assistant",
        content: line,
        createdAt: Date.now(),
      },
    ],
  };
}

export default function ChatScreen({
  persona,
  onBack,
  autoStartCall = false,
  userId,
}: {
  persona: Persona;
  onBack: () => void;
  autoStartCall?: boolean;
  userId?: string | null;
}) {
  const [state, setState] = useState<ConversationState>(() => {
    const loaded = loadConversation(persona.id);
    if (!loaded) return initialState(persona);
    // Older saved conversations predate the formal-greeting flow, so treat
    // them as an already-established, casual relationship.
    const withDefaults = { ...loaded, casualApproved: loaded.casualApproved ?? true };
    return withWelcomeBack(withDefaults, persona);
  });
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [lastFailedText, setLastFailedText] = useState<string | null>(null);
  const [lastFailedImageUrl, setLastFailedImageUrl] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [callMode, setCallMode] = useState(autoStartCall);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasScrolledOnceRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pushFlagKey = `dskion-love:push-subscribed:${persona.id}`;

  async function handlePickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setIsPickingImage(true);
    try {
      const dataUrl = await downscaleImageFile(file);
      setPendingImage(dataUrl);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "이미지를 불러오지 못했어.");
    } finally {
      setIsPickingImage(false);
    }
  }

  useEffect(() => {
    setPushSubscribed(window.localStorage.getItem(pushFlagKey) === "1");
  }, [pushFlagKey]);

  async function handleTogglePush() {
    if (pushBusy) return;
    setPushBusy(true);
    try {
      if (pushSubscribed) {
        await unsubscribeFromPush();
        window.localStorage.removeItem(pushFlagKey);
        setPushSubscribed(false);
      } else {
        await subscribeToPush(persona.id, persona.name);
        window.localStorage.setItem(pushFlagKey, "1");
        setPushSubscribed(true);
      }
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "알림 설정에 실패했어.");
    } finally {
      setPushBusy(false);
    }
  }
  const {
    avatarUrl,
    avatarUrls,
    isGenerating: isGeneratingAvatar,
    generate: generateAvatar,
  } = useAvatar(persona.id, persona.isCustom ? persona.avatarPrompt : undefined);

  useEffect(() => {
    saveConversation(state);
    if (userId) pushConversation(persona.id, state);
  }, [state, userId, persona.id]);

  useEffect(() => {
    if (!scrollRef.current) return;
    // Jump straight to the latest message when the chat first opens (no
    // visible scroll-from-top), then animate smoothly for later updates.
    const behavior = hasScrolledOnceRef.current ? "smooth" : "auto";
    scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior });
    hasScrolledOnceRef.current = true;
  }, [state.messages, isSending]);

  async function handleSend(
    overrideText?: string,
    imageDataUrl?: string,
    options?: { persistImage?: boolean }
  ) {
    const text = (overrideText ?? input).trim();
    if ((!text && !imageDataUrl) || isSending) return;

    const userMessage: ChatMessage = {
      id: newId(),
      role: "user",
      content: text || PHOTO_ONLY_PLACEHOLDER,
      createdAt: Date.now(),
      imageUrl: options?.persistImage ? imageDataUrl : undefined,
    };

    const nextMessages = [...state.messages, userMessage];
    const nextCasualApproved =
      state.casualApproved || (!!persona.formalGreeting && detectCasualConsent(text));
    setState((prev) => ({ ...prev, messages: nextMessages, casualApproved: nextCasualApproved }));
    setInput("");
    setIsSending(true);
    setErrorText(null);
    setLastFailedText(null);
    setLastFailedImageUrl(null);
    setSuggestions([]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personaId: persona.id,
          affection: state.affection,
          casualApproved: nextCasualApproved,
          messages: nextMessages.map((m, i) => ({
            role: m.role,
            content: m.content,
            // Only the message being sent right now can carry a live camera
            // frame — we never persist snapshots into local chat history.
            imageDataUrl: i === nextMessages.length - 1 ? imageDataUrl : undefined,
          })),
          customPersona: persona.isCustom
            ? { name: persona.name, personalityDescription: persona.personalityDescription ?? "" }
            : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "응답을 받지 못했어");
      }

      // A short human-like pause before the reply appears, scaled to its length.
      await new Promise((resolve) => setTimeout(resolve, typingDelayMs(data.reply.length)));

      const assistantMessage: ChatMessage = {
        id: newId(),
        role: "assistant",
        content: data.reply,
        createdAt: Date.now(),
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        affection: Math.min(100, prev.affection + (data.affectionDelta ?? 1)),
        lastInteractionAt: Date.now(),
      }));
      setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : "알 수 없는 오류가 발생했어");
      setLastFailedText(text);
      setLastFailedImageUrl(options?.persistImage ? imageDataUrl ?? null : null);
    } finally {
      setIsSending(false);
    }
  }

  function handleRetry() {
    if (lastFailedText === null) return;
    handleSend(
      lastFailedText,
      lastFailedImageUrl ?? undefined,
      lastFailedImageUrl ? { persistImage: true } : undefined
    );
  }

  function handleSendClick() {
    const imageToSend = pendingImage;
    setPendingImage(null);
    handleSend(undefined, imageToSend ?? undefined, imageToSend ? { persistImage: true } : undefined);
  }

  function handleReset() {
    if (!window.confirm(`${withConjunctionParticle(persona.name)}의 대화 기록을 모두 지울까요?`)) return;
    clearConversation(persona.id);
    setState(initialState(persona));
    setSuggestions([]);
  }

  if (callMode) {
    return (
      <VideoCallScreen
        persona={persona}
        avatarUrl={avatarUrl}
        avatarUrls={avatarUrls}
        isGeneratingAvatar={isGeneratingAvatar}
        onGenerateAvatar={generateAvatar}
        messages={state.messages}
        isSending={isSending}
        onSend={(text, imageDataUrl) => handleSend(text, imageDataUrl)}
        onEndCall={() => setCallMode(false)}
        affection={state.affection}
      />
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-zinc-50 dark:bg-black">
      <header className="flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur px-4 py-3">
        <button
          onClick={onBack}
          className="shrink-0 h-9 w-9 flex items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="뒤로가기"
        >
          ←
        </button>
        <AvatarImage
          persona={persona}
          avatarUrl={avatarUrl}
          className="shrink-0 h-9 w-9 rounded-full"
          emojiClassName="text-lg"
        />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-50">
            {persona.name}
          </div>
          <div className="max-w-[70vw] sm:max-w-xs">
            <AffectionBar affection={state.affection} />
          </div>
        </div>
        {isPushSupported() && (
          <button
            onClick={handleTogglePush}
            disabled={pushBusy}
            className={`shrink-0 h-9 w-9 flex items-center justify-center rounded-full transition-colors disabled:opacity-50 ${
              pushSubscribed
                ? "text-rose-500 bg-rose-50 dark:bg-rose-500/10"
                : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
            aria-label={pushSubscribed ? "알림 끄기" : "알림 받기"}
            title={pushSubscribed ? "가끔 먼저 연락하는 알림 켜짐" : "가끔 먼저 연락하는 알림 받기"}
          >
            {pushSubscribed ? "🔔" : "🔕"}
          </button>
        )}
        <button
          onClick={() => setCallMode(true)}
          className="shrink-0 h-9 w-9 flex items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="영상통화"
          title="영상통화"
        >
          📹
        </button>
        <button
          onClick={handleReset}
          className="shrink-0 text-xs text-zinc-400 hover:text-rose-500 transition-colors"
        >
          초기화
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-6 space-y-4">
        {state.messages.map((message) => (
          <MessageBubble key={message.id} message={message} persona={persona} avatarUrl={avatarUrl} />
        ))}
        {isSending && (
          <div className="flex items-center gap-2 text-xs text-zinc-400 pl-10">
            <span className="inline-flex gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce" />
            </span>
            {withSubjectParticle(persona.name)} 입력 중...
          </div>
        )}
        {errorText && (
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="text-xs text-rose-500">{errorText}</p>
            {lastFailedText !== null && (
              <button
                onClick={handleRetry}
                className="text-xs font-medium text-rose-500 hover:text-rose-600 underline underline-offset-2"
              >
                다시 시도
              </button>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3">
        {suggestions.length > 0 && !isSending && (
          <div className="flex flex-wrap gap-1.5 pb-2 max-w-3xl mx-auto">
            {suggestions.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => handleSend(suggestion)}
                className="max-w-full truncate rounded-full border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300 text-[11px] px-2.5 py-1.5 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
        {pendingImage && (
          <div className="flex items-center gap-2 pb-2 max-w-3xl mx-auto">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pendingImage}
                alt="첨부할 사진"
                className="h-14 w-14 rounded-xl object-cover border border-zinc-200 dark:border-zinc-700"
              />
              <button
                onClick={() => setPendingImage(null)}
                aria-label="사진 제거"
                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-zinc-900 text-white text-[10px] flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            <span className="text-xs text-zinc-400">사진을 함께 보낼게</span>
          </div>
        )}
        <div className="flex items-center gap-2 max-w-3xl mx-auto">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePickImage}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isPickingImage}
            className="shrink-0 h-10 w-10 rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors disabled:opacity-50"
            aria-label="사진 첨부"
            title="사진 첨부"
          >
            📷
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendClick();
              }
            }}
            placeholder={`${persona.name}에게 메시지 보내기...`}
            className="min-w-0 flex-1 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-300 dark:focus:ring-rose-500/50 text-zinc-900 dark:text-zinc-100"
          />
          <button
            onClick={handleSendClick}
            disabled={isSending || (!input.trim() && !pendingImage)}
            className="shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            aria-label="전송"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}
