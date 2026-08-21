"use client";

import { useEffect, useState } from "react";
import type { Persona } from "@/lib/types";
import { getPersona } from "@/lib/personas";
import { getSelectedPersonaId, setSelectedPersonaId, clearSelectedPersona } from "@/lib/storage";
import PersonaSelect from "@/components/PersonaSelect";
import ChatScreen from "@/components/ChatScreen";

export default function Home() {
  const [persona, setPersona] = useState<Persona | null | undefined>(undefined);

  useEffect(() => {
    const savedId = getSelectedPersonaId();
    setPersona(getPersona(savedId) ?? null);
  }, []);

  function handleSelect(p: Persona) {
    setSelectedPersonaId(p.id);
    setPersona(p);
  }

  function handleBack() {
    clearSelectedPersona();
    setPersona(null);
  }

  if (persona === undefined) {
    return <div className="flex flex-1 bg-zinc-50 dark:bg-black" />;
  }

  if (!persona) {
    return <PersonaSelect onSelect={handleSelect} />;
  }

  return <ChatScreen persona={persona} onBack={handleBack} />;
}
