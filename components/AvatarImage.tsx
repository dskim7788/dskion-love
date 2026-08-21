import type { Persona } from "@/lib/types";

export default function AvatarImage({
  persona,
  avatarUrl,
  className = "",
  emojiClassName = "text-lg",
}: {
  persona: Persona;
  avatarUrl: string | null;
  className?: string;
  emojiClassName?: string;
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={persona.name}
        className={`object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`bg-gradient-to-br ${persona.gradient} flex items-center justify-center ${className}`}
    >
      <span className={emojiClassName}>{persona.avatarEmoji}</span>
    </div>
  );
}
