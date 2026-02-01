/**
 * Voice Agent Types
 *
 * TypeScript interfaces for the AI-powered voice call system.
 */

// ============================================================================
// Call Configuration
// ============================================================================

export interface VoiceCallConfig {
  /** The phone number to call (E.164 format) */
  phoneNumber: string;
  /** From phone number (Twilio) */
  fromNumber: string;
  /** System prompt defining the AI's role and behavior */
  systemPrompt: string;
  /** The goal the AI should try to achieve during the call */
  conversationGoal?: string;
  /** Maximum call duration in seconds (default: 300) */
  maxDurationSeconds?: number;
  /** AI provider to use */
  aiProvider: "openai" | "anthropic";
  /** AI model ID */
  aiModel: string;
  /** ElevenLabs voice ID for TTS */
  voiceId?: string;
  /** Whether to record the call */
  enableRecording?: boolean;
  /** Initial greeting message */
  initialGreeting?: string;
  /** Context data to include in the conversation */
  contextData?: Record<string, unknown>;
}

export interface VoiceCallInitiateRequest {
  tenantId: string;
  workflowRunId?: string;
  stepExecutionId?: string;
  config: VoiceCallConfig;
}

export interface VoiceCallInitiateResponse {
  success: boolean;
  callId?: string;
  callSid?: string;
  error?: string;
}

// ============================================================================
// Call Status
// ============================================================================

export type VoiceCallStatus =
  | "initiated"
  | "ringing"
  | "in_progress"
  | "completed"
  | "failed"
  | "busy"
  | "no_answer"
  | "cancelled";

export interface VoiceCallRecord {
  id: string;
  tenantId: string;
  workflowRunId?: string;
  stepExecutionId?: string;
  callSid?: string;
  fromNumber: string;
  toNumber: string;
  status: VoiceCallStatus;
  aiProvider: "openai" | "anthropic";
  aiModel: string;
  systemPrompt: string;
  conversationGoal?: string;
  maxDurationSeconds: number;
  durationSeconds?: number;
  transcript: TranscriptEntry[];
  summary?: string;
  goalAchieved?: boolean;
  recordingUrl?: string;
  recordingSid?: string;
  totalCostUsd: number;
  twilioCostUsd: number;
  sttCostUsd: number;
  llmCostUsd: number;
  ttsCostUsd: number;
  voiceId?: string;
  voiceProvider: string;
  metadata: Record<string, unknown>;
  errorMessage?: string;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
}

// ============================================================================
// Transcript & Conversation
// ============================================================================

export interface TranscriptEntry {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  /** Duration in milliseconds for speech */
  durationMs?: number;
  /** Confidence score for STT */
  confidence?: number;
}

export interface ConversationMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ConversationState {
  callId: string;
  messages: ConversationMessage[];
  systemPrompt: string;
  conversationGoal?: string;
  goalAchieved: boolean;
  startTime: number;
  lastActivityTime: number;
}

// ============================================================================
// Audio Processing
// ============================================================================

export interface AudioChunk {
  /** Base64-encoded audio data */
  data: string;
  /** Audio format (e.g., 'audio/x-mulaw', 'audio/pcm') */
  format: string;
  /** Sample rate in Hz */
  sampleRate: number;
  /** Timestamp when the chunk was received */
  timestamp: number;
}

export interface AudioStreamConfig {
  /** Expected audio encoding from Twilio */
  inputEncoding: "mulaw" | "pcm";
  inputSampleRate: number;
  /** Output encoding for TTS playback */
  outputEncoding: "mulaw" | "pcm";
  outputSampleRate: number;
}

// ============================================================================
// Service Interfaces
// ============================================================================

export interface STTService {
  /** Start a streaming transcription session */
  startSession(config: STTSessionConfig): Promise<STTSession>;
}

export interface STTSessionConfig {
  language?: string;
  model?: string;
  onTranscript: (transcript: STTTranscript) => void;
  onError: (error: Error) => void;
}

export interface STTSession {
  /** Send audio data for transcription */
  sendAudio(audio: Buffer): void;
  /** Close the session */
  close(): void;
}

