"use client";
import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/display";
import { SelectField, TextField } from "@/components/ui/form";

const kinds = ["Soy autónomo", "Somos una sociedad", "No, solo busco un beneficio"] as const;
const audiences = ["A mi equipo", "A mis clientes", "A los dos"] as const;
const sources = ["Buscador", "Una IA (Claude, Gemini, ChatGPT…)", "Redes sociales", "Recomendación", "Prensa o blog", "Otro"] as const;

/** Solicitud de demo de la sección de empresas. */
export function DemoForm() {
  const [sent, setSent] = useState(false);
  const done = useRef<HTMLDivElement>(null);
  useEffect(() => { if (sent) done.current?.focus(); }, [sent]);

  // Formulario y aviso comparten celda: el alto lo fija el formulario y enviar no mueve la página.
  // shortcut: no se envía a ningún sitio (modo demo), conectar a Supabase o Resend antes de producción; con envío real, pasar `loading` al botón mientras responde.
  return (
    <div className="grid">
      <form
        inert={sent}
        onSubmit={(e) => { e.preventDefault(); setSent(true); }}
        className={`grid gap-4 [grid-area:1/1] sm:grid-cols-2 transition-[opacity,translate,visibility] ease-brand motion-reduce:transition-none ${sent ? "invisible -translate-y-1 opacity-0 duration-150" : "visible translate-y-0 opacity-100 duration-200"}`}
      >
        <TextField label="Nombre" name="nombre" autoComplete="given-name" required />
        <TextField label="Apellidos" name="apellidos" autoComplete="family-name" required />
        <TextField label="Correo de empresa" name="email" type="email" autoComplete="email" required />
        <TextField label="Teléfono" name="telefono" type="tel" autoComplete="tel" required />
        <div className="sm:col-span-2"><TextField label="Cargo" name="cargo" autoComplete="organization-title" required /></div>
        <div className="sm:col-span-2"><SelectField label="¿Eres autónomo o una sociedad buscando gestoría?" name="tipo" options={kinds} placeholder="Elige una opción" required /></div>
        <div className="sm:col-span-2"><TextField label="Empresa" name="empresa" autoComplete="organization" required /></div>
        <div className="sm:col-span-2"><SelectField label="¿A quién te interesaría ofrecer Alvorania como beneficio?" name="destino" options={audiences} placeholder="Elige una opción" required /></div>
        <div className="sm:col-span-2"><SelectField label="¿Cómo nos has conocido?" name="origen" options={sources} placeholder="Elige una opción" /></div>
        <div className="sm:col-span-2"><Button type="submit" size="lg">Solicitar una demo</Button></div>
      </form>
      <div ref={done} tabIndex={-1} inert={!sent} className="self-center outline-none [grid-area:1/1]">
        {sent && (
          <Notice tone="success" title="Solicitud enviada">
            <Check aria-hidden className="anim-pop mr-1.5 inline size-4 align-text-bottom" />
            Te escribiremos al correo que nos has dado para preparar la demo.
          </Notice>
        )}
      </div>
    </div>
  );
}
