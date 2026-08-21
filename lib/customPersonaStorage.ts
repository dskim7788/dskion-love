import type { Persona } from "./types";
import { BASE_RULES, buildCustomPersonaBlock } from "./personas";

const CUSTOM_PERSONAS_KEY = "dskion-love:custom-personas";

const GRADIENTS = [
  "from-amber-300 to-orange-400",
  "from-sky-300 to-cyan-400",
  "from-violet-300 to-purple-400",
  "from-lime-300 to-green-400",
  "from-red-300 to-rose-400",
];

function isBrowser() {
  return typeof window !== "undefined";
}

export interface CreatePersonaForm {
  name: string;
  tagline: string;
  personalityDescription: string;
  appearanceDescription: string;
  greeting: string;
}

export function buildCustomPersona(form: CreatePersonaForm): Persona {
  const name = form.name.trim().slice(0, 20) || "친구";
  const personalityDescription = form.personalityDescription.trim().slice(0, 600);
  const personaBlock = buildCustomPersonaBlock({ name, personalityDescription });

  return {
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    tagline: form.tagline.trim().slice(0, 40) || "나만의 커스텀 캐릭터",
    avatarEmoji: "✨",
    gradient: GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)],
    description: personalityDescription || "직접 만든 나만의 AI 컴패니언이야.",
    speechStyle: "",
    greeting: form.greeting.trim() || `안녕, 나는 ${name}이야! 잘 부탁해.`,
    avatarPrompt:
      form.appearanceDescription.trim().slice(0, 300) ||
      `friendly person named ${name}, warm expression, portrait photo`,
    welcomeBackLines: [`오랜만이야! 나 ${name}, 계속 기다렸어.`],
    systemPrompt: `${BASE_RULES}\n\n${personaBlock}`,
    isCustom: true,
    personalityDescription,
  };
}

export function loadCustomPersonas(): Persona[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_PERSONAS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCustomPersonas(personas: Persona[]) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(CUSTOM_PERSONAS_KEY, JSON.stringify(personas));
  } catch {
    // localStorage full or unavailable — the new/updated persona just won't persist
  }
}

export function addCustomPersona(persona: Persona) {
  const personas = loadCustomPersonas();
  saveCustomPersonas([...personas, persona]);
}

export function removeCustomPersona(id: string) {
  const personas = loadCustomPersonas().filter((p) => p.id !== id);
  saveCustomPersonas(personas);
}
