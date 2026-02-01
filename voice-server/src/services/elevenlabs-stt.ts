/**
 * ElevenLabs Streaming Speech-to-Text Service
 *
 * Uses the ElevenLabs WebSocket realtime API for real-time transcription.
 * Docs: https://elevenlabs.io/docs/api-reference/speech-to-text/v-1-speech-to-text-realtime
 */

import { EventEmitter } from "events";
import WebSocket from "ws";

export interface ElevenLabsSTTConfig {
  apiKey: string;
  model?: string;
  language?: string;
}

export interface STTTranscript {
  text: string;
  isFinal: boolean;
  confidence: number;
  speechFinal: boolean;
}

export class ElevenLabsSTTService extends EventEmitter {
  private config: ElevenLabsSTTConfig;
  private ws: WebSocket | null = null;

  constructor(config: ElevenLabsSTTConfig) {
    super();
    this.config = config;
  }

  async start(): Promise<void> {
    const model = this.config.model || "scribe_v2_realtime";
    const language = this.config.language || "en";

    // Build WebSocket URL with query params for audio format and VAD
    const params = new URLSearchParams({
      model_id: model,
      language_code: language,
      audio_format: "ulaw_8000",
      commit_strategy: "vad",
      vad_silence_threshold_secs: "1.5",
      vad_threshold: "0.4",
    });

    const wsUrl = `wss://api.elevenlabs.io/v1/speech-to-text/realtime?${params.toString()}`;

    this.ws = new WebSocket(wsUrl, {
      headers: {
        "xi-api-key": this.config.apiKey,
      },
    });

    this.ws.on("open", () => {
      console.log("[ElevenLabs STT] WebSocket connected");
      this.emit("open");
    });

    this.ws.on("message", (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());

        switch (message.message_type) {
          case "session_started":
            console.log("[ElevenLabs STT] Session started");
            break;

          case "partial_transcript": {
            const partialText = message.text || "";
            if (partialText.trim()) {
              const result: STTTranscript = {
                text: partialText.trim(),
                isFinal: false,
                confidence: 0.9,
                speechFinal: false,
              };
              this.emit("transcript", result);
            }
            break;
          }

          case "committed_transcript":
          case "committed_transcript_with_timestamps": {
            const finalText = message.text || "";
            if (finalText.trim()) {
              const result: STTTranscript = {
                text: finalText.trim(),
                isFinal: true,
                confidence: 0.95,
                speechFinal: true,
              };
              this.emit("transcript", result);
              this.emit("utterance_end");
            }
            break;
          }

          case "input_error":
          case "scribe_error":
            console.error("[ElevenLabs STT] Error:", message);
            this.emit("error", new Error(message.message || "ElevenLabs STT error"));
            break;

          case "scribe_auth_error":
            console.error("[ElevenLabs STT] Auth error:", message);
            this.emit("error", new Error("ElevenLabs STT authentication failed"));
            break;

          default:
            // Handle other error types
            if (message.message_type?.startsWith("scribe_")) {
              console.warn("[ElevenLabs STT] Event:", message.message_type, message);
            }
            break;
        }
      } catch {
        // Non-JSON message, ignore
      }
    });

    this.ws.on("error", (error) => {
      console.error("[ElevenLabs STT] WebSocket error:", error);
      this.emit("error", error);
    });

    this.ws.on("close", (code, reason) => {
      console.log(`[ElevenLabs STT] WebSocket closed: ${code} ${reason}`);
      this.emit("close");
    });
  }

  sendAudio(audioData: Buffer): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = {
        message_type: "input_audio_chunk",
        audio_base_64: audioData.toString("base64"),
        commit: false,
        sample_rate: 8000,
      };
      this.ws.send(JSON.stringify(message));
    }
  }

  close(): void {
    if (this.ws) {
      try {
        // Send a final commit to flush any remaining audio
        if (this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            message_type: "input_audio_chunk",
            audio_base_64: "",
            commit: true,
            sample_rate: 8000,
          }));
        }
      } catch {
        // ignore
      }
      this.ws.close();
      this.ws = null;
    }
  }
}
