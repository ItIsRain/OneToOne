/**
 * Voice Server Types
 */

export interface VoiceCallConfig {
  phoneNumber: string;
  fromNumber: string;
  systemPrompt: string;
  conversationGoal?: string;
  maxDurationSeconds?: number;
  aiProvider: "openai" | "anthropic";
  aiModel: string;
  voiceId?: string;
  enableRecording?: boolean;
  initialGreeting?: string;
  contextData?: Record<string, unknown>;
}

export interface CallInitiateRequest {
  tenantId: string;
  workflowRunId?: string;
  stepExecutionId?: string;
  config: VoiceCallConfig;
  /** Integration credentials from tenant_integrations */
  integrations: {
    twilio?: {
      accountSid: string;
      authToken: string;
      phoneNumber: string;
    };
    elevenlabs?: {
      apiKey: string;
      voiceId?: string;
    };
    deepgram?: {
      apiKey: string;
      model?: string;
      language?: string;
    };
    openai?: {
      apiKey: string;
      organizationId?: string;
    };
    anthropic?: {
      apiKey: string;
    };
  };
}

export interface TranscriptEntry {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  durationMs?: number;
  confidence?: number;
}

export interface ConversationState {
  callId: string;
  callSid?: string;
  streamSid?: string;
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  systemPrompt: string;
  conversationGoal?: string;
  goalAchieved: boolean;
  transcript: TranscriptEntry[];
  startTime: number;
  lastActivityTime: number;
  config: VoiceCallConfig;
  integrations: CallInitiateRequest["integrations"];
}

export interface TwilioMediaMessage {
  event: string;
  sequenceNumber?: string;
  streamSid?: string;
  media?: {
    track: string;
    chunk: string;
    timestamp: string;
    payload: string;
  };
  start?: {
    streamSid: string;
    accountSid: string;
    callSid: string;
    tracks: string[];
    customParameters: Record<string, string>;
    mediaFormat: {
      encoding: string;
      sampleRate: number;
      channels: number;
    };
  };
  stop?: {
    accountSid: string;
    callSid: string;
  };
  mark?: {
    name: string;
  };
}

export type CallStatus =
  | "initiated"
  | "ringing"
  | "in_progress"
  | "completed"
  | "failed"
  | "busy"
  | "no_answer"
  | "cancelled";

export interface CallStatusUpdate {
  callId: string;
  callSid: string;
  status: CallStatus;
  durationSeconds?: number;
  recordingUrl?: string;
  recordingSid?: string;
  errorMessage?: string;
  transcript?: TranscriptEntry[];
  summary?: string;
  goalAchieved?: boolean;
}
