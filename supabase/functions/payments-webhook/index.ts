// redeploy 2026-05-06 v5: telemetría persistente en webhook_diagnostics
import { createClient } from "npm:@supabase/supabase-js@2";
import { verifyWebhook, EventName, getPaddleClient, type PaddleEnv } from "../_shared/paddle.ts";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const CREDIT_MAP: Record<string, number> = {
  pack_comparador: 3,
};

// Helper: registrar en webhook_diagnostics. Fire-and-forget, no bloquea el flujo.
async function logDiagnostic(row: Record<string, unknown>) {
  try {
    await supabase.from("webhook_diagnostics").insert(row);
  } catch (e: any) {
    console.error("[webhook_diagnostics] insert failed:", e?.message || e);
  }
}

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
        await logDiagnostic({
          env,
          event_type: "transaction.payment_failed",
          transaction_id: event.data.id,
          notes: "Payment failed",
        });
        break;
      default:
        console.log("Unhandled event:", event.eventType);
        await logDiagnostic({
          env,
          event_type: String(event.eventType),
          notes: "Unhandled event type",
        });
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("Webhook error:", e);
    await logDiagnostic({
      env,
      event_type: "error",
      notes: `Webhook error: ${e?.message || e}`,
    });
    return new Response("Webhook error", { status: 400 });
  }
});

async function handleSubscriptionCreated(data: any, env: PaddleEnv) {
  const { id, customerId, items, status, currentBillingPeriod, customData } = data;

  const userId = customData?.userId;
  if (!userId) {
    console.error("No userId in customData");
    await logDiagnostic({
      env,
      event_type: "subscription.created",
      transaction_id: id,
      notes: "No userId in customData",
      raw_custom_data: customData ?? null,
    });
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
    { onConflict: "user_id,environment" },
  );

  console.log(`Subscription created for user ${userId}, product: ${productId}, env: ${env}`);
}

