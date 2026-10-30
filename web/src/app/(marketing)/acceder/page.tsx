"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Calculator, Mail, ShieldCheck, UserCheck } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/button";
import { Notice } from "@/components/ui/display";
import { PasswordField, TextField } from "@/components/ui/form";
import { LogoMark } from "@/components/site/logo";
import { requestPasswordReset, signIn, signUp } from "@/lib/data/api";
import { NoAccountError } from "@/lib/data/no-account";
import { isLive } from "@/lib/env";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Mismo mínimo que exige el servidor; entrar solo pide que no esté vacía para no revelar la política a quien no tiene cuenta.
const MIN_PASSWORD = 8;

type Mode = "entrar" | "crear" | "recuperar";
type Errors = { name?: string; email?: string; password?: string };

// El mismo campo de color del panel de la portada, para que entrar se sienta parte de la web.
const fieldStyle = {
  backgroundColor: "var(--color-accent-soft)",
  backgroundImage:
    "radial-gradient(at 0% 0%, var(--color-field-a) 0, transparent 55%), radial-gradient(at 100% 10%, var(--color-field-b) 0, transparent 50%), radial-gradient(at 40% 100%, var(--color-field-c) 0, transparent 60%)",
};

const promises = [
  { Icon: Calculator, text: "Gratis hasta que decidas" },
  { Icon: UserCheck, text: "Tu gestor, con nombre" },
  { Icon: ShieldCheck, text: "Tus datos viajan cifrados y solo los ve tu gestor" },
];

