import { createCaseHandler } from "../_shared/case-api.js";

Deno.serve(
  createCaseHandler(() => ({
    supabaseUrl: Deno.env.get("SUPABASE_URL") ?? "",
    publicKey: Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    serviceKey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    openaiKey: Deno.env.get("OPENAI_API_KEY") ?? "",
  })),
);
