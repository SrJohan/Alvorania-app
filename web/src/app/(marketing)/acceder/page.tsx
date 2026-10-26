"use client";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, Notice } from "@/components/ui/display";
import { TextField } from "@/components/ui/form";
import { signIn } from "@/lib/data/api";
import { isLive } from "@/lib/env";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    <div className="mx-auto max-w-md px-4 py-12">
      {sentTo ? (
        <div role="status">
          <h1 className="text-xl font-bold">Revisa tu correo</h1>
          <p className="mt-2 text-text-muted">Te hemos enviado un enlace de acceso a <strong>{sentTo}</strong>. Caduca en una hora. Si no lo ves, mira en spam.</p>
          <button className="mt-4 text-sm underline" onClick={() => setSentTo("")}>Usar otro correo</button>
        </div>
      ) : (<>
      <h1 className="text-xl font-bold">Crea tu cuenta o entra</h1>
      <p className="mt-2 text-text-muted">Te enviaremos un enlace de acceso a tu correo. Sin contraseñas.</p>
      <Card className="mt-6">
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <TextField label="Nombre completo" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" error={errors.name} />
          <TextField label="Correo electrónico" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" error={errors.email} />
          <Button type="submit" loading={loading} className="w-full" size="lg">Continuar</Button>
        </form>
      </Card>
      {formError && <p role="alert" className="mt-3 text-sm text-danger">{formError}</p>}
      {!isLive && <div className="mt-4">
        <Notice tone="warning" title="Versión de demostración">
          No se envía ningún correo ni se guarda nada fuera de tu navegador.
        </Notice>
      </div>}
      </>)}
    </div>
  );
}
