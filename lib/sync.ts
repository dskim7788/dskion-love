"use client";

import type { ConversationState, Persona } from "./types";
import {
  loadConversation,
  saveConversation,
  listConversationPersonaIds,
} from "./storage";
import { loadCustomPersonas, addCustomPersona } from "./customPersonaStorage";

interface ServerConversationRow {
  persona_id: string;
  state: ConversationState;
}

interface ServerCustomPersonaRow {
  persona_id: string;
  persona: Persona;
}

interface ServerState {
  conversations: ServerConversationRow[];
  customPersonas: ServerCustomPersonaRow[];
}

async function fetchServerState(): Promise<ServerState | null> {
  try {
    const res = await fetch("/api/sync/state");
    if (!res.ok) return null;
    return (await res.json()) as ServerState;
  } catch {
    return null;
  }
}

export function pushConversation(personaId: string, state: ConversationState) {
  fetch("/api/sync/conversation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ personaId, state }),
  }).catch(() => {
    // Best-effort — the local copy already saved regardless of server reachability.
  });
}

export function pushCustomPersona(persona: Persona) {
  fetch("/api/sync/custom-persona", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ personaId: persona.id, persona }),
  }).catch(() => {});
}

export function deleteCustomPersonaOnServer(personaId: string) {
  fetch("/api/sync/custom-persona", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ personaId }),
  }).catch(() => {});
}

function conversationFreshness(state: ConversationState): number {
  const lastMessage = state.messages.length ? state.messages[state.messages.length - 1].createdAt : 0;
  return Math.max(state.lastInteractionAt ?? 0, lastMessage);
}

/**
 * One-time merge run on login: reconciles this browser's localStorage with
 * whatever this account already has saved on the server. For each
 * conversation/custom persona, whichever side is missing it gets it copied
 * in; when both sides have it, the more recently-updated one wins and is
 * pushed to the other side. Returns the merged custom persona list so the
 * caller can update its in-memory state without a second localStorage read.
 */
export async function syncOnLoad(): Promise<{ customPersonas: Persona[] }> {
  const localCustomPersonas = loadCustomPersonas();
  const server = await fetchServerState();
  if (!server) {
    return { customPersonas: localCustomPersonas };
  }

  const localIds = new Set(listConversationPersonaIds());
  const serverConversationMap = new Map(server.conversations.map((row) => [row.persona_id, row.state]));
  const allConversationIds = new Set([...localIds, ...serverConversationMap.keys()]);

  for (const id of allConversationIds) {
    const local = loadConversation(id);
    const serverState = serverConversationMap.get(id);

    if (local && !serverState) {
      pushConversation(id, local);
    } else if (!local && serverState) {
      saveConversation(serverState);
    } else if (local && serverState) {
      if (conversationFreshness(local) >= conversationFreshness(serverState)) {
        pushConversation(id, local);
      } else {
        saveConversation(serverState);
      }
    }
  }

  const localCustomIds = new Set(localCustomPersonas.map((p) => p.id));
  const serverCustomIds = new Set(server.customPersonas.map((row) => row.persona_id));
  const mergedCustomPersonas = [...localCustomPersonas];

  for (const row of server.customPersonas) {
    if (!localCustomIds.has(row.persona_id)) {
      addCustomPersona(row.persona);
      mergedCustomPersonas.push(row.persona);
    }
  }
  for (const persona of localCustomPersonas) {
    if (!serverCustomIds.has(persona.id)) {
      pushCustomPersona(persona);
    }
  }

  return { customPersonas: mergedCustomPersonas };
}
