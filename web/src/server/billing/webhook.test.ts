import { describe, expect, it } from "vitest";
import type Stripe from "stripe";
import { processStripeEvent, type BillingRepo, type CheckoutCompleted, type ClaimResult, type SubscriptionChange } from "./webhook";

function fakeRepo(opts: { failCheckoutOnce?: boolean } = {}) {
  const events = new Map<string, { processed: boolean; error?: string }>();
  const log = { checkouts: [] as CheckoutCompleted[], subs: [] as SubscriptionChange[], failed: [] as string[] };
  let failNext = !!opts.failCheckoutOnce;
  const repo: BillingRepo = {
    async claimEvent(id): Promise<ClaimResult> {
      const e = events.get(id);
      if (!e) { events.set(id, { processed: false }); return "new"; }
      return e.processed ? "duplicate" : "retry";
    },
    async markProcessed(id) { events.get(id)!.processed = true; },
    async markFailed(id, error) { events.get(id)!.error = error; },
    async completeCheckout(c) {
      if (failNext) { failNext = false; throw new Error("base de datos caída"); }
      // idempotente por payment intent, igual que el repositorio real
      if (!log.checkouts.some((x) => x.paymentIntentId === c.paymentIntentId)) log.checkouts.push(c);
    },
    async updateSubscription(s) { log.subs.push(s); },
    async paymentFailed(id) { log.failed.push(id); },
  };
  return { repo, log, events };
}

const checkoutEvent = (id = "evt_1", over: Partial<Stripe.Checkout.Session> = {}) => ({
  id, type: "checkout.session.completed",
  data: { object: {
    payment_status: "paid", customer: "cus_1", subscription: "sub_1", payment_intent: "pi_1", amount_total: 5900, currency: "eur",
    metadata: { case_id: "c1", user_id: "u1", plan_code: "LIVE" }, ...over,
  } },
}) as unknown as Stripe.Event;

describe("webhook de Stripe", () => {
  it("procesa un checkout completado", async () => {
    const { repo, log } = fakeRepo();
    expect(await processStripeEvent(checkoutEvent(), repo)).toBe("processed");
    expect(log.checkouts).toHaveLength(1);
    expect(log.checkouts[0]).toMatchObject({ caseId: "c1", planCode: "LIVE", amountCents: 5900, currency: "EUR" });
  });

  it("un evento repetido no se procesa dos veces", async () => {
    const { repo, log } = fakeRepo();
    await processStripeEvent(checkoutEvent(), repo);
    expect(await processStripeEvent(checkoutEvent(), repo)).toBe("duplicate");
    expect(log.checkouts).toHaveLength(1);
  });

  it("si falla, se registra el error y el reintento de Stripe lo completa", async () => {
    const { repo, log, events } = fakeRepo({ failCheckoutOnce: true });
    await expect(processStripeEvent(checkoutEvent(), repo)).rejects.toThrow("base de datos caída");
    expect(events.get("evt_1")?.error).toContain("caída");
    expect(await processStripeEvent(checkoutEvent(), repo)).toBe("processed");
    expect(log.checkouts).toHaveLength(1);
  });

  it("rechaza checkouts con metadatos manipulados o ausentes", async () => {
    const { repo, log } = fakeRepo();
    const bad = checkoutEvent("evt_2", { metadata: { case_id: "c1", user_id: "u1", plan_code: "GRATIS" } });
    await expect(processStripeEvent(bad, repo)).rejects.toThrow("metadatos");
    expect(log.checkouts).toHaveLength(0);
  });

  it("no da por pagado un checkout sin pago", async () => {
    const { repo, log } = fakeRepo();
    expect(await processStripeEvent(checkoutEvent("evt_3", { payment_status: "unpaid" }), repo)).toBe("ignored");
    expect(log.checkouts).toHaveLength(0);
  });

  it("actualiza y cancela suscripciones", async () => {
    const { repo, log } = fakeRepo();
    const upd = { id: "evt_4", type: "customer.subscription.updated", data: { object: { id: "sub_1", status: "active", cancel_at_period_end: true, items: { data: [{ current_period_end: 1_900_000_000 }] } } } } as unknown as Stripe.Event;
    await processStripeEvent(upd, repo);
    const del = { id: "evt_5", type: "customer.subscription.deleted", data: { object: { id: "sub_1", status: "canceled", cancel_at_period_end: false, items: { data: [] } } } } as unknown as Stripe.Event;
    await processStripeEvent(del, repo);
    expect(log.subs[0]).toMatchObject({ status: "active", cancelAtPeriodEnd: true });
    expect(log.subs[0].periodEnd).toMatch(/^2030-/);
    expect(log.subs[1]).toMatchObject({ status: "canceled" });
  });

  it("marca el fallo de pago de una factura", async () => {
    const { repo, log } = fakeRepo();
    const ev = { id: "evt_6", type: "invoice.payment_failed", data: { object: { subscription: "sub_9" } } } as unknown as Stripe.Event;
    await processStripeEvent(ev, repo);
    expect(log.failed).toEqual(["sub_9"]);
  });

  it("ignora tipos de evento que no maneja pero los registra", async () => {
    const { repo, events } = fakeRepo();
    expect(await processStripeEvent({ id: "evt_7", type: "customer.created", data: { object: {} } } as unknown as Stripe.Event, repo)).toBe("ignored");
    expect(events.get("evt_7")?.processed).toBe(true);
  });
});
