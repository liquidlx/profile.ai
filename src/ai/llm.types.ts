import type { ZodTypeAny } from 'zod';

// Regular text message (system, user, or assistant text reply)
export interface TextChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Assistant message that triggered a tool call (content is null per OpenAI spec)
export interface AssistantToolCallMessage {
  role: 'assistant';
  content: null;
  toolCalls: ToolCall[];
}

// Tool result fed back to the LLM after the tool executed
export interface ToolResultMessage {
  role: 'tool';
  toolCallId: string;
  content: string;
}

export type ChatMessage =
  | TextChatMessage
  | AssistantToolCallMessage
  | ToolResultMessage;

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description?: string;
    parameters: Record<string, unknown>; // JSON Schema
  };
}

export interface ChatOptions {
  model: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json_object';
  /** Zod schema for structured output via zodResponseFormat. Mutually exclusive with responseFormat. */
  zodSchema?: ZodTypeAny;
  tools?: ToolDefinition[];
  toolChoice?: 'none' | 'auto' | { type: 'function'; function: { name: string } };
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string as returned by the API
  };
}

export interface ChatResponse {
  content: string | null;
  toolCalls?: ToolCall[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
