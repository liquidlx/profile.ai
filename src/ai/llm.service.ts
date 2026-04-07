import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import type {
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionMessageParam,
  ChatCompletionTool,
  ChatCompletionToolChoiceOption,
} from 'openai/resources';
import { ChatMessage, ChatOptions, ChatResponse } from './llm.types';

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly client: OpenAI;

  constructor(private readonly configService: ConfigService) {
    this.client = new OpenAI({
      apiKey: this.configService.get<string>('ai.openaiApiKey'),
      maxRetries: this.configService.get<number>('ai.retry.maxRetries') ?? 3,
    });
  }

  async chat(messages: ChatMessage[], options: ChatOptions): Promise<ChatResponse> {
    const params: ChatCompletionCreateParamsNonStreaming = {
      model: options.model,
      messages: messages.map((m) => this.toSdkMessage(m)),
      ...(options.temperature !== undefined && { temperature: options.temperature }),
      ...(options.maxTokens !== undefined && { max_tokens: options.maxTokens }),
      ...(options.zodSchema
        ? { response_format: zodResponseFormat(options.zodSchema, 'response') }
        : options.responseFormat && { response_format: { type: options.responseFormat } }),
      ...(options.tools && {
        tools: options.tools as ChatCompletionTool[],
        tool_choice: options.toolChoice as ChatCompletionToolChoiceOption,
      }),
    };

    this.logger.debug(`LLM call: model=${options.model}`);

    const completion = await this.client.chat.completions.create(params);
    const choice = completion.choices[0];

    return {
      content: choice.message.content,
      toolCalls: choice.message.tool_calls
        ?.filter((tc) => tc.type === 'function')
        .map((tc) => {
          const fnCall = tc as { id: string; type: 'function'; function: { name: string; arguments: string } };
          return {
            id: fnCall.id,
            type: 'function' as const,
            function: {
              name: fnCall.function.name,
              arguments: fnCall.function.arguments,
            },
          };
        }),
      usage: completion.usage
        ? {
            promptTokens: completion.usage.prompt_tokens,
            completionTokens: completion.usage.completion_tokens,
            totalTokens: completion.usage.total_tokens,
          }
        : undefined,
    };
  }

  private toSdkMessage(msg: ChatMessage): ChatCompletionMessageParam {
    if (msg.role === 'tool') {
      return {
        role: 'tool',
        tool_call_id: msg.toolCallId,
        content: msg.content,
      };
    }
    if (msg.role === 'assistant' && msg.content === null) {
      return {
        role: 'assistant',
        content: null,
        tool_calls: msg.toolCalls.map((tc) => ({
          id: tc.id,
          type: 'function' as const,
          function: { name: tc.function.name, arguments: tc.function.arguments },
        })),
      };
    }
    return { role: msg.role, content: msg.content };
  }
}
