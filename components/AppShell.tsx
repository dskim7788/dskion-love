"use client";

import { useEffect, useState } from "react";
import type { Persona } from "@/lib/types";
import { getPersona } from "@/lib/personas";
import { getSelectedPersonaId, setSelectedPersonaId, clearSelectedPersona } from "@/lib/storage";
import PersonaSelect from "@/components/PersonaSelect";
import ChatScreen from "@/components/ChatScreen";

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
        <PersonaSelect onSelect={handleSelect} />
      </div>
    );
  }

  return <ChatScreen persona={persona} onBack={handleBack} />;
}