async function handleSubscriptionUpdated(data: any, env: PaddleEnv) {
  const { id, status, currentBillingPeriod, scheduledChange } = data;

  await supabase
    .from("subscriptions")
    .update({
      status,
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
  const paddleCustomerId = data.customer_id || data.customerId;

  // Telemetría — campos que iremos rellenando
  const diag: Record<string, unknown> = {
    env,
    event_type: "transaction.completed",
    transaction_id: transactionId,
    user_id: userId || null,
    analysis_id: analysisId || null,
    customer_id: paddleCustomerId || null,
    raw_custom_data: data.customData ?? null,
  };

  if (data.subscriptionId) {
    diag.notes = "Skipped: subscription transaction";
    await logDiagnostic(diag);
    console.log("Subscription transaction, skipping credit logic:", transactionId);
    return;
  }

  // ====================== Procesar email ======================
  if (analysisId) {
    let customerEmail = data.customData?.email || data.customer?.email || data.customerEmail || "";

    if (!customerEmail && paddleCustomerId) {
      try {
        const paddle = getPaddleClient(env);
        const customer: any = await paddle.customers.get(paddleCustomerId);
        customerEmail = customer?.email || customer?.data?.email || "";
        console.log(`[paddle-sdk] customer.get(${paddleCustomerId}) email=${customerEmail || "(empty)"}`);
      } catch (e: any) {
        console.error("[paddle-sdk] customer.get failed:", e?.message || e);
      }
    }

    const normalizedEmail = customerEmail.trim().toLowerCase();
    diag.customer_email = normalizedEmail || null;

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
    diag.notes = "Anonymous payment without userId — pending registration to link";
    await logDiagnostic(diag);
    console.log("Transaction completed without userId (anonymous purchase):", transactionId, "analysisId:", analysisId);
    return;
  }

  // ====================== Resolver producto y créditos ======================
  const item = data.items?.[0];
  const priceExternalId = item?.price?.importMeta?.externalId || "";
  const productExternalId = item?.product?.importMeta?.externalId || "";
  const priceAmount = String(item?.price?.unitPrice?.amount ?? "");
  const currency = String(item?.price?.unitPrice?.currencyCode ?? "EUR").toUpperCase();
  const productName = String(item?.product?.name ?? "").toLowerCase();
  const priceId = String(item?.price?.id ?? "");

  diag.price_external_id = priceExternalId || null;
  diag.product_external_id = productExternalId || null;
  diag.price_amount = priceAmount;
  diag.currency = currency;
  diag.product_name = item?.product?.name ?? null;
  diag.price_id = priceId || null;
  diag.raw_item = item ?? null;

  const priceToProduct: Record<string, string> = {
    pack_comparador_price: "pack_comparador",
  };

  let resolvedProductId = priceToProduct[priceExternalId] || priceToProduct[productExternalId] || "";

  if (!resolvedProductId && currency === "EUR" && priceAmount === "3499") {
    resolvedProductId = "pack_comparador";
  }

  if (!resolvedProductId && productName.includes("pack") && productName.includes("comparador")) {
    resolvedProductId = "pack_comparador";
  }

  diag.resolved_product_id = resolvedProductId || null;

  console.log(
    `[credits-resolution] resolved="${resolvedProductId}" priceId="${priceId}" externalId="${priceExternalId}" amount="${priceAmount} ${currency}" productName="${productName}"`,
  );

  const creditsToAdd = CREDIT_MAP[resolvedProductId];

  if (creditsToAdd) {
    const { data: profile } = await supabase.from("profiles").select("credits").eq("id", userId).single();
    const currentCredits = profile?.credits || 0;

    await supabase
      .from("profiles")
      .update({ credits: currentCredits + creditsToAdd })
      .eq("id", userId);

    diag.credits_added = creditsToAdd;
    console.log(`Added ${creditsToAdd} credits to user ${userId}, product: ${resolvedProductId}, env: ${env}`);
  } else {
    diag.credits_added = 0;
    diag.notes = `No credits to add. resolved="${resolvedProductId}"`;
    console.warn(
      `[credits-resolution] no credits to add for tx=${transactionId} userId=${userId} resolved="${resolvedProductId}"`,
    );
  }

  // ====================== Contract + analysis_results (si hay analysisId) ======================
  if (!analysisId) {
    await logDiagnostic(diag);
    return;
  }

  const { data: existingContract } = await supabase
    .from("contracts")
    .select("id")
    .eq("source_analysis_id", analysisId)
    .maybeSingle();

  if (existingContract) {
    diag.contract_id_created = existingContract.id;
    diag.notes = (diag.notes ? diag.notes + " | " : "") + "Contract already exists, skipped insert";
    await logDiagnostic(diag);
    console.log(`Contract already exists for analysis ${analysisId} (id: ${existingContract.id}), skipping insert`);
    return;
  }

  const { data: analysisData } = await supabase.from("anonymous_analyses").select("*").eq("id", analysisId).single();

  if (!analysisData) {
    diag.notes = (diag.notes ? diag.notes + " | " : "") + `Analysis ${analysisId} not found`;
    await logDiagnostic(diag);
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
    diag.notes = (diag.notes ? diag.notes + " | " : "") + `contractError: ${contractError.message}`;
    await logDiagnostic(diag);
    console.error("Error creating contract:", contractError);
    return;
  }

  diag.contract_id_created = contract.id;

  if (contract && analysisData.analysis_result) {
    const report = analysisData.analysis_result as any;
    const clauses = report?.clauses || [];

    await supabase.from("analysis_results").insert({
      contract_id: contract.id,
      full_report: report,
      total_clauses: clauses.length,
      valid_clauses: clauses.filter((c: any) => c.type === "legal" || c.type === "valid").length,
      suspicious_clauses: clauses.filter((c: any) => c.type === "suspicious").length,
      illegal_clauses: clauses.filter((c: any) => c.type === "illegal").length,
      summary: report?.summary?.executive_summary || "",
    });
  }

  await logDiagnostic(diag);
  console.log(`Linked analysis ${analysisId} to user ${userId} (contract: ${contract.id})`);
}
