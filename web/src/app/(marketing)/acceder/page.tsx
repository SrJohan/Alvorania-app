"use client";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight, Calculator, Mail, ShieldCheck, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/display";
import { TextField } from "@/components/ui/form";
import { LogoMark } from "@/components/site/logo";
import { signIn } from "@/lib/data/api";
import { isLive } from "@/lib/env";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// El mismo campo de color del panel de la portada, para que entrar se sienta parte de la web.
const fieldStyle = {
  backgroundColor: "var(--color-accent-soft)",
  backgroundImage:
    "radial-gradient(at 0% 0%, var(--color-field-a) 0, transparent 55%), radial-gradient(at 100% 10%, var(--color-field-b) 0, transparent 50%), radial-gradient(at 40% 100%, var(--color-field-c) 0, transparent 60%)",
};

const promises = [
  { Icon: Calculator, text: "Cálculo gratis" },
  { Icon: UserCheck, text: "Revisión por un asesor" },
  { Icon: ShieldCheck, text: "Nada se presenta sin tu confirmación" },
];

export default function Acceder() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const [formError, setFormError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (name.trim().length < 2) next.name = "Escribe tu nombre.";
    if (!EMAIL.test(email)) next.email = "Introduce un email válido, por ejemplo nombre@correo.es.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    setFormError("");
    try {
      const result = await signIn(email.trim(), name.trim());
      if (result === "check-email") { setSentTo(email.trim()); return; }
      const target = new URLSearchParams(window.location.search).get("next");
      router.push(target && target.startsWith("/app/") ? target : "/app/conectar");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "No hemos podido enviar el enlace.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={fieldStyle} className="grid min-h-[calc(100dvh-64px)] place-items-center px-4 py-14 sm:py-20">
      <div className="anim-rise w-full max-w-[420px]">
        {/* Pestaña de carpeta con el logo: la cuenta es tu expediente, como en el panel de trámites. */}
        <div role="img" aria-label="Alvorania" className="w-fit rounded-t-[16px] bg-surface-raised px-5 pt-3.5 pb-2">
          <LogoMark className="size-8" />
        </div>

        <div className="rounded-[28px] rounded-tl-none bg-surface-raised px-6 pt-7 pb-6 shadow-pop sm:px-9 sm:pt-9 sm:pb-8">
          {sentTo ? (
            <div role="status" className="anim-swap">
              <span aria-hidden className="grid size-12 place-items-center rounded-full bg-accent-soft text-accent"><Mail className="size-5" /></span>
              <h1 className="mt-5 font-display text-[28px] font-bold leading-tight tracking-[-0.04em] text-ink">Revisa tu correo</h1>
              <p className="mt-3 text-text-muted">Te hemos enviado un enlace de acceso a <strong className="font-semibold text-ink">{sentTo}</strong>. Caduca en una hora. Si no lo ves, mira en spam.</p>
              <Button variant="secondary" size="lg" className="mt-7 w-full" onClick={() => setSentTo("")}>Usar otro correo</Button>
            </div>
          ) : (
            <>
              <h1 className="font-display text-[28px] font-bold leading-[1.1] tracking-[-0.04em] text-ink sm:text-[32px] [text-wrap:balance]">Crea tu cuenta o entra</h1>
              <p className="mt-3 text-text-muted">Te enviaremos un enlace de acceso a tu correo. Sin contraseñas.</p>

              <form onSubmit={onSubmit} noValidate className="mt-7 space-y-4">
                <TextField label="Nombre completo" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" error={errors.name} />
                <TextField label="Correo electrónico" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" error={errors.email} />
                <Button type="submit" loading={loading} size="lg" className="group !mt-6 w-full">
                  Continuar con mi correo
                  {!loading && <ArrowRight aria-hidden className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transform-none" />}
                </Button>
              </form>
              {formError && <p role="alert" className="mt-3 text-sm text-danger">{formError}</p>}

              <ul className="mt-7 space-y-2.5 border-t border-border pt-6 text-sm text-text-muted">
                {promises.map(({ Icon, text }) => (
                  <li key={text} className="flex items-center gap-3">
                    <Icon aria-hidden className="size-4 shrink-0 text-accent" />
                    {text}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {!isLive && (
          <div className="mt-4">
            <Notice tone="warning" title="Versión de demostración">
              No se envía ningún correo ni se guarda nada fuera de tu navegador.
            </Notice>
          </div>
        )}
      </div>
    </div>
  );
}
