"use client";

import { useEffect, useState } from "react";
import type { Persona } from "@/lib/types";
import { PERSONAS, getPersona } from "@/lib/personas";
import { getSelectedPersonaId, setSelectedPersonaId, clearSelectedPersona } from "@/lib/storage";
import {
  loadCustomPersonas,
  addCustomPersona,
  removeCustomPersona,
} from "@/lib/customPersonaStorage";
import PersonaSelect from "@/components/PersonaSelect";
import ChatScreen from "@/components/ChatScreen";
import CreatePersonaScreen from "@/components/CreatePersonaScreen";

export default function Home() {
  const [persona, setPersona] = useState<Persona | null | undefined>(undefined);
  const [customPersonas, setCustomPersonas] = useState<Persona[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    const custom = loadCustomPersonas();
    setCustomPersonas(custom);

    const savedId = getSelectedPersonaId();
    const found = getPersona(savedId) ?? custom.find((p) => p.id === savedId) ?? null;
    setPersona(found);
  }, []);

  function handleSelect(p: Persona) {
    setSelectedPersonaId(p.id);
    setPersona(p);
  }

  function handleBack() {
    clearSelectedPersona();
    setPersona(null);
  }

  function handleCreate(p: Persona) {
    addCustomPersona(p);
    setCustomPersonas((prev) => [...prev, p]);
    setShowCreate(false);
    handleSelect(p);
  }

  function handleDelete(p: Persona) {
    if (!window.confirm(`"${p.name}" 캐릭터를 삭제할까요? 대화 기록도 함께 사라져요.`)) return;
    removeCustomPersona(p.id);
    setCustomPersonas((prev) => prev.filter((c) => c.id !== p.id));
  }

  if (persona === undefined) {
    return <div className="flex flex-1 bg-zinc-50 dark:bg-black" />;
  }

  if (showCreate) {
    return <CreatePersonaScreen onCreate={handleCreate} onCancel={() => setShowCreate(false)} />;
  }

  if (!persona) {
    return (
      <PersonaSelect
        personas={[...PERSONAS, ...customPersonas]}
        onSelect={handleSelect}
        onCreateNew={() => setShowCreate(true)}
        onDelete={handleDelete}
      />
    );
  }

  return <ChatScreen persona={persona} onBack={handleBack} />;
}
