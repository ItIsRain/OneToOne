/**
 * ElevenLabs Text-to-Speech Service
 */

import { EventEmitter } from "events";

export interface ElevenLabsConfig {
  apiKey: string;
  voiceId: string;
  modelId?: string;
}

export class ElevenLabsTTSService extends EventEmitter {
  private config: ElevenLabsConfig;
  private readonly FALLBACK_VOICE = "21m00Tcm4TlvDq8ikWAM"; // Rachel

  constructor(config: ElevenLabsConfig) {
    super();
    this.config = config;
  }

  /**
   * Generate speech from text and return audio buffer
   */
  async generateSpeech(text: string): Promise<Buffer> {
    const voiceId = this.config.voiceId || this.FALLBACK_VOICE;
    const modelId = this.config.modelId || "eleven_turbo_v2_5";

    let response = await this.callTTS(text, voiceId, modelId);

    // If voice is restricted, try fallback
    if (response.status === 402 && voiceId !== this.FALLBACK_VOICE) {
      console.log(`Voice ${voiceId} restricted, using fallback`);
      response = await this.callTTS(text, this.FALLBACK_VOICE, modelId);
    }

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      throw new Error(`ElevenLabs API error ${response.status}: ${errBody}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Generate speech optimized for streaming to Twilio
   * Returns audio in mulaw format at 8000Hz
   */
  async generateSpeechForTwilio(text: string): Promise<Buffer> {
    const voiceId = this.config.voiceId || this.FALLBACK_VOICE;
    const modelId = this.config.modelId || "eleven_turbo_v2_5";

    let response = await this.callTTSWithFormat(text, voiceId, modelId, "ulaw_8000");

    // If voice is restricted, try fallback
    if (response.status === 402 && voiceId !== this.FALLBACK_VOICE) {
      console.log(`Voice ${voiceId} restricted, using fallback`);
      response = await this.callTTSWithFormat(
        text,
        this.FALLBACK_VOICE,
        modelId,
        "ulaw_8000"
      );
    }

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      throw new Error(`ElevenLabs API error ${response.status}: ${errBody}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  private async callTTS(
    text: string,
    voiceId: string,
    modelId: string
  ): Promise<Response> {
    return fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": this.config.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });
  }

  private async callTTSWithFormat(
    text: string,
    voiceId: string,
    modelId: string,
    outputFormat: string
  ): Promise<Response> {
    return fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=${outputFormat}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": this.config.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );
  }
}
