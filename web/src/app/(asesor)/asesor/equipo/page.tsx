"use client";
import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, EmptyState, ErrorState, Notice, Skeleton, Tag } from "@/components/ui/display";
import { TextField } from "@/components/ui/form";
import { formatDate } from "@/lib/format";
import { addAdvisor, teamMembers, type TeamMember } from "@/server/team-actions";

export default function Equipo() {
  const [members, setMembers] = useState<TeamMember[] | null>(null);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [created, setCreated] = useState<{ email: string; password: string | null } | null>(null);

  const load = useCallback(async () => {
    const r = await teamMembers();
    if (r.ok) { setMembers(r.data); setError(""); } else setError(r.error);
  }, []);

  useEffect(() => {
    let alive = true;
    teamMembers().then((r) => {
      if (!alive) return;
      if (r.ok) setMembers(r.data); else setError(r.error);
    });
    return () => { alive = false; };
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormError("");
    setCreated(null);
    const r = await addAdvisor({ fullName: name, email });
    if (r.ok) {
      setCreated({ email: email.trim(), password: r.data.temporaryPassword });
      setName("");
      setEmail("");
      await load();
    } else setFormError(r.error);
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-bold">Equipo</h1>
        <Link href="/asesor" className="text-sm underline">Volver a los casos</Link>
      </div>

      {error ? <div className="mt-6"><ErrorState text={error} onRetry={load} /></div> : (
        <>
          <Card className="mt-6">
            <h2 className="font-semibold">Dar de alta un asesor</h2>
            <p className="mt-1 text-sm text-text-muted">Si el correo ya tiene cuenta de cliente, pasa a ser asesor con su contraseña de siempre.</p>
            <form onSubmit={onSubmit} noValidate className="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <TextField label="Nombre completo" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
              <TextField label="Correo electrónico" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
              <Button type="submit" loading={busy}>Dar de alta</Button>
            </form>
            {formError && <p role="alert" className="mt-3 text-sm text-danger">{formError}</p>}
            {created && (
              <div className="mt-4">
                <Notice tone="accent" title="Asesor dado de alta">
                  {created.password
                    ? <>Pásale a {created.email} esta contraseña temporal por un canal privado: <code className="select-all font-mono font-semibold">{created.password}</code>. No se volverá a mostrar; puede cambiarla desde «¿Olvidaste tu contraseña?».</>
                    : <>{created.email} ya tenía cuenta: entra con su contraseña de siempre y llegará al panel de asesor.</>}
                </Notice>
              </div>
            )}
          </Card>

          <div className="mt-6 space-y-3">
            {members === null && <><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></>}
            {members?.length === 0 && <EmptyState title="Aún no hay nadie en el equipo" text="Da de alta al primer asesor con el formulario de arriba." />}
            {members?.map((m) => (
              <Card key={m.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{m.fullName}</p>
                    <p className="text-sm text-text-muted">{m.email} · desde {formatDate(m.createdAt)}</p>
                  </div>
                  <Tag tone={m.role === "admin" ? "accent" : "neutral"}>{m.role === "admin" ? "Administrador" : "Asesor"}</Tag>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
