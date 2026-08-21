import type { ConversationState } from "./types";

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

export function loadAvatarUrl(personaId: string): string | null {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(AVATAR_PREFIX + personaId);
}

export function saveAvatarUrl(personaId: string, dataUrl: string) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(AVATAR_PREFIX + personaId, dataUrl);
  } catch {
    // localStorage full — avatar just won't persist, generation still shown this session
  }
}

export function clearAvatarUrl(personaId: string) {
  if (!isBrowser()) return;
  window.localStorage.removeItem(AVATAR_PREFIX + personaId);
}