export default function Acceder() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("entrar");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const [reset, setReset] = useState<{ email: string; demoLink: boolean } | null>(null);
  const [formError, setFormError] = useState("");
  const [info, setInfo] = useState("");
  const [saliendo, setSaliendo] = useState(false);
  const destinoPendiente = useRef<string | null>(null);
  const temporizadorSalida = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (temporizadorSalida.current !== null) clearTimeout(temporizadorSalida.current);
    destinoPendiente.current = null;
  }, []);

  function finalizarSalida() {
    const destino = destinoPendiente.current;
    if (!destino) return;
    destinoPendiente.current = null;
    if (temporizadorSalida.current !== null) clearTimeout(temporizadorSalida.current);
    router.push(destino);
  }

  function iniciarSalida(destino: string) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      router.push(destino);
      return;
    }
    destinoPendiente.current = destino;
    setSaliendo(true);
    // Respaldo si el navegador no entrega el evento de fin del símbolo.
    temporizadorSalida.current = setTimeout(finalizarSalida, 800);
  }
  const creating = mode === "crear";
  const recovering = mode === "recuperar";

  function switchMode(next: Mode) {
    setMode(next);
    setErrors({});
    setFormError("");
    setInfo("");
    setPassword("");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next: Errors = {};
    if (creating && name.trim().length < 2) next.name = "Escribe tu nombre.";
    if (!EMAIL.test(email)) next.email = "Introduce un email válido, por ejemplo nombre@correo.es.";
    if (!recovering && (creating ? password.length < MIN_PASSWORD : !password)) {
      next.password = creating ? `Usa al menos ${MIN_PASSWORD} caracteres.` : "Escribe tu contraseña.";
    }
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    setFormError("");
    try {
      if (recovering) {
        setReset({ email: email.trim(), ...(await requestPasswordReset(email.trim())) });
        return;
      }
      let home = "/app/conectar";
      if (creating) {
        const result = await signUp({ fullName: name.trim(), email: email.trim(), password });
        if (result === "check-email") { setSentTo(email.trim()); return; }
      } else {
        home = await signIn(email.trim(), password);
      }
      // `next` solo vale dentro del área del rol: un asesor no acaba en /app ni un cliente en /asesor.
      const target = new URLSearchParams(window.location.search).get("next");
      iniciarSalida(target && target.startsWith(home === "/asesor" ? "/asesor" : "/app/") ? target : home);
    } catch (err) {
      if (err instanceof NoAccountError) {
        // El correo ya está escrito: pasa a crear la cuenta con él y deja el cursor en el nombre.
        switchMode("crear");
        setInfo(`${err.message} Créala ahora, es gratis.`);
        return;
      }
      setFormError(err instanceof Error ? err.message : "No hemos podido completar el acceso.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={fieldStyle} className="relative isolate grid min-h-[calc(100dvh-64px)] place-items-center overflow-clip px-4 py-14 sm:py-20">
      {/* El símbolo da paso a la tarjeta sin interceptar la interacción. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 grid place-items-center"
        onAnimationEnd={(evento) => {
          if (saliendo && evento.animationName === "login-mark-enter" && evento.target === evento.currentTarget.firstElementChild) finalizarSalida();
        }}>
        <LogoMark key={saliendo ? "salida" : "entrada"} className="login-mark size-20 sm:size-24" />
      </div>
      <div inert={saliendo} className={`${saliendo ? "login-card-exit" : "login-card"} w-full max-w-[420px]`}>
        {/* Pestaña de carpeta con el logo: la cuenta es tu expediente, como en el panel de trámites. */}
        <div role="img" aria-label="Alvorania" className="w-fit rounded-t-[16px] bg-surface-raised px-5 pt-3.5 pb-2">
          <LogoMark className="size-8" />
        </div>

        <div className="rounded-[28px] rounded-tl-none bg-surface-raised px-6 pt-7 pb-6 shadow-pop sm:px-9 sm:pt-9 sm:pb-8">
          {reset ? (
            <div role="status" className="anim-swap">
              <span aria-hidden className="grid size-12 place-items-center rounded-full bg-accent-soft text-accent"><Mail className="size-5" /></span>
              <h1 className="mt-5 font-display text-[28px] font-bold leading-tight tracking-[-0.04em] text-ink">Revisa tu correo</h1>
              <p className="mt-3 text-text-muted">
                Si <strong className="font-semibold text-ink">{reset.email}</strong> tiene una cuenta, le hemos enviado un enlace para elegir una contraseña nueva. Si no lo ves, mira en spam.
              </p>
              {/* La demo no envía correo: el enlace se ofrece aquí mismo. */}
              {reset.demoLink && <LinkButton href="/restablecer" size="lg" className="mt-7 w-full">Elegir contraseña nueva</LinkButton>}
              <Button variant="secondary" size="lg" className="mt-3 w-full" onClick={() => { setReset(null); switchMode("entrar"); }}>Volver a entrar</Button>
            </div>
          ) : sentTo ? (
            <div role="status" className="anim-swap">
              <span aria-hidden className="grid size-12 place-items-center rounded-full bg-accent-soft text-accent"><Mail className="size-5" /></span>
              <h1 className="mt-5 font-display text-[28px] font-bold leading-tight tracking-[-0.04em] text-ink">Confirma tu correo</h1>
              <p className="mt-3 text-text-muted">Te hemos enviado un enlace a <strong className="font-semibold text-ink">{sentTo}</strong> para activar tu cuenta. Si no lo ves, mira en spam.</p>
              <Button variant="secondary" size="lg" className="mt-7 w-full" onClick={() => { setSentTo(""); switchMode("entrar"); }}>Ya lo he confirmado, entrar</Button>
            </div>
          ) : (
            <>
              <h1 className="font-display text-[28px] font-bold leading-[1.1] tracking-[-0.04em] text-ink sm:text-[32px] [text-wrap:balance]">{recovering ? "Recupera tu contraseña" : creating ? "Crea tu cuenta" : "Entra en tu cuenta"}</h1>
              <p className="mt-3 text-text-muted">{recovering ? "Te enviaremos un enlace para elegir una nueva." : creating ? "Con tu correo y una contraseña. Calcular es gratis." : "Con tu correo y tu contraseña."}</p>

              {info && <p role="status" className="anim-swap mt-4 rounded-md bg-accent-soft px-3 py-2 text-sm text-on-accent-soft">{info}</p>}

              <form key={mode} onSubmit={onSubmit} noValidate className="anim-swap mt-7 space-y-4">
                {creating && <TextField label="Nombre completo" autoFocus={!!info} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" error={errors.name} />}
                <TextField label="Correo electrónico" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" error={errors.email} />
                {!recovering && <PasswordField
                  label="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={creating ? "new-password" : "current-password"}
                  help={creating ? `Mínimo ${MIN_PASSWORD} caracteres.` : undefined}
                  error={errors.password}
                />}
                {mode === "entrar" && (
                  <button type="button" onClick={() => switchMode("recuperar")} className="-mt-1 text-sm font-semibold text-accent underline-offset-4 hover:underline">¿Olvidaste tu contraseña?</button>
                )}
                <Button type="submit" loading={loading} size="lg" className="group !mt-6 w-full">
                  {recovering ? "Enviar enlace" : creating ? "Crear cuenta" : "Entrar"}
                  {!loading && <ArrowRight aria-hidden className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transform-none" />}
                </Button>
              </form>
              {formError && <p role="alert" className="mt-3 text-sm text-danger">{formError}</p>}

              <p className="mt-6 text-center text-sm text-text-muted">
                {recovering ? "¿Ya la recuerdas? " : creating ? "¿Ya tienes una cuenta? " : "¿No tienes una cuenta? "}
                <button type="button" onClick={() => switchMode(mode === "entrar" ? "crear" : "entrar")} className="font-semibold text-accent underline-offset-4 hover:underline">
                  {mode === "entrar" ? "Crea una" : "Entra"}
                </button>
              </p>

              <ul className="mt-6 space-y-2.5 border-t border-border pt-6 text-sm text-text-muted">
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
              Las cuentas se guardan solo en este navegador. No se envía ningún correo.
            </Notice>
          </div>
        )}
      </div>
    </div>
  );
}
