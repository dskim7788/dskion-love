const EMOJIS = ["💕", "✨", "💫"];

interface Particle {
  left: number;
  delay: number;
  duration: number;
  emoji: string;
  size: number;
}

function seedParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    left: 10 + ((i * 37) % 80),
    delay: (i * 0.9) % 4,
    duration: 3.5 + ((i * 0.6) % 2.5),
    emoji: EMOJIS[i % EMOJIS.length],
    size: 14 + ((i * 5) % 10),
  }));
}

export default function FloatingParticles({ count }: { count: number }) {
  if (count <= 0) return null;
  const particles = seedParticles(count);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p, i) => (
        <span
          key={i}
          className="absolute bottom-24 animate-float-up drop-shadow"
          style={{
            left: `${p.left}%`,
            fontSize: `${p.size}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}
