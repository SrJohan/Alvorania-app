import "server-only";
import Stripe from "stripe";
import { stripeEnv } from "@/server/env";
import type { PlanCode } from "./billing/webhook";

let client: Stripe | null = null;

export function stripe(): Stripe {
  if (!client) client = new Stripe(stripeEnv().STRIPE_SECRET_KEY, { maxNetworkRetries: 2 });
  return client;
}

export function priceIdForPlan(code: PlanCode): string {
  const env = stripeEnv();
  return { PRO: env.STRIPE_PRICE_PRO, LIVE: env.STRIPE_PRICE_LIVE, FULL: env.STRIPE_PRICE_FULL }[code];
}
