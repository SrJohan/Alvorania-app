import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requiredPlan, coversCase } from "@/lib/pricing";
import { PLANS } from "@/lib/data/plans";
import type { PlanCode } from "@/lib/data/types";
import { normalizeAnswers, type Answers } from "@/lib/tax/engine";
import { AppError } from "./errors";

/** F1: no se puede contratar un plan que no cubre el caso (así nunca hay suplementos después). */
export async function assertPlanCoversCase(caseId: string, plan: PlanCode) {
  const { data: qa } = await supabaseAdmin().from("questionnaire_answers").select("answers").eq("case_id", caseId)
    .order("version", { ascending: false }).limit(1).maybeSingle();
  const answers = normalizeAnswers((qa?.answers ?? {}) as Partial<Answers>);
  if (!coversCase(plan, answers)) {
    const need = requiredPlan(answers);
    const name = PLANS.find((p) => p.code === need.plan)?.name ?? need.plan;
    throw new AppError(`Tu caso necesita el plan ${name}. ${need.reasons.join(" ")}`, "invalid");
  }
}
