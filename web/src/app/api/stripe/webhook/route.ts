import { NextResponse } from "next/server";
import { stripeEnv } from "@/server/env";
import { supabaseBillingRepo } from "@/server/billing/supabase-repo";
import { processStripeEvent } from "@/server/billing/webhook";
import { stripe } from "@/server/stripe";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "missing signature" }, { status: 400 });

  // La firma se verifica sobre el cuerpo EXACTO recibido: no parsear antes.
  const body = await request.text();
  let event;
  try {
    event = stripe().webhooks.constructEvent(body, signature, stripeEnv().STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  try {
    const result = await processStripeEvent(event, supabaseBillingRepo());
    return NextResponse.json({ received: true, result });
  } catch (e) {
    console.error("[stripe webhook] failed:", event.id, event.type, e instanceof Error ? e.message : "unknown");
    // 500 hace que Stripe reintente con espera creciente.
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }
}
