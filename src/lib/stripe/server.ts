import Stripe from "stripe";
import { env, isStripeConfigured } from "@/lib/env";

let stripe: Stripe | null = null;

/** Returns a configured Stripe client, or null in demo mode. */
export function getStripe(): Stripe | null {
  if (!isStripeConfigured) return null;
  if (!stripe) {
    // apiVersion omitted → uses the version pinned by the installed library.
    stripe = new Stripe(env.stripeSecretKey!, { typescript: true });
  }
  return stripe;
}