export interface STTTranscript {
  text: string;
  isFinal: boolean;
  confidence: number;
  words?: STTWord[];
}

export interface STTWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

export interface TTSService {
  /** Generate speech from text */
  generateSpeech(text: string, voiceId: string): Promise<TTSResult>;
  /** Start a streaming TTS session */
  startStreamingSession(voiceId: string): Promise<TTSStreamingSession>;
}

export interface TTSResult {
  /** Audio data in the specified format */
  audio: Buffer;
  /** Audio format */
  format: string;
  /** Duration in seconds */
  durationSeconds: number;
}

export interface TTSStreamingSession {
  /** Send text for streaming TTS */
  sendText(text: string): void;
  /** Register callback for audio chunks */
  onAudio(callback: (audio: Buffer) => void): void;
  /** Close the session */
  close(): void;
}

export interface LLMService {
  /** Generate a streaming response */
  generateStreamingResponse(
    messages: ConversationMessage[],
    config: LLMConfig
  ): AsyncIterable<string>;

  /** Generate a complete response */
  generateResponse(
    messages: ConversationMessage[],
    config: LLMConfig
  ): Promise<LLMResponse>;
}

export interface LLMConfig {
  model: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export interface LLMResponse {
  content: string;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  finishReason: string;
}

// ============================================================================
// Twilio Types
// ============================================================================

export interface TwilioMediaStreamMessage {
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

export interface TwilioCallStatus {
  CallSid: string;
  CallStatus: string;
  CallDuration?: string;
  RecordingUrl?: string;
  RecordingSid?: string;
  From: string;
  To: string;
  Direction: string;
}

// ============================================================================
// Voice Server Types
// ============================================================================

export interface VoiceServerConfig {
  port: number;
  /** Base URL for webhooks (e.g., https://your-domain.com) */
  baseUrl: string;
  /** Twilio credentials */
  twilio: {
    accountSid: string;
    authToken: string;
    phoneNumber: string;
  };
}

export interface ActiveCall {
  id: string;
  callSid: string;
  streamSid?: string;
  state: ConversationState;
  config: VoiceCallConfig;
  sttSession?: STTSession;
  ttsSession?: TTSStreamingSession;
  /** Pending audio to play */
  audioQueue: Buffer[];
  /** Whether TTS is currently playing */
  isPlaying: boolean;
  /** Silence detection timer */
  silenceTimer?: NodeJS.Timeout;
}

// ============================================================================
// Cost Calculation
// ============================================================================

export interface CostBreakdown {
  twilio: number;
  stt: number;
  llm: number;
  tts: number;
  total: number;
}

export const COST_RATES = {
  twilio: {
    perMinute: 0.013, // USD per minute for voice calls
    perMinuteRecording: 0.0025,
  },
  deepgram: {
    perMinuteNova2: 0.0043,
    perMinuteNova: 0.0036,
    perMinuteEnhanced: 0.0145,
    perMinuteBase: 0.0125,
  },
  elevenlabs: {
    per1000Chars: 0.30,
  },
  openai: {
    gpt4o: {
      promptPer1M: 2.5,
      completionPer1M: 10.0,
    },
    gpt4oMini: {
      promptPer1M: 0.15,
      completionPer1M: 0.6,
    },
  },
  anthropic: {
    claudeSonnet: {
      promptPer1M: 3.0,
      completionPer1M: 15.0,
    },
    claudeHaiku: {
      promptPer1M: 0.25,
      completionPer1M: 1.25,
    },
  },
} as const;

// ============================================================================
// Workflow Integration
// ============================================================================

export interface VoiceCallStepConfig {
  phone_number: string;
  system_prompt: string;
  conversation_goal?: string;
  ai_provider?: "openai" | "anthropic";
  ai_model?: string;
  voice_id?: string;
  max_duration?: number;
  initial_greeting?: string;
  enable_recording?: boolean;
}

export interface VoiceCallStepOutput {
  call_id: string;
  call_sid?: string;
  status: VoiceCallStatus;
  transcript?: string;
  summary?: string;
  goal_achieved?: boolean;
  duration_seconds?: number;
  recording_url?: string;
  total_cost_usd?: number;
}
