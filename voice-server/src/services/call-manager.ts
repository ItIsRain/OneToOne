/**
 * Call Manager - Manages active voice calls and their state
 */

import { v4 as uuidv4 } from "uuid";
import { WebSocket } from "ws";
import { ConversationState, CallInitiateRequest, TranscriptEntry } from "../types";
import { DeepgramSTTService, STTTranscript } from "./deepgram-stt";
import { ElevenLabsTTSService } from "./elevenlabs-tts";
import { LLMService, LLMMessage } from "./llm-service";

interface ActiveCall {
  id: string;
  state: ConversationState;
  ws: WebSocket | null;
  stt: DeepgramSTTService | null;
  tts: ElevenLabsTTSService | null;
  llm: LLMService | null;
  pendingTranscript: string;
  isProcessing: boolean;
  silenceTimer: NodeJS.Timeout | null;
  maxDurationTimer: NodeJS.Timeout | null;
}

const SILENCE_THRESHOLD_MS = 1500; // Silence threshold before processing
const GOAL_CHECK_PHRASES = [
  "yes",
  "sure",
  "okay",
  "alright",
  "sounds good",
  "let's do it",
  "i agree",
  "schedule",
  "book",
  "confirm",
];

export class CallManager {
  private activeCalls: Map<string, ActiveCall> = new Map();
  private onCallUpdate?: (callId: string, update: Partial<ConversationState>) => void;

  constructor(onCallUpdate?: (callId: string, update: Partial<ConversationState>) => void) {
    this.onCallUpdate = onCallUpdate;
  }

  /**
   * Create a new call and return its ID
   */
  createCall(request: CallInitiateRequest): string {
    const callId = uuidv4();

    const state: ConversationState = {
      callId,
      messages: [],
      systemPrompt: request.config.systemPrompt,
      conversationGoal: request.config.conversationGoal,
      goalAchieved: false,
      transcript: [],
      startTime: Date.now(),
      lastActivityTime: Date.now(),
      config: request.config,
      integrations: request.integrations,
    };

    // Initialize services
    let stt: DeepgramSTTService | null = null;
    let tts: ElevenLabsTTSService | null = null;
    let llm: LLMService | null = null;

    if (request.integrations.deepgram) {
      stt = new DeepgramSTTService({
        apiKey: request.integrations.deepgram.apiKey,
        model: request.integrations.deepgram.model || "nova-2",
        language: request.integrations.deepgram.language || "en",
      });
    }

    if (request.integrations.elevenlabs) {
      tts = new ElevenLabsTTSService({
        apiKey: request.integrations.elevenlabs.apiKey,
        voiceId: request.config.voiceId || request.integrations.elevenlabs.voiceId || "21m00Tcm4TlvDq8ikWAM",
      });
    }

    if (request.config.aiProvider === "openai" && request.integrations.openai) {
      llm = new LLMService({
        provider: "openai",
        model: request.config.aiModel || "gpt-4o-mini",
        apiKey: request.integrations.openai.apiKey,
        organizationId: request.integrations.openai.organizationId,
        maxTokens: 150, // Keep responses concise for voice
        temperature: 0.7,
      });
    } else if (request.config.aiProvider === "anthropic" && request.integrations.anthropic) {
      llm = new LLMService({
        provider: "anthropic",
        model: request.config.aiModel || "claude-3-haiku-20240307",
        apiKey: request.integrations.anthropic.apiKey,
        maxTokens: 150,
        temperature: 0.7,
      });
    }

    const call: ActiveCall = {
      id: callId,
      state,
      ws: null,
      stt,
      tts,
      llm,
      pendingTranscript: "",
      isProcessing: false,
      silenceTimer: null,
      maxDurationTimer: null,
    };

    this.activeCalls.set(callId, call);

    return callId;
  }

  /**
   * Get call state by ID
   */
  getCall(callId: string): ConversationState | null {
    const call = this.activeCalls.get(callId);
    return call?.state || null;
  }

  /**
   * Set call SID (from Twilio)
   */
  setCallSid(callId: string, callSid: string): void {
    const call = this.activeCalls.get(callId);
    if (call) {
      call.state.callSid = callSid;
    }
  }

