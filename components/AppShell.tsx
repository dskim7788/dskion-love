"use client";

import { useEffect, useState } from "react";
import type { Persona } from "@/lib/types";
import { PERSONAS, getPersona } from "@/lib/personas";
import {
  getSelectedPersonaId,
  setSelectedPersonaId,
  clearSelectedPersona,
  hasMetPersona,
} from "@/lib/storage";
import { registerVisit } from "@/lib/streak";
import {
  loadCustomPersonas,
  addCustomPersona,
  removeCustomPersona,
} from "@/lib/customPersonaStorage";
import PersonaSelect from "@/components/PersonaSelect";
import ChatScreen from "@/components/ChatScreen";
import CreatePersonaScreen from "@/components/CreatePersonaScreen";
import BlindDateFlow from "@/components/BlindDateFlow";

export default function AppShell({
  userName,
  userImage,
  onSignOut,
}: {
  userName: string | null | undefined;
  userImage: string | null | undefined;
  onSignOut: () => void;
}) {
  const [persona, setPersona] = useState<Persona | null | undefined>(undefined);
  const [customPersonas, setCustomPersonas] = useState<Persona[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showBlindDate, setShowBlindDate] = useState(false);
  const [streak, setStreak] = useState(0);
  const [metPersonaIds, setMetPersonaIds] = useState<Set<string>>(new Set());
  const [justMatchedId, setJustMatchedId] = useState<string | null>(null);

  useEffect(() => {
    const custom = loadCustomPersonas();
    setCustomPersonas(custom);

    const savedId = getSelectedPersonaId();
    const found = getPersona(savedId) ?? custom.find((p) => p.id === savedId) ?? null;
    setPersona(found);
    setStreak(registerVisit().streak);
    setMetPersonaIds(new Set(PERSONAS.filter((p) => hasMetPersona(p.id)).map((p) => p.id)));
  }, []);

  function handleSelect(p: Persona) {
    setSelectedPersonaId(p.id);
    setPersona(p);
  }

  function handleBack() {
    clearSelectedPersona();
    setPersona(null);
    setMetPersonaIds(new Set(PERSONAS.filter((p) => hasMetPersona(p.id)).map((p) => p.id)));
  }

  function handleMatched(p: Persona) {
    setMetPersonaIds((prev) => new Set(prev).add(p.id));
    setJustMatchedId(p.id);
    setShowBlindDate(false);
    handleSelect(p);
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

  const unmetCandidates = PERSONAS.filter((p) => !metPersonaIds.has(p.id));
  // Once every built-in persona has been met, let the blind date flow
  // re-run against the full roster instead of disappearing entirely.
  const blindDateCandidates = unmetCandidates.length > 0 ? unmetCandidates : PERSONAS;

  if (showBlindDate) {
    return (
      <BlindDateFlow
        candidates={blindDateCandidates}
        onMatched={handleMatched}
        onExit={() => setShowBlindDate(false)}
      />
    );
  }

  if (!persona) {
    const metPersonas = PERSONAS.filter((p) => metPersonaIds.has(p.id));
    return (
      <div className="relative flex flex-1 flex-col">
        <button
          onClick={onSignOut}
          className="absolute top-4 right-4 z-10 flex items-center gap-2 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur border border-zinc-200 dark:border-zinc-800 pl-1.5 pr-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-300 hover:border-rose-300 dark:hover:border-rose-500/50 transition-colors"
        >
          {userImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={userImage} alt={userName ?? "사용자"} className="h-6 w-6 rounded-full object-cover" />
          ) : (
            <span className="h-6 w-6 rounded-full bg-gradient-to-br from-rose-300 to-pink-400 flex items-center justify-center text-[10px]">
              🙂
            </span>
          )}
          <span className="max-w-[7rem] truncate">{userName ?? "사용자"}님</span>
          <span className="text-zinc-400">로그아웃</span>
        </button>
        <PersonaSelect
          personas={[...metPersonas, ...customPersonas]}
          onSelect={handleSelect}
          onCreateNew={() => setShowCreate(true)}
          onDelete={handleDelete}
          streak={streak}
          hasUnmetCandidates
          onStartBlindDate={() => setShowBlindDate(true)}
        />
      </div>
    );
  }

  return (
    <ChatScreen
      persona={persona}
      onBack={handleBack}
      autoStartCall={persona.id === justMatchedId}
    />
  );
}
