import { supabaseAdmin } from "@/lib/supabase/server";
import { notify } from "@/server/email";
import type { BillingRepo, CheckoutCompleted, ClaimResult, SubscriptionChange } from "./webhook";

const eurosText = (cents: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(cents / 100);

export function supabaseBillingRepo(): BillingRepo {
  const admin = supabaseAdmin();

  return {
    async claimEvent(id, type, payload): Promise<ClaimResult> {
      const { error } = await admin.from("stripe_events").insert({ id, type, payload });
      if (!error) return "new";
      if (error.code !== "23505") throw error;
      const { data } = await admin.from("stripe_events").select("processed_at").eq("id", id).single();
      return data?.processed_at ? "duplicate" : "retry";
    },

    async markProcessed(id) {
      await admin.from("stripe_events").update({ processed_at: new Date().toISOString(), error: null }).eq("id", id);
    },

    async markFailed(id, error) {
      await admin.from("stripe_events").update({ error: error.slice(0, 500) }).eq("id", id);
    },

    // Idempotente: cada paso comprueba si ya se hizo, así que un reintento tras un fallo a medias es seguro.
    async completeCheckout(c: CheckoutCompleted) {
      const { data: plan, error: planErr } = await admin.from("plans").select("id").eq("code", c.planCode).single();
      if (planErr || !plan) throw new Error(`plan ${c.planCode} no existe`);

      const { data: kase } = await admin.from("cases").select("id,user_id,status,advisor_id").eq("id", c.caseId).single();
      if (!kase || kase.user_id !== c.userId) throw new Error("el caso del pago no pertenece al usuario");

      if (c.customerId) await admin.from("profiles").update({ stripe_customer_id: c.customerId }).eq("id", c.userId);

      if (c.subscriptionId) {
        const { error } = await admin.from("subscriptions").upsert(
          { user_id: c.userId, plan_id: plan.id, status: "active", auto_renew: true, stripe_subscription_id: c.subscriptionId },
          { onConflict: "stripe_subscription_id" },
        );
        if (error) throw error;
      }
      const { data: sub } = c.subscriptionId
        ? await admin.from("subscriptions").select("id").eq("stripe_subscription_id", c.subscriptionId).single()
        : { data: null };

      let invoice: string | null = null;
      const existing = c.paymentIntentId
        ? (await admin.from("payments").select("id,invoice_number").eq("stripe_payment_intent_id", c.paymentIntentId).maybeSingle()).data
        : null;
      if (existing) {
        invoice = existing.invoice_number;
      } else {
        const { data: num, error: numErr } = await admin.rpc("next_invoice_number");
        if (numErr) throw numErr;
        invoice = num as string;
        const { error } = await admin.from("payments").insert({
          user_id: c.userId, case_id: c.caseId, subscription_id: sub?.id ?? null, type: "plan",
          amount_cents: c.amountCents, currency: c.currency, status: "succeeded",
          stripe_payment_intent_id: c.paymentIntentId, invoice_number: invoice,
        });
        if (error) throw error;
      }

      // Asignar asesor y abrir la revisión solo una vez.
      let advisorId: string | null = kase.advisor_id;
      if (!advisorId) {
        const { data: picked } = await admin.rpc("pick_advisor");
        advisorId = (picked as string | null) ?? null;
      }
      if (kase.status === "calculado" || kase.status === "borrador") {
        await admin.from("cases").update({ status: advisorId ? "en_revision" : "pagado", advisor_id: advisorId }).eq("id", c.caseId);
      }
      if (advisorId) {
        const { data: rev } = await admin.from("reviews").select("id").eq("case_id", c.caseId).maybeSingle();
        if (!rev) await admin.from("reviews").insert({ case_id: c.caseId, advisor_id: advisorId });
      }

      if (!existing) {
        await admin.from("messages").insert({ case_id: c.caseId, sender_kind: "system", body: "Pago recibido. Tu declaración está en revisión." });
        const { data: profile } = await admin.from("profiles").select("email,full_name").eq("id", c.userId).single();
        if (profile) await notify({ userId: c.userId, caseId: c.caseId, kind: "payment_received", to: profile.email, payload: { name: profile.full_name, invoice, amount: eurosText(c.amountCents) } });
      }
    },

    async updateSubscription(s: SubscriptionChange) {
      const patch: Record<string, unknown> = { status: s.status, auto_renew: !s.cancelAtPeriodEnd && s.status === "active" };
      if (s.periodEnd) patch.renews_at = s.periodEnd;
      if (s.status === "canceled" || s.cancelAtPeriodEnd) patch.canceled_at = new Date().toISOString();
      else patch.canceled_at = null;
      const { error } = await admin.from("subscriptions").update(patch).eq("stripe_subscription_id", s.stripeSubscriptionId);
      if (error) throw error;
    },

    async paymentFailed(stripeSubscriptionId) {
      await admin.from("subscriptions").update({ status: "past_due" }).eq("stripe_subscription_id", stripeSubscriptionId);
    },
  };
}