  /**
   * Attach WebSocket connection for Twilio Media Streams
   */
  async attachWebSocket(callId: string, ws: WebSocket): Promise<void> {
    const call = this.activeCalls.get(callId);
    if (!call) {
      console.error(`Call ${callId} not found`);
      ws.close();
      return;
    }

    call.ws = ws;

    // Start STT service
    if (call.stt) {
      call.stt.on("transcript", (transcript: STTTranscript) => {
        this.handleTranscript(callId, transcript);
      });

      call.stt.on("utterance_end", () => {
        this.handleUtteranceEnd(callId);
      });

      call.stt.on("error", (error) => {
        console.error(`STT error for call ${callId}:`, error);
      });

      await call.stt.start();
    }

    // Set max duration timer
    const maxDuration = call.state.config.maxDurationSeconds || 300;
    call.maxDurationTimer = setTimeout(() => {
      this.endCall(callId, "max_duration_reached");
    }, maxDuration * 1000);

    // Send initial greeting if configured
    if (call.state.config.initialGreeting) {
      await this.speak(callId, call.state.config.initialGreeting);

      // Add to transcript
      const entry: TranscriptEntry = {
        role: "assistant",
        content: call.state.config.initialGreeting,
        timestamp: new Date().toISOString(),
      };
      call.state.transcript.push(entry);
      call.state.messages.push({ role: "assistant", content: call.state.config.initialGreeting });
    }
  }

  /**
   * Process incoming audio from Twilio
   */
  processAudio(callId: string, audioPayload: string): void {
    const call = this.activeCalls.get(callId);
    if (!call || !call.stt) return;

    // Reset silence timer on audio input
    if (call.silenceTimer) {
      clearTimeout(call.silenceTimer);
    }

    call.silenceTimer = setTimeout(() => {
      this.handleSilence(callId);
    }, SILENCE_THRESHOLD_MS);

    // Decode base64 audio and send to STT
    const audioBuffer = Buffer.from(audioPayload, "base64");
    call.stt.sendAudio(audioBuffer);

    call.state.lastActivityTime = Date.now();
  }

  /**
   * Handle transcript from STT
   */
  private handleTranscript(callId: string, transcript: STTTranscript): void {
    const call = this.activeCalls.get(callId);
    if (!call) return;

    if (transcript.isFinal) {
      call.pendingTranscript += " " + transcript.text;
      call.pendingTranscript = call.pendingTranscript.trim();
    }
  }

  /**
   * Handle end of utterance
   */
  private async handleUtteranceEnd(callId: string): Promise<void> {
    const call = this.activeCalls.get(callId);
    if (!call || call.isProcessing || !call.pendingTranscript) return;

    await this.processUserInput(callId);
  }

  /**
   * Handle silence (user stopped speaking)
   */
  private async handleSilence(callId: string): Promise<void> {
    const call = this.activeCalls.get(callId);
    if (!call || call.isProcessing || !call.pendingTranscript) return;

    await this.processUserInput(callId);
  }

  /**
   * Process accumulated user input and generate response
   */
  private async processUserInput(callId: string): Promise<void> {
    const call = this.activeCalls.get(callId);
    if (!call || !call.llm || !call.pendingTranscript) return;

    call.isProcessing = true;
    const userText = call.pendingTranscript.trim();
    call.pendingTranscript = "";

    console.log(`[${callId}] User: ${userText}`);

    // Add user message to transcript and conversation
    const userEntry: TranscriptEntry = {
      role: "user",
      content: userText,
      timestamp: new Date().toISOString(),
    };
    call.state.transcript.push(userEntry);
    call.state.messages.push({ role: "user", content: userText });

    // Check for goal achievement
    if (call.state.conversationGoal) {
      const lowerText = userText.toLowerCase();
      const achieved = GOAL_CHECK_PHRASES.some((phrase) => lowerText.includes(phrase));
      if (achieved) {
        call.state.goalAchieved = true;
      }
    }

    try {
      // Build conversation for LLM
      const messages: LLMMessage[] = call.state.messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Generate AI response
      let responseText = "";

      // Use streaming for better latency
      for await (const chunk of call.llm.generateStreamingResponse(
        messages,
        call.state.systemPrompt
      )) {
        responseText += chunk;
      }

      responseText = responseText.trim();

      if (responseText) {
        console.log(`[${callId}] Assistant: ${responseText}`);

        // Add to transcript and conversation
        const assistantEntry: TranscriptEntry = {
          role: "assistant",
          content: responseText,
          timestamp: new Date().toISOString(),
        };
        call.state.transcript.push(assistantEntry);
        call.state.messages.push({ role: "assistant", content: responseText });

        // Speak the response
        await this.speak(callId, responseText);
      }

      // Notify update
      this.onCallUpdate?.(callId, {
        transcript: call.state.transcript,
        goalAchieved: call.state.goalAchieved,
      });
    } catch (error) {
      console.error(`Error processing input for call ${callId}:`, error);
    } finally {
      call.isProcessing = false;
    }
  }

