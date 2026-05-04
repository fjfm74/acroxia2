// redeploy 2026-05-04 v2: clause.type 'legal' (no 'valid'); recount valid_clauses
import { createClient } from "npm:@supabase/supabase-js@2";
import { verifyWebhook, EventName, type PaddleEnv } from "../_shared/paddle.ts";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const CREDIT_MAP: Record<string, number> = {
  pack_comparador: 3,
};

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const env = (url.searchParams.get("env") || "sandbox") as PaddleEnv;

  try {
    const event = await verifyWebhook(req, env);
    console.log("Received event:", event.eventType, "env:", env);

    switch (event.eventType) {
      case EventName.SubscriptionCreated:
        await handleSubscriptionCreated(event.data, env);
        break;
      case EventName.SubscriptionUpdated:
        await handleSubscriptionUpdated(event.data, env);
        break;
      case EventName.SubscriptionCanceled:
        await handleSubscriptionCanceled(event.data, env);
        break;
      case EventName.TransactionCompleted:
        await handleTransactionCompleted(event.data, env);
        break;
      case EventName.TransactionPaymentFailed:
        console.log("Payment failed:", event.data.id, "env:", env);
        break;
      default:
        console.log("Unhandled event:", event.eventType);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response("Webhook error", { status: 400 });
  }
});

async function handleSubscriptionCreated(data: any, env: PaddleEnv) {
  const { id, customerId, items, status, currentBillingPeriod, customData } = data;

  const userId = customData?.userId;
  if (!userId) {
    console.error("No userId in customData");
    return;
  }

  const item = items[0];
  const priceId = item.price.importMeta?.externalId || item.price.id;
  const productId = item.product.importMeta?.externalId || item.product.id;

  await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      paddle_subscription_id: id,
      paddle_customer_id: customerId,
      product_id: productId,
      price_id: priceId,
      plan_type: productId,
      status: status,
      current_period_start: currentBillingPeriod?.startsAt,
      current_period_end: currentBillingPeriod?.endsAt,
      environment: env,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,environment",
    },
  );

  console.log(`Subscription created for user ${userId}, product: ${productId}, env: ${env}`);
}

async function handleSubscriptionUpdated(data: any, env: PaddleEnv) {
  const { id, status, currentBillingPeriod, scheduledChange } = data;

  await supabase
    .from("subscriptions")
    .update({
      status: status,
      current_period_start: currentBillingPeriod?.startsAt,
      current_period_end: currentBillingPeriod?.endsAt,
      cancel_at_period_end: scheduledChange?.action === "cancel",
      updated_at: new Date().toISOString(),
    })
    .eq("paddle_subscription_id", id)
    .eq("environment", env);
}

async function handleSubscriptionCanceled(data: any, env: PaddleEnv) {
  await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      updated_at: new Date().toISOString(),
    })
    .eq("paddle_subscription_id", data.id)
    .eq("environment", env);
}

