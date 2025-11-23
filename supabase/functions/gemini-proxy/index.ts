import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const ALLOWED_ORIGINS = new Set([
  "https://agriconnect.kasapaai.com",
  "http://localhost:3000",
  "http://localhost:5173",
]);
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

const corsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin && ALLOWED_ORIGINS.has(origin) ? origin : "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
});

serve(async (req) => {
  const origin = req.headers.get("origin");
  const baseHeaders = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: baseHeaders });
  }

  if (!GEMINI_API_KEY) {
    return new Response(
      JSON.stringify({ error: "Server missing GEMINI_API_KEY" }),
      { status: 500, headers: { ...baseHeaders, "content-type": "application/json" } },
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON payload" }),
      { status: 400, headers: { ...baseHeaders, "content-type": "application/json" } },
    );
  }

  const { endpoint, model, ...rest } = body ?? {};
  if (!endpoint || !model) {
    return new Response(
      JSON.stringify({ error: "Missing endpoint or model" }),
      { status: 400, headers: { ...baseHeaders, "content-type": "application/json" } },
    );
  }

  const path = endpoint === "generateImages" ? "generateImages" : "generateContent";
  const url = `${BASE_URL}/models/${model}:${path}?key=${GEMINI_API_KEY}`;

  const upstream = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(rest),
  });

  const data = await upstream.json().catch(() => ({}));
  return new Response(JSON.stringify(data), {
    status: upstream.status,
    headers: { ...baseHeaders, "content-type": "application/json" },
  });
});
