import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      prompt,
      slide_number,
      post_id,
      platform = "instagram",
      content_type = "carousel",
      title = "",
      audience = "inquilino",
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const formatGuide =
      content_type === "story"
        ? "Vertical 9:16 composition optimized for story consumption."
        : content_type === "post"
          ? "Single editorial composition optimized for one-card social post."
          : content_type === "reel_script"
            ? "Vertical-friendly hero composition suitable for reel cover or video frame."
            : "Square composition optimized for carousel cover or slide.";

    const platformGuide =
      platform === "linkedin"
        ? "Professional, corporate-editorial, slightly more sober."
        : platform === "tiktok"
          ? "Dynamic but still clean and premium, with stronger visual focus."
          : platform === "twitter"
            ? "Sharp, minimal, information-first editorial feel."
            : "Clean, premium and editorial for modern social media.";

    const audienceGuide =
      audience === "propietario"
        ? "Visual context suitable for landlords, rental management, contracts, keys, documentation and residential assets."
        : "Visual context suitable for tenants, rental life, contract review, home use and rights awareness.";

    const imagePrompt = `Create a premium editorial social media image.

CONTENT CONTEXT:
- Title/reference: ${title || "Legal housing content"}
- Platform: ${platform}
- Format: ${content_type}
- Audience: ${audience}
- Visual brief: ${prompt}

STYLE REQUIREMENTS:
- ${formatGuide}
- ${platformGuide}
- ${audienceGuide}
- Elegant, realistic, trustworthy editorial style
- Warm neutral palette, soft contrast, premium housing/legal-tech feel
- No text, no letters, no watermarks, no logos
- Leave enough negative space for later text overlay
- Avoid generic stock-photo clichés
- Prioritize believable interiors, documents, architecture or human moments related to housing and contracts

The final image must feel consistent with a high-quality blog featured image for a Spanish legal-housing publication.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [{ role: "user", content: imagePrompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const imageData = aiResponse.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      throw new Error("No image generated");
    }

    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
    const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    const filename = `${post_id}/slide-${slide_number}-${Date.now()}.png`;

    const { error: uploadError } = await supabase.storage.from("social-images").upload(filename, binaryData, {
      contentType: "image/png",
      upsert: true,
    });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage.from("social-images").getPublicUrl(filename);

    return new Response(
      JSON.stringify({
        image_url: urlData.publicUrl,
        slide_number,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error generating social image:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
