import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { fieldConfigs } from "@/config/ai-field-prompts";

// In-memory rate limiter: userId -> { count, resetAt }
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 40;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) {
    return false;
  }

  entry.count++;
  return true;
}

async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server component context
          }
        },
      },
    }
  );
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI generation is not configured. Please set OPENROUTER_API_KEY." },
      { status: 503 }
    );
  }

  const supabase = await getSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!checkRateLimit(user.id)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please wait a moment before trying again." },
      { status: 429 }
    );
  }

  let body: { module: string; field: string; currentValue: string; context: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { module, field, currentValue, context } = body;

  if (!module || !field) {
    return NextResponse.json(
      { error: "Missing required fields: module and field" },
      { status: 400 }
    );
  }

  const moduleConfig = fieldConfigs[module];
  if (!moduleConfig) {
    return NextResponse.json({ error: `Unknown module: ${module}` }, { status: 400 });
  }

  const fieldConfig = moduleConfig[field];
  if (!fieldConfig) {
    return NextResponse.json({ error: `Unknown field: ${field} in module ${module}` }, { status: 400 });
  }

  // Build context string from provided context fields
  const contextParts: string[] = [];
  if (context) {
    for (const key of fieldConfig.contextFields) {
      const val = context[key];
      if (val !== undefined && val !== null && val !== "") {
        contextParts.push(`${key}: ${String(val)}`);
      }
    }
  }

  const isRewrite = currentValue && currentValue.trim().length > 0;
  const contextStr = contextParts.length > 0 ? `\nContext from other form fields:\n${contextParts.join("\n")}` : "";

  let systemPrompt: string;
  if (isRewrite) {
    systemPrompt = `You are rewriting/improving the "${field}" field for a ${module} form in a business management platform.${contextStr}\n\nThe current value is:\n"${currentValue}"\n\nRewrite and improve it. Make it more professional, clear, and detailed while keeping the same intent. Return ONLY the text content — no JSON, no markdown formatting, no quotes around it.`;
  } else {
    systemPrompt = `You are writing the "${field}" field for a ${module} form in a business management platform.${contextStr}\n\nGenerate appropriate content for this field. Be professional and relevant to the context provided. Return ONLY the text content — no JSON, no markdown formatting, no quotes around it.`;
  }

  const model = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: isRewrite ? "Rewrite and improve the content above." : "Generate the content now." },
        ],
        temperature: 0.4,
        max_tokens: fieldConfig.maxTokens,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter error:", response.status, errorText);
      return NextResponse.json(
        { error: "AI service temporarily unavailable. Please try again." },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "No response from AI service" },
        { status: 502 }
      );
    }

    // Clean up the response - remove surrounding quotes if present
    let value = content.trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    return NextResponse.json({ value });
  } catch (error) {
    console.error("AI write-field error:", error);
    return NextResponse.json(
      { error: "Failed to connect to AI service" },
      { status: 502 }
    );
  }
}
