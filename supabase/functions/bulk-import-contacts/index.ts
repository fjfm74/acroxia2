import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { emails, segment = "gestoria", source = "purchased_db", consent_type = "legitimate_interest" } = await req.json();

    if (!Array.isArray(emails) || emails.length === 0) {
      return new Response(JSON.stringify({ error: "emails array required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Filter valid emails
    const validEmails = emails
      .map((e: string) => e?.trim().toLowerCase())
      .filter((e: string) => e && e.includes("@") && e.length > 3);

    let inserted = 0;
    let skipped = 0;
    const BATCH = 500;

    for (let i = 0; i < validEmails.length; i += BATCH) {
      const batch = validEmails.slice(i, i + BATCH).map((email: string) => ({
        email,
        segment,
        source,
        consent_type,
      }));

      const { error } = await supabase
        .from("marketing_contacts")
        .upsert(batch, { onConflict: "email", ignoreDuplicates: true });

      if (error) {
        console.error(`Batch error at ${i}:`, error);
        skipped += batch.length;
      } else {
        inserted += batch.length;
      }
    }

    console.log(`Bulk import: ${inserted} processed, ${skipped} errors, ${validEmails.length} valid of ${emails.length} total`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        total: emails.length,
        valid: validEmails.length,
        processed: inserted,
        skipped 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    console.error("Bulk import error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
