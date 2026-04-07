import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable, Subject } from 'rxjs';
import { randomUUID } from 'crypto';
import { LlmService } from '../ai/llm.service';
import { ChatMessage, ToolCall, ToolDefinition } from '../ai/llm.types';
import { RecruiterChatService } from './recruiterChat.service';

export type AgentEvent =
  | { type: 'session_start'; sessionId: string }
  | { type: 'tool_call'; toolName: string; args: Record<string, unknown> }
  | { type: 'answer'; content: string }
  | { type: 'error'; message: string };

const RECRUITER_TOOLS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'ask_recruiter_confirmation',
      description:
        'Ask the recruiter a clarifying question when their request is ambiguous or requires more context to answer accurately.',
      parameters: {
        type: 'object',
        properties: {
          question: {
            type: 'string',
            description: 'The clarifying question to ask the recruiter',
          },
        },
        required: ['question'],
      },
    },
  },
];

@Injectable()
export class AgentLoopService {
  private readonly logger = new Logger(AgentLoopService.name);

  private readonly sessions = new Map<string, Subject<AgentEvent>>();
  private readonly pendingResolvers = new Map<string, (result: string) => void>();

  constructor(
    private readonly llmService: LlmService,
    private readonly recruiterChatService: RecruiterChatService,
    private readonly configService: ConfigService,
  ) {}

  startSession(
    developerId: string,
    recruiterId: string,
    question: string,
  ): [string, Observable<AgentEvent>] {
    const sessionId = randomUUID();
    const subject = new Subject<AgentEvent>();
    this.sessions.set(sessionId, subject);

    subject.next({ type: 'session_start', sessionId });

    // Run the loop async — do not await
    void this.runLoop(sessionId, developerId, recruiterId, question);

    return [sessionId, subject.asObservable()];
  }

  resumeSession(sessionId: string, toolResult: string): void {
    const resolve = this.pendingResolvers.get(sessionId);
    if (!resolve) {
      this.logger.warn(`No pending session found for id=${sessionId}`);
      return;
    }
    this.pendingResolvers.delete(sessionId);
    resolve(toolResult);
  }

  private async runLoop(
    sessionId: string,
    developerId: string,
    recruiterId: string,
    question: string,
  ): Promise<void> {
    const subject = this.sessions.get(sessionId)!;

    try {
      const { systemPrompt } = await this.recruiterChatService.buildContext(
        developerId,
        question,
      );

      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question },
      ];

      // Agent loop — continues until the LLM gives a final text answer
      while (true) {
        const response = await this.llmService.chat(messages, {
          model: this.configService.get<string>('ai.models.recruiterChat')!,
          temperature: this.configService.get<number>(
            'ai.params.recruiterChat.temperature',
          ),
          maxTokens: this.configService.get<number>(
            'ai.params.recruiterChat.maxTokens',
          ),
          tools: RECRUITER_TOOLS,
          toolChoice: 'auto',
        });

        if (response.toolCalls?.length) {
          const toolCall = response.toolCalls[0] as ToolCall;

          // Add the assistant's tool call to history
          messages.push({
            role: 'assistant',
            content: null,
            toolCalls: [toolCall],
          });

          // Parse args and emit to frontend
          const args = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;
          subject.next({ type: 'tool_call', toolName: toolCall.function.name, args });

          // Pause until the frontend sends the tool result via /resume
          const toolResult = await this.waitForToolResult(sessionId);

          // Add tool result to history and continue loop
          messages.push({
            role: 'tool',
            toolCallId: toolCall.id,
            content: toolResult,
          });

          continue;
        }

        // Final answer — emit and close the stream
        subject.next({ type: 'answer', content: response.content ?? '' });
        subject.complete();
        break;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Agent loop error for session=${sessionId}: ${message}`);
      subject.next({ type: 'error', message });
      subject.error(error);
    } finally {
      this.sessions.delete(sessionId);
      this.pendingResolvers.delete(sessionId);
    }
  }

  private waitForToolResult(sessionId: string): Promise<string> {
    return new Promise((resolve) => {
      this.pendingResolvers.set(sessionId, resolve);
    });
  }
}