  /**
   * Generate TTS and send to Twilio
   */
  private async speak(callId: string, text: string): Promise<void> {
    const call = this.activeCalls.get(callId);
    if (!call || !call.tts || !call.ws || call.ws.readyState !== WebSocket.OPEN) return;

    try {
      // Generate speech in mulaw format for Twilio
      const audioBuffer = await call.tts.generateSpeechForTwilio(text);

      // Send to Twilio via WebSocket
      const base64Audio = audioBuffer.toString("base64");

      // Twilio expects audio in chunks
      const chunkSize = 640; // 20ms of audio at 8kHz mulaw
      for (let i = 0; i < base64Audio.length; i += chunkSize) {
        const chunk = base64Audio.slice(i, i + chunkSize);
        const message = {
          event: "media",
          streamSid: call.state.streamSid,
          media: {
            payload: chunk,
          },
        };
        call.ws.send(JSON.stringify(message));
      }

      // Send mark to know when audio finished
      const markMessage = {
        event: "mark",
        streamSid: call.state.streamSid,
        mark: {
          name: `speech_${Date.now()}`,
        },
      };
      call.ws.send(JSON.stringify(markMessage));
    } catch (error) {
      console.error(`Error speaking for call ${callId}:`, error);
    }
  }

  /**
   * Set stream SID (from Twilio Media Streams)
   */
  setStreamSid(callId: string, streamSid: string): void {
    const call = this.activeCalls.get(callId);
    if (call) {
      call.state.streamSid = streamSid;
    }
  }

  /**
   * End a call
   */
  endCall(callId: string, reason: string = "normal"): ConversationState | null {
    const call = this.activeCalls.get(callId);
    if (!call) return null;

    console.log(`[${callId}] Ending call: ${reason}`);

    // Clear timers
    if (call.silenceTimer) {
      clearTimeout(call.silenceTimer);
    }
    if (call.maxDurationTimer) {
      clearTimeout(call.maxDurationTimer);
    }

    // Close services
    call.stt?.close();
    call.ws?.close();

    // Calculate duration
    const durationMs = Date.now() - call.state.startTime;

    // Update state
    const finalState = {
      ...call.state,
      lastActivityTime: Date.now(),
    };

    this.activeCalls.delete(callId);

    return finalState;
  }

  /**
   * Get all active call IDs
   */
  getActiveCallIds(): string[] {
    return Array.from(this.activeCalls.keys());
  }

  /**
   * Generate a summary of the conversation
   */
  async generateSummary(callId: string): Promise<string | null> {
    const call = this.activeCalls.get(callId);
    if (!call || !call.llm || call.state.transcript.length === 0) return null;

    const conversationText = call.state.transcript
      .map((t) => `${t.role === "user" ? "Customer" : "Agent"}: ${t.content}`)
      .join("\n");

    const summaryPrompt = `Summarize this phone conversation in 2-3 sentences. Focus on the main topic and outcome.

Conversation:
${conversationText}

Summary:`;

    try {
      const response = await call.llm.generateResponse(
        [{ role: "user", content: summaryPrompt }],
        "You are a helpful assistant that summarizes phone conversations concisely."
      );
      return response.content;
    } catch (error) {
      console.error(`Error generating summary for call ${callId}:`, error);
      return null;
    }
  }
}
