/**
 * LLM Service - OpenAI and Anthropic Integration
 */

import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

export interface LLMMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface LLMConfig {
  provider: "openai" | "anthropic";
  model: string;
  apiKey: string;
  organizationId?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LLMResponse {
  content: string;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export class LLMService {
  private openaiClient: OpenAI | null = null;
  private anthropicClient: Anthropic | null = null;
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;

    if (config.provider === "openai") {
      this.openaiClient = new OpenAI({
        apiKey: config.apiKey,
        organization: config.organizationId,
      });
    } else if (config.provider === "anthropic") {
      this.anthropicClient = new Anthropic({
        apiKey: config.apiKey,
      });
    }
  }

  /**
   * Generate a response (non-streaming)
   */
  async generateResponse(
    messages: LLMMessage[],
    systemPrompt?: string
  ): Promise<LLMResponse> {
    if (this.config.provider === "openai") {
      return this.generateOpenAIResponse(messages, systemPrompt);
    } else {
      return this.generateAnthropicResponse(messages, systemPrompt);
    }
  }

  /**
   * Generate a streaming response
   */
  async *generateStreamingResponse(
    messages: LLMMessage[],
    systemPrompt?: string
  ): AsyncGenerator<string> {
    if (this.config.provider === "openai") {
      yield* this.streamOpenAI(messages, systemPrompt);
    } else {
      yield* this.streamAnthropic(messages, systemPrompt);
    }
  }

  private async generateOpenAIResponse(
    messages: LLMMessage[],
    systemPrompt?: string
  ): Promise<LLMResponse> {
    if (!this.openaiClient) throw new Error("OpenAI client not initialized");

    const openaiMessages: OpenAI.ChatCompletionMessageParam[] = [];

    if (systemPrompt) {
      openaiMessages.push({ role: "system", content: systemPrompt });
    }

    for (const msg of messages) {
      if (msg.role === "system") continue; // Already added
      openaiMessages.push({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      });
    }

    const response = await this.openaiClient.chat.completions.create({
      model: this.config.model,
      messages: openaiMessages,
      max_tokens: this.config.maxTokens || 500,
      temperature: this.config.temperature || 0.7,
    });

    return {
      content: response.choices[0]?.message?.content || "",
      tokensUsed: {
        prompt: response.usage?.prompt_tokens || 0,
        completion: response.usage?.completion_tokens || 0,
        total: response.usage?.total_tokens || 0,
      },
    };
  }

  private async generateAnthropicResponse(
    messages: LLMMessage[],
    systemPrompt?: string
  ): Promise<LLMResponse> {
    if (!this.anthropicClient) throw new Error("Anthropic client not initialized");

    const anthropicMessages: Anthropic.MessageParam[] = [];

    for (const msg of messages) {
      if (msg.role === "system") continue;
      anthropicMessages.push({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      });
    }

    const response = await this.anthropicClient.messages.create({
      model: this.config.model,
      max_tokens: this.config.maxTokens || 500,
      system: systemPrompt,
      messages: anthropicMessages,
    });

    const textContent = response.content.find((c) => c.type === "text");

    return {
      content: textContent?.type === "text" ? textContent.text : "",
      tokensUsed: {
        prompt: response.usage.input_tokens,
        completion: response.usage.output_tokens,
        total: response.usage.input_tokens + response.usage.output_tokens,
      },
    };
  }

  private async *streamOpenAI(
    messages: LLMMessage[],
    systemPrompt?: string
  ): AsyncGenerator<string> {
    if (!this.openaiClient) throw new Error("OpenAI client not initialized");

    const openaiMessages: OpenAI.ChatCompletionMessageParam[] = [];

    if (systemPrompt) {
      openaiMessages.push({ role: "system", content: systemPrompt });
    }

    for (const msg of messages) {
      if (msg.role === "system") continue;
      openaiMessages.push({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      });
    }

    const stream = await this.openaiClient.chat.completions.create({
      model: this.config.model,
      messages: openaiMessages,
      max_tokens: this.config.maxTokens || 500,
      temperature: this.config.temperature || 0.7,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }

  private async *streamAnthropic(
    messages: LLMMessage[],
    systemPrompt?: string
  ): AsyncGenerator<string> {
    if (!this.anthropicClient) throw new Error("Anthropic client not initialized");

    const anthropicMessages: Anthropic.MessageParam[] = [];

    for (const msg of messages) {
      if (msg.role === "system") continue;
      anthropicMessages.push({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      });
    }

    const stream = this.anthropicClient.messages.stream({
      model: this.config.model,
      max_tokens: this.config.maxTokens || 500,
      system: systemPrompt,
      messages: anthropicMessages,
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        yield event.delta.text;
      }
    }
  }
}
