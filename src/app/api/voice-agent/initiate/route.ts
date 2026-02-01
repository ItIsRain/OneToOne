import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { VoiceCallStepConfig } from "@/lib/voice-agent/types";

const VOICE_SERVER_URL = process.env.VOICE_SERVER_URL || "http://localhost:3001";

interface InitiateRequest {
  tenantId: string;
  workflowRunId?: string;
  stepExecutionId?: string;
  config: VoiceCallStepConfig;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: InitiateRequest = await request.json();

    // Validate required fields
    if (!body.tenantId || !body.config?.phone_number || !body.config?.system_prompt) {
      return NextResponse.json(
        { error: "Missing required fields: tenantId, phone_number, system_prompt" },
        { status: 400 }
      );
    }

    // Fetch all required integration credentials
    const { data: integrations, error: integrationError } = await supabase
      .from("tenant_integrations")
      .select("provider, config")
      .eq("tenant_id", body.tenantId)
      .eq("is_active", true)
      .in("provider", ["twilio", "elevenlabs", "deepgram", "openai", "anthropic"]);

    if (integrationError) {
      return NextResponse.json(
        { error: `Failed to fetch integrations: ${integrationError.message}` },
        { status: 500 }
      );
    }

    // Build integrations object
    const integrationMap: Record<string, Record<string, string>> = {};
    for (const integration of integrations || []) {
      integrationMap[integration.provider] = integration.config as Record<string, string>;
    }

    // Validate required integrations
    if (!integrationMap.twilio) {
      return NextResponse.json(
        { error: "Twilio integration not configured. Go to Settings → Integrations to set it up." },
        { status: 400 }
      );
    }
    if (!integrationMap.elevenlabs) {
      return NextResponse.json(
        { error: "ElevenLabs integration not configured. Go to Settings → Integrations to set it up." },
        { status: 400 }
      );
    }
    if (!integrationMap.deepgram) {
      return NextResponse.json(
        { error: "Deepgram integration not configured. Go to Settings → Integrations to set it up." },
        { status: 400 }
      );
    }

    const aiProvider = body.config.ai_provider || "openai";
    if (aiProvider === "openai" && !integrationMap.openai) {
      return NextResponse.json(
        { error: "OpenAI integration not configured. Go to Settings → Integrations to set it up." },
        { status: 400 }
      );
    }
    if (aiProvider === "anthropic" && !integrationMap.anthropic) {
      return NextResponse.json(
        { error: "Anthropic integration not configured. Go to Settings → Integrations to set it up." },
        { status: 400 }
      );
    }

    // Create initial record in voice_agent_calls
    const { data: callRecord, error: insertError } = await supabase
      .from("voice_agent_calls")
      .insert({
        tenant_id: body.tenantId,
        workflow_run_id: body.workflowRunId,
        step_execution_id: body.stepExecutionId,
        from_number: integrationMap.twilio.phone_number,
        to_number: body.config.phone_number,
        status: "initiated",
        ai_provider: aiProvider,
        ai_model: body.config.ai_model || (aiProvider === "openai" ? "gpt-4o-mini" : "claude-3-haiku-20240307"),
        system_prompt: body.config.system_prompt,
        conversation_goal: body.config.conversation_goal,
        max_duration_seconds: body.config.max_duration || 300,
        voice_id: body.config.voice_id || integrationMap.elevenlabs.voice_id,
        voice_provider: "elevenlabs",
      })
      .select("id")
      .single();

    if (insertError || !callRecord) {
      return NextResponse.json(
        { error: `Failed to create call record: ${insertError?.message}` },
        { status: 500 }
      );
    }

    // Prepare request for voice server
    const voiceServerRequest = {
      tenantId: body.tenantId,
      workflowRunId: body.workflowRunId,
      stepExecutionId: body.stepExecutionId,
      config: {
        phoneNumber: body.config.phone_number,
        fromNumber: integrationMap.twilio.phone_number,
        systemPrompt: body.config.system_prompt,
        conversationGoal: body.config.conversation_goal,
        maxDurationSeconds: body.config.max_duration || 300,
        aiProvider: aiProvider,
        aiModel: body.config.ai_model || (aiProvider === "openai" ? "gpt-4o-mini" : "claude-3-haiku-20240307"),
        voiceId: body.config.voice_id || integrationMap.elevenlabs.voice_id,
        enableRecording: body.config.enable_recording !== false,
        initialGreeting: body.config.initial_greeting,
      },
      integrations: {
        twilio: {
          accountSid: integrationMap.twilio.account_sid,
          authToken: integrationMap.twilio.auth_token,
          phoneNumber: integrationMap.twilio.phone_number,
        },
        elevenlabs: {
          apiKey: integrationMap.elevenlabs.api_key,
          voiceId: integrationMap.elevenlabs.voice_id,
        },
        deepgram: {
          apiKey: integrationMap.deepgram.api_key,
          model: integrationMap.deepgram.model,
          language: integrationMap.deepgram.language,
        },
        ...(integrationMap.openai && {
          openai: {
            apiKey: integrationMap.openai.api_key,
            organizationId: integrationMap.openai.organization_id,
          },
        }),
        ...(integrationMap.anthropic && {
          anthropic: {
            apiKey: integrationMap.anthropic.api_key,
          },
        }),
      },
    };

    // Call voice server to initiate the call
    const voiceServerResponse = await fetch(`${VOICE_SERVER_URL}/initiate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(voiceServerRequest),
    });

    if (!voiceServerResponse.ok) {
      const errorData = await voiceServerResponse.json().catch(() => ({}));

      // Update call record with failure
      await supabase
        .from("voice_agent_calls")
        .update({
          status: "failed",
          error_message: errorData.error || "Voice server error",
        })
        .eq("id", callRecord.id);

      return NextResponse.json(
        { error: errorData.error || "Failed to initiate call" },
        { status: voiceServerResponse.status }
      );
    }

    const voiceServerData = await voiceServerResponse.json();

    // Update call record with Twilio call SID
    await supabase
      .from("voice_agent_calls")
      .update({
        call_sid: voiceServerData.callSid,
        status: "ringing",
      })
      .eq("id", callRecord.id);

    return NextResponse.json({
      success: true,
      call_id: callRecord.id,
      call_sid: voiceServerData.callSid,
    });
  } catch (error) {
    console.error("Error initiating voice call:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
