import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import { ConfigService } from '@nestjs/config';
import { Observable, Subject } from 'rxjs';
import { randomUUID } from 'crypto';
import { LlmService } from '../ai/llm.service';
import { ChatMessage, ToolDefinition } from '../ai/llm.types';
import { RecruiterChatService, RetrievedFact } from './recruiterChat.service';

const RecruiterAnswerSchema = z.object({
  answer: z
    .string()
    .describe('Answer to the recruiter question based only on the cited facts.'),
  citedFactIds: z
    .array(z.string())
    .describe(
      'IDs of the DeveloperFacts used to form this answer (without the FACT- prefix).',
    ),
  hasInformation: z
    .boolean()
    .describe(
      'True if the retrieved facts contain enough information to answer.',
    ),
});

const NO_INFO_ANSWER =
  "I don't have enough verified information to answer that question.";

export type AgentEvent =
  | { type: 'session_start'; sessionId: string }
  | { type: 'tool_call'; toolName: string; args: Record<string, unknown> }
  | { type: 'answer'; content: string; citedFactIds: string[] }
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

    void this.runLoop(sessionId, developerId, question);

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
    question: string,
  ): Promise<void> {
    const subject = this.sessions.get(sessionId)!;

    try {
      const { systemPrompt, retrievedFacts } =
        await this.recruiterChatService.buildContext(developerId, question);

      const model = this.configService.get<string>('ai.models.recruiterChat')!;
      const temperature = this.configService.get<number>(
        'ai.params.recruiterChat.temperature',
      );
      const maxTokens = this.configService.get<number>(
        'ai.params.recruiterChat.maxTokens',
      );

      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question },
      ];

      // Phase 1: Tool-calling loop (pause/resume for recruiter clarification)
      while (true) {
        const response = await this.llmService.chat(messages, {
          model,
          temperature,
          maxTokens,
          tools: RECRUITER_TOOLS,
          toolChoice: 'auto',
        });

        if (response.toolCalls?.length) {
          const toolCall = response.toolCalls[0];

          messages.push({
            role: 'assistant',
            content: null,
            toolCalls: [toolCall],
          });

          const args = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;
          subject.next({ type: 'tool_call', toolName: toolCall.function.name, args });

          const toolResult = await this.waitForToolResult(sessionId);

          messages.push({
            role: 'tool',
            toolCallId: toolCall.id,
            content: toolResult,
          });

          continue;
        }

        if (response.content) {
          messages.push({ role: 'assistant', content: response.content });
        }
        break;
      }

      // Phase 2: Structured final answer with citation enforcement
      messages.push({
        role: 'user',
        content:
          'Based on the facts provided, give your final structured answer. ' +
          'Only cite fact IDs that were listed in the system prompt.',
      });

      const structuredResponse = await this.llmService.chat(messages, {
        model,
        temperature: 0,
        zodSchema: RecruiterAnswerSchema,
      });

      let parsed: z.infer<typeof RecruiterAnswerSchema>;
      try {
        parsed = RecruiterAnswerSchema.parse(
          JSON.parse(structuredResponse.content ?? '{}'),
        );
      } catch (err) {
        this.logger.warn('Failed to parse structured LLM response', err);
        subject.next({ type: 'answer', content: NO_INFO_ANSWER, citedFactIds: [] });
        subject.complete();
        return;
      }

      // Validate citations against retrieved facts
      const validIds = new Set<string>(retrievedFacts.map((f: RetrievedFact) => f.id));
      const validCitations = parsed.citedFactIds.filter((id) => validIds.has(id));

      if (validCitations.length !== parsed.citedFactIds.length) {
        this.logger.warn(
          `Citation validation failed: some IDs not in retrieved facts. ` +
            `Requested: ${parsed.citedFactIds.join(', ')}`,
        );
      }

      const answer = parsed.hasInformation ? parsed.answer : NO_INFO_ANSWER;
      subject.next({ type: 'answer', content: answer, citedFactIds: validCitations });
      subject.complete();
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
