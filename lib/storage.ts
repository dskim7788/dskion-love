import type { ChatMessage, ConversationState } from "./types";

const STORAGE_PREFIX = "dskion-love:conversation:";
const SELECTED_PERSONA_KEY = "dskion-love:selected-persona";

function isBrowser() {
  return typeof window !== "undefined";
}

export function loadConversation(personaId: string): ConversationState | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + personaId);
    if (!raw) return null;
    return JSON.parse(raw) as ConversationState;
  } catch {
    return null;
  }
}

export function saveConversation(state: ConversationState) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(
      STORAGE_PREFIX + state.personaId,
      JSON.stringify(state)
    );
  } catch {
    // localStorage full or unavailable — ignore, chat still works in-memory
  }
}

export function clearConversation(personaId: string) {
  if (!isBrowser()) return;
  window.localStorage.removeItem(STORAGE_PREFIX + personaId);
}

export function hasMetPersona(personaId: string): boolean {
  return loadConversation(personaId) !== null;
}

export function listConversationPersonaIds(): string[] {
  if (!isBrowser()) return [];
  const ids: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      ids.push(key.slice(STORAGE_PREFIX.length));
    }
  }
  return ids;
}

// Appends a proactively-pushed message (from a web push notification) into an
// existing conversation. Silently no-ops if the conversation doesn't exist
// yet, since a subscription can only be created from inside that persona's
// chat screen in the first place.
export function appendPushedMessage(personaId: string, content: string) {
  const existing = loadConversation(personaId);
  if (!existing) return;
  const message: ChatMessage = {
    id: Math.random().toString(36).slice(2) + Date.now().toString(36),
    role: "assistant",
    content,
    createdAt: Date.now(),
  };
  saveConversation({
    ...existing,
    messages: [...existing.messages, message],
    lastInteractionAt: Date.now(),
  });
}

export function getSelectedPersonaId(): string | null {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(SELECTED_PERSONA_KEY);
}

export function setSelectedPersonaId(personaId: string) {
  if (!isBrowser()) return;
  window.localStorage.setItem(SELECTED_PERSONA_KEY, personaId);
}

export function clearSelectedPersona() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(SELECTED_PERSONA_KEY);
}

const AVATAR_PREFIX = "dskion-love:avatar:";
const MAX_AVATARS_PER_PERSONA = 4;

export function loadAvatarUrls(personaId: string): string[] {
  if (!isBrowser()) return [];
  const raw = window.localStorage.getItem(AVATAR_PREFIX + personaId);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Pre-existing single-photo format: a bare "data:image/..." string
    // rather than a JSON array. Treat it as a one-photo set.
  }
  return raw.startsWith("data:") ? [raw] : [];
}

export function addAvatarUrl(personaId: string, dataUrl: string): string[] {
  if (!isBrowser()) return [dataUrl];
  const next = [dataUrl, ...loadAvatarUrls(personaId)].slice(0, MAX_AVATARS_PER_PERSONA);
  try {
    window.localStorage.setItem(AVATAR_PREFIX + personaId, JSON.stringify(next));
  } catch {
    // localStorage full — the new photo just won't persist past this session
  }
  return next;
}

export function clearAvatarUrls(personaId: string) {
  if (!isBrowser()) return;
  window.localStorage.removeItem(AVATAR_PREFIX + personaId);
}
