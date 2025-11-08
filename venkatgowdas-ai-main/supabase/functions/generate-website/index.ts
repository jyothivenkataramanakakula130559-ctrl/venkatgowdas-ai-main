import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, includeBackend = false } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = includeBackend 
      ? `You are an expert full-stack web developer. Generate complete, production-ready code based on the user's request.

For the FRONTEND, provide:
- Complete HTML with modern, responsive design
- Inline CSS and JavaScript
- Beautiful, professional UI

For the BACKEND (if requested), provide:
- Database schema (PostgreSQL/Supabase format)
- Edge functions code (Deno/Supabase format)
- API endpoints and authentication logic

Return a JSON object with this structure:
{
  "html": "complete HTML code",
  "hasBackend": true,
  "backendCode": "edge function code if needed",
  "databaseSchema": "SQL schema if needed",
  "edgeFunctions": [{"name": "function-name", "description": "what it does"}]
}

If no backend is needed, just return the HTML in the html field with hasBackend: false.`
      : `You are an expert web developer who creates beautiful, modern websites. 
Based on the user's description, generate detailed HTML/CSS code for a complete webpage.
Include modern design elements, proper styling, responsive layout, and semantic HTML.
Make it visually stunning with gradients, animations, and modern UI patterns.
Return ONLY the complete HTML code with inline CSS, ready to render.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    let generatedCode = data.choices?.[0]?.message?.content || "";

    // If backend was requested, try to parse the JSON response
    let result: any = { code: generatedCode };
    
    if (includeBackend) {
      try {
        const parsed = JSON.parse(generatedCode);
        if (parsed.html) {
          result = {
            code: parsed.html,
            hasBackend: parsed.hasBackend || false,
            backendCode: parsed.backendCode || null,
            databaseSchema: parsed.databaseSchema || null,
            edgeFunctions: parsed.edgeFunctions || null
          };
        }
      } catch (e) {
        // If parsing fails, treat the entire response as HTML
        console.log('Could not parse backend response as JSON, treating as HTML');
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-website error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
