"use client";
import { FlowHeader } from "@/components/site/flow-header";
import { LiveResult } from "@/components/site/live-result";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, LinkButton } from "@/components/ui/button";
import { EmptyState, Notice } from "@/components/ui/display";
import { Checkbox, NumberField, SelectField } from "@/components/ui/form";
import { isForal, saveAnswers } from "@/lib/data/api";
import { useDemoState } from "@/lib/data/store";
import { normalizeAnswers, type Answers } from "@/lib/tax/engine";
import { CCAA, SUPPORTED_CCAA } from "@/lib/tax/rules";
import { publicEnv } from "@/lib/env";

const STEPS = ["Tú", "Trabajo", "Otras rentas", "Familia", "Vivienda", "Deducciones"];
type Errors = Partial<Record<keyof Answers, string>>;

const DISABILITY = ["Sin discapacidad", "Del 33 % al 64 %", "Del 65 % o más"] as const;
const disabilityLabel = (d: Answers["disability"]) => (d === 65 ? DISABILITY[2] : d === 33 ? DISABILITY[1] : DISABILITY[0]);
const disabilityValue = (l: string): Answers["disability"] => (l === DISABILITY[2] ? 65 : l === DISABILITY[1] ? 33 : 0);

function validate(step: number, a: Answers): Errors {
  const e: Errors = {};
  if (step === 0) {
    if (!a.ccaa) e.ccaa = "Elige tu comunidad.";
    if (!a.civilStatus) e.civilStatus = "Elige tu estado civil.";
    if (a.birthYear && (a.birthYear < 1900 || a.birthYear > a.taxYear)) e.birthYear = "Escribe un año entre 1900 y " + a.taxYear + ".";
  }
  if (step === 1) {
    if (a.grossIncome <= 0) e.grossIncome = "Indica tus ingresos brutos del año.";
    if (a.socialSecurity > a.grossIncome) e.socialSecurity = "No puede superar tus ingresos brutos.";
    if (a.withholdings > a.grossIncome + a.savingsIncome + a.savingsGains) e.withholdings = "No puede superar tus ingresos.";
    if (!Number.isInteger(a.payers) || a.payers < 1 || a.payers > 4) e.payers = "Indica entre 1 y 4 pagadores.";
  }
  if (step === 3) {
    if (a.childrenUnder3 > a.children) e.childrenUnder3 = "No puede ser mayor que el número de hijos.";
    if (a.bornThisYear > a.children) e.bornThisYear = "No puede ser mayor que el número de hijos.";
    if (a.ascendientes75 > a.ascendientes) e.ascendientes75 = "No puede ser mayor que el número de ascendientes.";
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

  // El servidor rechaza guardar en estos estados (saveAnswers); sin este aviso "Siguiente" parecía no hacer nada.
  if (["pendiente_aprobacion", "presentado", "cerrado", "cancelado"].includes(c.status)) {
    return <EmptyState title="Este caso ya no admite cambios" text="Tu cuestionario ya está enviado. Puedes ver cómo va tu caso o tu resultado." action={<LinkButton href="/app/caso">Ver mi caso</LinkButton>} />;
  }

  const a = normalizeAnswers(c.answers);
  const step = Math.min(c.questionnaireStep, STEPS.length - 1);
  const foral = isForal(a.ccaa);
  const estimate = !!a.ccaa && !foral && !SUPPORTED_CCAA.includes(a.ccaa);
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
        router.push("/app/resultado", { transitionTypes: ["nav-forward"] });
        return;
      }
    }
    await saveAnswers(a, Math.max(0, step + delta));
  }

  return (
    <div className="space-y-6 pb-28 lg:pb-0">
      <FlowHeader step={2} title="Cuéntanos tu situación" subtitle={`${STEPS[step]}, ${step + 1} de ${STEPS.length}`} progress={(step + 1) / STEPS.length} />

      <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,36rem)_minmax(0,1fr)]">
      <form onSubmit={(e) => { e.preventDefault(); go(1); }} noValidate className="min-w-0 space-y-5 pb-32 lg:pb-0">
        {Object.keys(errors).some((k) => errors[k as keyof Answers]) && (
          <div role="alert" className="rounded-md bg-danger-soft px-4 py-3 text-sm text-on-danger-soft">Revisa los campos marcados.</div>
        )}

        {/* Al cambiar de paso el bloque se vuelve a montar y entra con el ascenso corto; escribir no lo dispara. */}
        <div key={step} className="anim-swap space-y-5 rounded-[24px] border border-border bg-surface-raised p-5 md:p-6">
        {step === 0 && (
          <>
            <SelectField label="Comunidad donde resides" value={a.ccaa} onChange={(e) => set("ccaa", e.target.value)} options={CCAA} placeholder="Elige una" error={errors.ccaa} />
            {foral && (
              <Notice tone="warning" title="No disponible en tu comunidad">
                Por ahora no trabajamos con declaraciones del País Vasco ni de Navarra, que tienen su propio régimen fiscal (foral). No te cobraremos nada. Si tu residencia fiscal está en otra comunidad, elígela arriba.{" "}
                <Link href={publicEnv.webUrl} className="font-semibold underline">Volver a la web</Link>
              </Notice>
            )}
            {estimate && (
              <Notice tone="accent" title="Cálculo estimado">
                Aún no tenemos cargadas las deducciones propias de {a.ccaa}. Te daremos una estimación y tu asesor la ajustará antes de presentar.
              </Notice>
            )}
            <SelectField label="Estado civil" value={a.civilStatus} onChange={(e) => set("civilStatus", e.target.value as Answers["civilStatus"])} options={["soltero", "casado"]} placeholder="Elige uno" error={errors.civilStatus} />
            <NumberField label="Año de nacimiento" suffix="" min={1900} help="Algunas deducciones dependen de tu edad." value={a.birthYear} onValue={(v) => set("birthYear", Math.round(v))} error={errors.birthYear} />
            <SelectField label="Discapacidad reconocida" value={disabilityLabel(a.disability)} onChange={(e) => set("disability", disabilityValue(e.target.value))} options={DISABILITY} />
          </>
        )}
        {step === 1 && (
          <>
            <NumberField label="Ingresos brutos del trabajo en el año" help="Lo que consta en tu certificado de retenciones." value={a.grossIncome} onValue={(v) => set("grossIncome", v)} error={errors.grossIncome} />
            <NumberField label="Cotizaciones a la Seguridad Social" value={a.socialSecurity} onValue={(v) => set("socialSecurity", v)} error={errors.socialSecurity} />
            <NumberField label="Retenciones practicadas (IRPF)" help="Súmalas todas: las de tu nómina y las de tu banco o bróker." value={a.withholdings} onValue={(v) => set("withholdings", v)} error={errors.withholdings} />
            <NumberField label="Número de pagadores" suffix="" min={1} max={4} value={a.payers} onValue={(v) => set("payers", Math.round(v))} error={errors.payers} />
          </>
        )}
        {step === 2 && (
          <>
            <NumberField label="Intereses y dividendos cobrados" help="Cuentas, depósitos y acciones. Déjalo en blanco si no tienes." value={a.savingsIncome} onValue={(v) => set("savingsIncome", v)} />
            <NumberField label="Ganancias por vender acciones o fondos" help="La ganancia neta del año. Si perdiste dinero, déjalo en blanco: tu asesor lo compensará." value={a.savingsGains} onValue={(v) => set("savingsGains", v)} />
            <Checkbox checked={a.propertyIncome} onChange={(e) => set("propertyIncome", e.target.checked)} label="Alquilo un inmueble, tengo una segunda vivienda o he vendido un inmueble." />
            <Checkbox checked={a.selfEmployed} onChange={(e) => set("selfEmployed", e.target.checked)} label="He tenido actividad como autónomo o profesional." />
            {(a.propertyIncome || a.selfEmployed) && (
              <Notice tone="accent" title="Lo calcula tu asesor">
                Estos ingresos no entran en el cálculo automático: tu asesor los incorporará al revisar el caso, así que el resultado puede cambiar. Para este caso necesitarás el plan Completo.
              </Notice>
            )}
          </>
        )}
        {step === 3 && (
          <>
            <NumberField label="Ascendientes que viven contigo" suffix="" help="Padres o abuelos mayores de 65 años que han vivido contigo más de medio año y han ingresado menos de 8.000 €. Si otro contribuyente comparte la deducción, se reparte a partes iguales: tu asesor lo ajusta." value={a.ascendientes} onValue={(v) => set("ascendientes", Math.round(v))} />
            {a.ascendientes > 0 && <NumberField label="De ellos, mayores de 75 años" suffix="" value={a.ascendientes75} onValue={(v) => set("ascendientes75", Math.round(v))} error={errors.ascendientes75} />}
            <NumberField label="Hijos a tu cargo" suffix="" value={a.children} onValue={(v) => set("children", Math.round(v))} />
            <NumberField label="De ellos, menores de 3 años" suffix="" value={a.childrenUnder3} onValue={(v) => set("childrenUnder3", Math.round(v))} error={errors.childrenUnder3} />
            {a.children > 0 && <NumberField label="De ellos, nacidos o adoptados en 2025" suffix="" help="Algunas comunidades dan una deducción por cada hijo que nace o se adopta en el año." value={a.bornThisYear} onValue={(v) => set("bornThisYear", Math.round(v))} error={errors.bornThisYear} />}
            <SelectField label="Familia numerosa" help="Según tu título de familia numerosa." value={a.familiaNumerosa === "especial" ? "Categoría especial" : a.familiaNumerosa === "general" ? "Categoría general" : ""} onChange={(e) => set("familiaNumerosa", e.target.value === "Categoría especial" ? "especial" : e.target.value === "Categoría general" ? "general" : "")} options={["Categoría general", "Categoría especial"]} placeholder="No" error={errors.familiaNumerosa} />
            {a.childrenUnder3 > 0 && (
              <>
                <Checkbox checked={a.workingMother} onChange={(e) => set("workingMother", e.target.checked)} label="Soy la madre y he trabajado (por cuenta propia o ajena) con alta en la Seguridad Social." />
                {a.workingMother && <NumberField label="Gasto en guardería autorizada" help="Lo que pagaste tú, sin ayudas ni el cheque guardería de la empresa." value={a.nurseryCost} onValue={(v) => set("nurseryCost", v)} />}
              </>
            )}
          </>
        )}
        {step === 4 && (
          <>
            <NumberField label="Alquiler de tu vivienda habitual pagado en el año" help="Varias comunidades lo desgravan según tu edad e ingresos." value={a.rentPaid} onValue={(v) => set("rentPaid", v)} />
            <NumberField label="Hipoteca de vivienda habitual comprada antes de 2013" help="Importe pagado en el año entre capital e intereses." value={a.mortgagePre2013} onValue={(v) => set("mortgagePre2013", v)} />
          </>
        )}
        {step === 5 && (
          <>
            <NumberField label="Aportaciones a planes de pensiones" help="Reducen tu base hasta 1.500 € al año." value={a.pensionContrib} onValue={(v) => set("pensionContrib", v)} />
            <NumberField label="Donativos a ONG y fundaciones" value={a.donations} onValue={(v) => set("donations", v)} />
            {a.donations > 0 && <Checkbox checked={a.donationsRecurrent} onChange={(e) => set("donationsRecurrent", e.target.checked)} label="Dono a la misma entidad desde hace tres años o más." />}
            <NumberField label="Donativos a entidades de tu comunidad" help="Fundaciones, universidades o entidades de tu comunidad autónoma. No repitas aquí lo que ya has puesto arriba." value={a.donationsRegional} onValue={(v) => set("donationsRegional", v)} error={errors.donationsRegional} />
          </>
        )}
        </div>

        <div className="flex gap-3">
          {step > 0 && <Button type="button" variant="secondary" onClick={() => go(-1)}>Atrás</Button>}
          <Button type="submit" loading={busy} disabled={foral}>{step === STEPS.length - 1 ? "Ver mi resultado" : "Siguiente"}</Button>
        </div>
      </form>
      {!busy && <LiveResult answers={a} />}
      </div>
    </div>
  );
}