async function handleTransactionCompleted(data: any, env: PaddleEnv) {
  const userId = data.customData?.userId;
  const analysisId = data.customData?.analysisId;
  const transactionId = data.id;

  if (data.subscriptionId) {
    console.log("Subscription transaction, skipping credit logic:", transactionId);
    return;
  }

  if (analysisId) {
    let customerEmail = data.customData?.email || data.customer?.email || data.customerEmail || "";

    if (!customerEmail) {
      const paddleCustomerId = data.customer_id || data.customerId;
      if (paddleCustomerId) {
        try {
          const paddleApiBase = env === "live" ? "https://api.paddle.com" : "https://sandbox-api.paddle.com";
          const paddleKey =
            env === "live" ? Deno.env.get("PADDLE_LIVE_API_KEY") || "" : Deno.env.get("PADDLE_SANDBOX_API_KEY") || "";
          const resp = await fetch(`${paddleApiBase}/customers/${paddleCustomerId}`, {
            headers: { Authorization: `Bearer ${paddleKey}` },
          });
          if (resp.ok) {
            const json = await resp.json();
            customerEmail = json.data?.email || "";
            console.log(`Fetched customer email from Paddle API (env=${env}): ${customerEmail}`);
          } else {
            console.error(`Paddle customer fetch failed (env=${env}): ${resp.status} ${resp.statusText}`);
          }
        } catch (e) {
          console.error("Error fetching customer from Paddle:", e);
        }
      }
    }

    const normalizedEmail = customerEmail.trim().toLowerCase();

    const updates: Record<string, unknown> = {
      paid: true,
      paddle_transaction_id: transactionId,
    };
    if (normalizedEmail) updates.email = normalizedEmail;

    const { error: paidError } = await supabase.from("anonymous_analyses").update(updates).eq("id", analysisId);

    if (paidError) {
      console.error("Error marking analysis as paid:", paidError);
    } else {
      console.log(`Analysis ${analysisId} marked as paid, tx: ${transactionId}, email: ${normalizedEmail || "(none)"}`);
    }

    await supabase.from("purchase_intents").insert({
      email: customerEmail || "unknown@paddle.checkout",
      analysis_id: analysisId,
      status: "completed",
      completed_at: new Date().toISOString(),
    });
  }

  if (!userId) {
    console.log("Transaction completed without userId (anonymous purchase):", transactionId, "analysisId:", analysisId);
    return;
  }

  const item = data.items?.[0];
  const productId = item?.price?.importMeta?.externalId || item?.price?.productId || "";

  const priceToProduct: Record<string, string> = {
    pack_comparador_price: "pack_comparador",
  };

  const resolvedProductId = priceToProduct[productId] || productId;
  const creditsToAdd = CREDIT_MAP[resolvedProductId];

  if (creditsToAdd) {
    const { data: profile } = await supabase.from("profiles").select("credits").eq("id", userId).single();

    const currentCredits = profile?.credits || 0;

    await supabase
      .from("profiles")
      .update({ credits: currentCredits + creditsToAdd })
      .eq("id", userId);

    console.log(`Added ${creditsToAdd} credits to user ${userId}, product: ${resolvedProductId}, env: ${env}`);
  }

  if (!analysisId) return;

  const { data: existingContract } = await supabase
    .from("contracts")
    .select("id")
    .eq("source_analysis_id", analysisId)
    .maybeSingle();

  if (existingContract) {
    console.log(`Contract already exists for analysis ${analysisId} (id: ${existingContract.id}), skipping insert`);
    return;
  }

  const { data: analysisData } = await supabase.from("anonymous_analyses").select("*").eq("id", analysisId).single();

  if (!analysisData) {
    console.error(`Analysis ${analysisId} not found when linking to user ${userId}`);
    return;
  }

  if (!analysisData.converted_to_user_id) {
    await supabase.from("anonymous_analyses").update({ converted_to_user_id: userId }).eq("id", analysisId);
  }

  const { data: contract, error: contractError } = await supabase
    .from("contracts")
    .insert({
      user_id: userId,
      file_name: analysisData.file_name,
      file_path: analysisData.file_path || "",
      status: "completed",
      source_analysis_id: analysisId,
      full_access: true,
    })
    .select()
    .single();

  if (contractError) {
    console.error("Error creating contract:", contractError);
    return;
  }

  if (contract && analysisData.analysis_result) {
    const report = analysisData.analysis_result as any;
    const clauses = report?.clauses || [];

    await supabase.from("analysis_results").insert({
      contract_id: contract.id,
      full_report: report,
      total_clauses: clauses.length,
      // Bug K fix: el AI emite 'legal' (no 'valid'); soportamos ambos por compatibilidad.
      valid_clauses: clauses.filter((c: any) => c.type === "legal" || c.type === "valid").length,
      suspicious_clauses: clauses.filter((c: any) => c.type === "suspicious").length,
      illegal_clauses: clauses.filter((c: any) => c.type === "illegal").length,
      summary: report?.summary?.executive_summary || "",
    });
  }

  console.log(`Linked analysis ${analysisId} to user ${userId} (contract: ${contract.id})`);
}
