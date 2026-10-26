"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, LinkButton } from "@/components/ui/button";
import { EmptyState, Notice, Stepper } from "@/components/ui/display";
import { NumberField, SelectField } from "@/components/ui/form";
import { isForal, saveAnswers } from "@/lib/data/api";
import { useDemoState } from "@/lib/data/store";
import type { Answers } from "@/lib/tax/engine";
import { CCAA } from "@/lib/tax/rules";

const STEPS = ["Tú", "Ingresos", "Familia", "Deducciones"];
type Errors = Partial<Record<keyof Answers, string>>;

function validate(step: number, a: Answers): Errors {
  const e: Errors = {};
  if (step === 0) {
    if (!a.ccaa) e.ccaa = "Elige tu comunidad.";
    if (!a.civilStatus) e.civilStatus = "Elige tu estado civil.";
  }
  if (step === 1) {
    if (a.grossIncome <= 0) e.grossIncome = "Indica tus ingresos brutos del año.";
    if (a.socialSecurity > a.grossIncome) e.socialSecurity = "No puede superar tus ingresos brutos.";
    if (a.withholdings > a.grossIncome) e.withholdings = "No puede superar tus ingresos brutos.";
  }
  if (step === 2) {
    if (a.childrenUnder3 > a.children) e.childrenUnder3 = "No puede ser mayor que el número de hijos.";
  }
  return e;
}

export default function Cuestionario() {
  const router = useRouter();
  const s = useDemoState();
  const c = s.case;
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  if (!c) {
    return <EmptyState title="Aún no has empezado" text="Primero cuéntanos cómo aportarás tus datos fiscales." action={<LinkButton href="/app/conectar">Empezar</LinkButton>} />;
  }

  const a = c.answers;
  const step = c.questionnaireStep;
  const foral = isForal(a.ccaa);
  const set = <K extends keyof Answers>(k: K, v: Answers[K]) => {
    setErrors((e) => ({ ...e, [k]: undefined }));
    return saveAnswers({ ...a, [k]: v }, step);
  };

  async function go(delta: 1 | -1) {
    if (delta === 1) {
      const e = validate(step, a);
      setErrors(e);
      if (Object.keys(e).length || foral) return;
      if (step === STEPS.length - 1) {
        setBusy(true);
        router.push("/app/resultado");
        return;
      }
    }
    await saveAnswers(a, Math.max(0, step + delta));
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-text-muted">Paso 2 de 4</p>
        <h1 className="text-xl font-bold">Cuéntanos tu situación</h1>
      </div>
      <Stepper steps={STEPS} current={step} />

      <form onSubmit={(e) => { e.preventDefault(); go(1); }} noValidate className="max-w-xl space-y-5">
        {Object.keys(errors).length > 0 && (
          <div role="alert" className="rounded-md bg-danger-soft px-4 py-3 text-sm text-on-danger-soft">Revisa los campos marcados.</div>
        )}

        {step === 0 && (
          <>
            <SelectField label="Comunidad donde resides" value={a.ccaa} onChange={(e) => set("ccaa", e.target.value)} options={CCAA} placeholder="Elige una" error={errors.ccaa} />
            {foral && (
              <Notice tone="warning" title="No disponible en tu comunidad">
                Por ahora no trabajamos con declaraciones del País Vasco ni de Navarra, que tienen su propio régimen fiscal (foral). No te cobraremos nada. Si tu residencia fiscal está en otra comunidad, elígela arriba.{" "}
                <Link href="/" className="font-semibold underline">Volver al inicio</Link>
              </Notice>
            )}
            <SelectField label="Estado civil" value={a.civilStatus} onChange={(e) => set("civilStatus", e.target.value as Answers["civilStatus"])} options={["soltero", "casado"]} placeholder="Elige uno" error={errors.civilStatus} />
          </>
        )}
        {step === 1 && (
          <>
            <NumberField label="Ingresos brutos del trabajo en el año" help="Lo que consta en tu certificado de retenciones." value={a.grossIncome} onValue={(v) => set("grossIncome", v)} error={errors.grossIncome} />
            <NumberField label="Cotizaciones a la Seguridad Social" value={a.socialSecurity} onValue={(v) => set("socialSecurity", v)} error={errors.socialSecurity} />
            <NumberField label="Retenciones practicadas (IRPF)" value={a.withholdings} onValue={(v) => set("withholdings", v)} error={errors.withholdings} />
            <NumberField label="Número de pagadores" suffix="" min={1} value={a.payers} onValue={(v) => set("payers", Math.max(1, Math.round(v)))} />
          </>
        )}
        {step === 2 && (
          <>
            <NumberField label="Hijos a tu cargo" suffix="" value={a.children} onValue={(v) => set("children", Math.round(v))} />
            <NumberField label="De ellos, menores de 3 años" suffix="" value={a.childrenUnder3} onValue={(v) => set("childrenUnder3", Math.round(v))} error={errors.childrenUnder3} />
          </>
        )}
        {step === 3 && (
          <>
            <NumberField label="Aportaciones a planes de pensiones" help="Reducen tu base hasta 1.500 € al año." value={a.pensionContrib} onValue={(v) => set("pensionContrib", v)} />
            <NumberField label="Donativos a ONG y fundaciones" value={a.donations} onValue={(v) => set("donations", v)} />
            <NumberField label="Hipoteca de vivienda habitual comprada antes de 2013" help="Importe pagado en el año entre capital e intereses." value={a.mortgagePre2013} onValue={(v) => set("mortgagePre2013", v)} />
          </>
        )}

        <div className="flex gap-3">
          {step > 0 && <Button type="button" variant="secondary" onClick={() => go(-1)}>Atrás</Button>}
          <Button type="submit" loading={busy} disabled={foral}>{step === STEPS.length - 1 ? "Ver mi resultado" : "Siguiente"}</Button>
        </div>
      </form>
    </div>
  );
}
