"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage, ConversationState, Persona } from "@/lib/types";
import { loadConversation, saveConversation, clearConversation } from "@/lib/storage";
import { useAvatar } from "@/lib/useAvatar";
import MessageBubble from "./MessageBubble";
import AffectionBar from "./AffectionBar";
import AvatarImage from "./AvatarImage";
import VideoCallScreen from "./VideoCallScreen";

function newId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function initialState(persona: Persona): ConversationState {
  return {
    personaId: persona.id,
    affection: 5,
    lastInteractionAt: null,
    messages: [
      {
        id: newId(),
        role: "assistant",
        content: persona.greeting,
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
}: {
  persona: Persona;
  onBack: () => void;
}) {
  const [state, setState] = useState<ConversationState>(() => {
    const loaded = loadConversation(persona.id);
    return loaded ? withWelcomeBack(loaded, persona) : initialState(persona);
  });
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [callMode, setCallMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { avatarUrl, isGenerating: isGeneratingAvatar, generate: generateAvatar } = useAvatar(
    persona.id
  );

  useEffect(() => {
    saveConversation(state);
  }, [state]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [state.messages, isSending]);

  async function handleSend(overrideText?: string) {
    const text = (overrideText ?? input).trim();
    if (!text || isSending) return;

    const userMessage: ChatMessage = {
      id: newId(),
      role: "user",
      content: text,
      createdAt: Date.now(),
    };

    const nextMessages = [...state.messages, userMessage];
    setState((prev) => ({ ...prev, messages: nextMessages }));
    setInput("");
    setIsSending(true);
    setErrorText(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personaId: persona.id,
          affection: state.affection,
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "응답을 받지 못했어");
      }

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
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : "알 수 없는 오류가 발생했어");
    } finally {
      setIsSending(false);
    }
  }

  function handleReset() {
    if (!window.confirm(`${persona.name}와의 대화 기록을 모두 지울까요?`)) return;
    clearConversation(persona.id);
    setState(initialState(persona));
  }

  if (callMode) {
    return (
      <VideoCallScreen
        persona={persona}
        avatarUrl={avatarUrl}
        isGeneratingAvatar={isGeneratingAvatar}
        onGenerateAvatar={generateAvatar}
        messages={state.messages}
        isSending={isSending}
        onSend={(text) => handleSend(text)}
        onEndCall={() => setCallMode(false)}
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col h-dvh bg-zinc-50 dark:bg-black">
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

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
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
            {persona.name}가 입력 중...
          </div>
        )}
        {errorText && (
          <p className="text-center text-xs text-rose-500">{errorText}</p>
        )}
      </div>

      <div className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3">
        <div className="flex items-center gap-2 max-w-3xl mx-auto">
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
            className="flex-1 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-300 dark:focus:ring-rose-500/50 text-zinc-900 dark:text-zinc-100"
          />
          <button
            onClick={() => handleSend()}
            disabled={isSending || !input.trim()}
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
