"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/ui/form";
import { LogoMark } from "@/components/site/logo";
import { resetPassword } from "@/lib/data/api";

const MIN_PASSWORD = 8;

const fieldStyle = {
  backgroundColor: "var(--color-accent-soft)",
  backgroundImage:
    "radial-gradient(at 0% 0%, var(--color-field-a) 0, transparent 55%), radial-gradient(at 100% 10%, var(--color-field-b) 0, transparent 50%), radial-gradient(at 40% 100%, var(--color-field-c) 0, transparent 60%)",
};

// Destino del enlace de recuperación (en live llega con la sesión ya abierta por /auth/callback).
export default function Restablecer() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < MIN_PASSWORD) { setFieldError(`Usa al menos ${MIN_PASSWORD} caracteres.`); return; }
    setFieldError("");
    setError("");
    setLoading(true);
    try {
      router.push(await resetPassword(password));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No hemos podido cambiar la contraseña.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={fieldStyle} className="grid min-h-[calc(100dvh-64px)] place-items-center px-4 py-14 sm:py-20">
      <div className="anim-rise w-full max-w-[420px]">
        <div role="img" aria-label="Alvorania" className="w-fit rounded-t-[16px] bg-surface-raised px-5 pt-3.5 pb-2">
          <LogoMark className="size-8" />
        </div>
        <div className="rounded-[28px] rounded-tl-none bg-surface-raised px-6 pt-7 pb-6 shadow-pop sm:px-9 sm:pt-9 sm:pb-8">
          <h1 className="font-display text-[28px] font-bold leading-[1.1] tracking-[-0.04em] text-ink sm:text-[32px] [text-wrap:balance]">Elige una contraseña nueva</h1>
          <p className="mt-3 text-text-muted">Con ella entrarás a partir de ahora.</p>
          <form onSubmit={onSubmit} noValidate className="mt-7 space-y-4">
            <PasswordField
              label="Contraseña nueva"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              help={`Mínimo ${MIN_PASSWORD} caracteres.`}
              error={fieldError}
            />
            <Button type="submit" loading={loading} size="lg" className="group !mt-6 w-full">
              Guardar contraseña
              {!loading && <ArrowRight aria-hidden className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transform-none" />}
            </Button>
          </form>
          {error && (
            <p role="alert" className="mt-3 text-sm text-danger">
              {error} <Link href="/acceder" className="font-semibold underline">Pedir un enlace nuevo</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
