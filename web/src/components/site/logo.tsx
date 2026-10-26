import { useId } from "react";

/** Símbolo de Alvorania: una A con degradado violeta cruzada por un trazo lila. Dibujo de la maqueta de marca del usuario. */
export function LogoMark({ className = "size-8", tone = "brand" }: { className?: string; tone?: "brand" | "light" }) {
  const id = useId();
  // Sobre morado oscuro la A pasa a lila claro y blanco para no perderse.
  const [from, to, stroke] = tone === "light" ? ["#d8c8ff", "#ffffff", "#a28be1"] : ["#351279", "#8466d6", "#8d73d3"];
  return (
    <svg aria-hidden viewBox="0 0 100 100" className={className}>
      <defs>
        <linearGradient id={id} x1="0" x2="1">
          <stop stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
      </defs>
      <path d="M8 85 L41 12 Q51 -3 62 14 L95 85 L74 85 L52 32 L29 85 Z" fill={`url(#${id})`} />
      <path d="M14 78 C31 86 54 51 88 68" fill="none" stroke={stroke} strokeLinecap="round" strokeWidth="13" />
    </svg>
  );
}

/** Logo completo: símbolo y nombre en minúsculas, como en la maqueta. El nombre accesible es "Alvorania". */
export function Logo({ size = "md", tone = "brand" }: { size?: "sm" | "md"; tone?: "brand" | "light" }) {
  return (
    <span className="inline-flex items-center gap-2" aria-label="Alvorania" role="img">
      <LogoMark className={size === "sm" ? "size-7" : "size-8"} tone={tone} />
      <span aria-hidden className={`font-extrabold tracking-[-0.07em] ${size === "sm" ? "text-xl" : "text-2xl"} ${tone === "light" ? "text-on-ink" : "text-[#39177d]"}`}>
        alvorania
      </span>
    </span>
  );
}
