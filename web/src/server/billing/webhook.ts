import type Stripe from "stripe";

export type PlanCode = "PRO" | "LIVE" | "FULL";

export type CheckoutCompleted = {
  caseId: string;
  userId: string;
  planCode: PlanCode;
  customerId: string | null;
  subscriptionId: string | null;
  paymentIntentId: string | null;
  amountCents: number;
  currency: string;
};

export type SubscriptionChange = {
  stripeSubscriptionId: string;
  status: "incomplete" | "active" | "past_due" | "canceled" | "expired";
  cancelAtPeriodEnd: boolean;
  periodEnd: string | null;
};

export type ClaimResult = "new" | "retry" | "duplicate";

/** Lo único que el procesador de webhooks necesita de la base de datos. Permite probarlo sin Stripe ni Supabase. */
export interface BillingRepo {
  claimEvent(id: string, type: string, payload: unknown): Promise<ClaimResult>;
  markProcessed(id: string): Promise<void>;
  markFailed(id: string, error: string): Promise<void>;
  completeCheckout(c: CheckoutCompleted): Promise<void>;
  updateSubscription(s: SubscriptionChange): Promise<void>;
  paymentFailed(stripeSubscriptionId: string): Promise<void>;
}

const PLAN_CODES = ["PRO", "LIVE", "FULL"] as const;

function mapStatus(s: Stripe.Subscription.Status): SubscriptionChange["status"] {
  switch (s) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
      return "canceled";
    case "incomplete_expired":
      return "expired";
    default:
      return "incomplete";
  }
}

/** En versiones recientes de la API de Stripe el fin de periodo está en los items; en las antiguas, en la suscripción. */
function periodEnd(sub: Stripe.Subscription): string | null {
  const legacy = (sub as unknown as { current_period_end?: number }).current_period_end;
  const fromItem = (sub.items?.data?.[0] as unknown as { current_period_end?: number } | undefined)?.current_period_end;
  const ts = fromItem ?? legacy;
  return ts ? new Date(ts * 1000).toISOString() : null;
}

const idOf = (x: string | { id: string } | null | undefined) => (typeof x === "string" ? x : (x?.id ?? null));

/**
 * Procesa un evento ya verificado por firma. Garantías:
 *  - un evento repetido se ignora (duplicate) y se responde 200;
 *  - si el procesamiento falla se registra el error y se relanza, para que Stripe reintente;
 *  - cada manejador es idempotente por sí mismo (ver el repositorio), de modo que un reintento tras un fallo a medias es seguro.
 */
export async function processStripeEvent(event: Stripe.Event, repo: BillingRepo): Promise<"processed" | "duplicate" | "ignored"> {
  const claim = await repo.claimEvent(event.id, event.type, event);
  if (claim === "duplicate") return "duplicate";

  try {
    let handled = true;
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        if (s.payment_status !== "paid" && s.payment_status !== "no_payment_required") {
          handled = false;
          break;
        }
        const { case_id, user_id, plan_code } = s.metadata ?? {};
        if (!case_id || !user_id || !PLAN_CODES.includes(plan_code as PlanCode)) throw new Error("checkout sin metadatos válidos");
        await repo.completeCheckout({
          caseId: case_id,
          userId: user_id,
          planCode: plan_code as PlanCode,
          customerId: idOf(s.customer),
          subscriptionId: idOf(s.subscription),
          paymentIntentId: idOf(s.payment_intent),
          amountCents: s.amount_total ?? 0,
          currency: (s.currency ?? "eur").toUpperCase(),
        });
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await repo.updateSubscription({
          stripeSubscriptionId: sub.id,
          status: event.type === "customer.subscription.deleted" ? "canceled" : mapStatus(sub.status),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
          periodEnd: periodEnd(sub),
        });
        break;
      }
      case "invoice.payment_failed": {
        const inv = event.data.object as Stripe.Invoice;
        const subId = idOf((inv as unknown as { subscription?: string | { id: string } }).subscription)
          ?? idOf((inv as unknown as { parent?: { subscription_details?: { subscription?: string } } }).parent?.subscription_details?.subscription);
        if (subId) await repo.paymentFailed(subId);
        break;
      }
      default:
        handled = false;
    }
    await repo.markProcessed(event.id);
    return handled ? "processed" : "ignored";
  } catch (e) {
    await repo.markFailed(event.id, e instanceof Error ? e.message : "error desconocido");
    throw e;
  }
}
