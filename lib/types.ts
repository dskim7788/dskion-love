export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
}

export interface Persona {
  id: string;
  name: string;
  tagline: string;
  avatarEmoji: string;
  gradient: string;
  description: string;
  speechStyle: string;
  greeting: string;
  systemPrompt: string;
}

export interface AffectionStage {
  key: string;
  label: string;
  minPoints: number;
  emoji: string;
}

export interface ConversationState {
  personaId: string;
  messages: ChatMessage[];
  affection: number;
  lastInteractionAt: number | null;
}
