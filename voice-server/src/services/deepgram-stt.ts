/**
 * Deepgram Streaming Speech-to-Text Service
 */

import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import { EventEmitter } from "events";

export interface DeepgramConfig {
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

export class DeepgramSTTService extends EventEmitter {
  private client: ReturnType<typeof createClient>;
  private connection: ReturnType<ReturnType<typeof createClient>["listen"]["live"]> | null =
    null;
  private config: DeepgramConfig;

  constructor(config: DeepgramConfig) {
    super();
    this.config = config;
    this.client = createClient(config.apiKey);
  }

  async start(): Promise<void> {
    const connection = this.client.listen.live({
      model: this.config.model || "nova-2",
      language: this.config.language || "en",
      smart_format: true,
      encoding: "mulaw",
      sample_rate: 8000,
      channels: 1,
      interim_results: true,
      utterance_end_ms: 1000,
      vad_events: true,
      endpointing: 300,
    });

    this.connection = connection;

    connection.on(LiveTranscriptionEvents.Open, () => {
      this.emit("open");
    });

    connection.on(LiveTranscriptionEvents.Transcript, (data) => {
      const transcript = data.channel?.alternatives?.[0];
      if (transcript) {
        const result: STTTranscript = {
          text: transcript.transcript || "",
          isFinal: data.is_final || false,
          confidence: transcript.confidence || 0,
          speechFinal: data.speech_final || false,
        };

        if (result.text.trim()) {
          this.emit("transcript", result);
        }
      }
    });

    connection.on(LiveTranscriptionEvents.UtteranceEnd, () => {
      this.emit("utterance_end");
    });

    connection.on(LiveTranscriptionEvents.SpeechStarted, () => {
      this.emit("speech_started");
    });

    connection.on(LiveTranscriptionEvents.Error, (error) => {
      this.emit("error", error);
    });

    connection.on(LiveTranscriptionEvents.Close, () => {
      this.emit("close");
    });
  }

  sendAudio(audioData: Buffer): void {
    if (this.connection) {
      this.connection.send(audioData);
    }
  }

  close(): void {
    if (this.connection) {
      this.connection.finish();
      this.connection = null;
    }
  }
}
