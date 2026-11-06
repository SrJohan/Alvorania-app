import type { JSX, ReactNode } from "react";

const wash = {
  backgroundImage:
    "linear-gradient(to bottom, transparent 40%, var(--color-bg) 100%), radial-gradient(at 12% 0%, var(--color-field-c) 0, transparent 55%), radial-gradient(at 88% 10%, var(--color-field-a) 0, transparent 50%)",
  maskImage: "linear-gradient(to right, transparent 0%, #000 18%, #000 82%, transparent 100%)",
  WebkitMaskImage: "linear-gradient(to right, transparent 0%, #000 18%, #000 82%, transparent 100%)",
};

export function FlowHeader({ step, title, subtitle, progress = 1 }: {
  step: 1 | 2 | 3 | 4;
  title: string;
  subtitle?: ReactNode;
  progress?: number;
}): JSX.Element {
  return (
    <header className="relative -mx-4 -mt-4 px-4 pt-4 md:-mx-8 md:-mt-8 md:px-8 md:pt-8">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[340px]" style={wash} />
      <div className="anim-rise">
        <p className="sr-only">Paso {step} de 4</p>
        <div aria-hidden className="flex w-40 gap-1.5">
          {[1, 2, 3, 4].map((segment) => (
            <span key={segment} className="h-1.5 flex-1 overflow-hidden rounded-pill bg-border-input/60">
              <span className="block h-full origin-left bg-accent transition-transform duration-200 ease-brand motion-reduce:transition-none" style={{ transform: `scaleX(${segment < step ? 1 : segment === step ? Math.max(0, Math.min(1, progress)) : 0})` }} />
            </span>
          ))}
        </div>
        <h1 className="mt-4 font-display text-[34px] font-semibold leading-[1.08] tracking-[-0.04em] text-ink md:text-[44px]">{title}</h1>
        {subtitle && <p className="mt-3 max-w-reading text-text-muted">{subtitle}</p>}
      </div>
    </header>
  );
}
