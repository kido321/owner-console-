import { NextResponse } from "next/server";
import crypto from "node:crypto";

import { supabaseAdmin } from "@/lib/supabaseServer";

interface ClerkWebhookEvent<T = unknown> {
  type: string;
  data: T;
}

interface ClerkOrganizationPayload {
  id: string;
  name: string;
  slug?: string | null;
  created_at?: string;
  public_metadata?: Record<string, unknown> | null;
}

function decodeSecret(secret: string): Buffer {
  const value = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  return Buffer.from(value, "base64");
}

function verifyClerkSignature(payload: string, headers: Headers, secret: string) {
  const svixId = headers.get("svix-id");
  const svixTimestamp = headers.get("svix-timestamp");
  const svixSignature = headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    throw new Error("Missing Clerk webhook headers");
  }

  const secretKey = decodeSecret(secret);
  const toSign = `${svixId}.${svixTimestamp}.${payload}`;
  const expectedSignature = crypto.createHmac("sha256", secretKey).update(toSign).digest();

  const signatures = svixSignature.split(",").map((part) => part.split("="));

  for (const [version, signature] of signatures) {
    if (version !== "v1" || !signature) continue;
    const decodedSignature = Buffer.from(signature, "base64");
    if (decodedSignature.length === expectedSignature.length) {
      if (crypto.timingSafeEqual(decodedSignature, expectedSignature)) {
        return;
      }
    }
  }

  throw new Error("Invalid Clerk webhook signature");
}

function extractOrganizationData(data: ClerkOrganizationPayload): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    name: data.name,
    updated_at: new Date().toISOString(),
  };

  const meta = (data.public_metadata ?? {}) as Record<string, unknown>;
  const assign = (key: string, ...aliases: string[]) => {
    for (const alias of aliases) {
      const value = meta[alias];
      if (typeof value === "string" && value.length > 0) {
        payload[key] = value;
        return;
      }
      if (typeof value === "boolean") {
        payload[key] = value;
        return;
      }
      if (typeof value === "number") {
        payload[key] = value;
        return;
      }
    }
  };

  assign("legal_name", "legal_name", "legalName");
  assign("primary_email", "primary_email", "primaryEmail");
  assign("primary_phone", "primary_phone", "primaryPhone");
  assign("address_line1", "address_line1", "addressLine1");
  assign("address_line2", "address_line2", "addressLine2");
  assign("city", "city");
  assign("state", "state");
  assign("zip_code", "zip_code", "zipCode");
  assign("country", "country");
  assign("is_provider", "is_provider", "isProvider");
  assign("is_broker", "is_broker", "isBroker");
  assign("currency", "currency");
  assign("default_billing_terms", "default_billing_terms", "defaultBillingTerms");
  assign("active", "active");
  assign("plan_id", "plan_id", "planId");
  assign("billing_anchor_day", "billing_anchor_day", "billingAnchorDay");

  return payload;
}

export async function POST(request: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  const rawBody = await request.text();

  try {
    if (secret) {
      verifyClerkSignature(rawBody, request.headers, secret);
    }

    const event = JSON.parse(rawBody) as ClerkWebhookEvent<ClerkOrganizationPayload>;

    if (!event?.type) {
      return NextResponse.json({ received: false }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    switch (event.type) {
      case "organization.created": {
        const upsertPayload = {
          id: event.data.id,
          ...extractOrganizationData(event.data),
          active: true,
        };

        const { error } = await supabase.from("organizations").upsert(upsertPayload, { onConflict: "id" });
        if (error) throw error;
        break;
      }
      case "organization.updated": {
        const updatePayload = extractOrganizationData(event.data);
        if (Object.keys(updatePayload).length > 0) {
          const { error } = await supabase
            .from("organizations")
            .update(updatePayload)
            .eq("id", event.data.id);
          if (error) throw error;
        }
        break;
      }
      case "organization.deleted": {
        const { error } = await supabase
          .from("organizations")
          .update({ active: false, updated_at: new Date().toISOString() })
          .eq("id", event.data.id);
        if (error) throw error;
        break;
      }
      default:
        // Ignore other webhook events for now.
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook processing failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
