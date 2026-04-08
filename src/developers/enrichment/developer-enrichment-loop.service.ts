import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable, Subject } from 'rxjs';
import { randomUUID } from 'crypto';
import type { ChatCompletionMessageParam } from 'openai/resources';
import { LlmService } from '../../ai/llm.service';
import { PrismaService } from '../../prisma';
import { DeveloperEnrichmentService, FactInput } from './developer-enrichment.service';
import { ToolDefinition, ToolCall } from '../../ai/llm.types';

export type DeveloperEnrichmentEvent =
  | { type: 'session_start'; sessionId: string }
  | { type: 'question'; question: string; context?: string }
  | { type: 'fact_stored'; claim: string; factType: string }
  | { type: 'answer'; content: string }
  | { type: 'error'; message: string };

interface PendingTool {
  resolve: (value: string) => void;
}

interface Session {
  subject: Subject<DeveloperEnrichmentEvent>;
  pendingTool: PendingTool | null;
}

const ENRICHMENT_TOOLS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'ask_developer_question',
      description:
        'Ask the developer a clarifying question to gather more information about their experience.',
      parameters: {
        type: 'object',
        properties: {
          question: {
            type: 'string',
            description: 'The clarifying question for the developer',
          },
          context: {
            type: 'string',
            description: 'Brief context on why you are asking',
          },
        },
        required: ['question'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'store_developer_fact',
      description:
        'Persist a confirmed developer fact to their profile. Only call this after the developer has confirmed or provided the information.',
      parameters: {
        type: 'object',
        properties: {
          factType: {
            type: 'string',
            enum: ['SKILL', 'EXPERIENCE', 'ACHIEVEMENT', 'EDUCATION', 'CERTIFICATION', 'OTHER'],
          },
          claim: {
            type: 'string',
            description: 'One atomic statement about the developer.',
          },
          sourceText: {
            type: 'string',
            description: 'The developer statement that supports this claim.',
          },
          company: { type: 'string' },
          title: { type: 'string' },
          startDate: { type: 'string' },
          endDate: { type: 'string' },
        },
        required: ['factType', 'claim', 'sourceText'],
      },
    },
  },
];

@Injectable()
export class DeveloperEnrichmentLoopService {
  private readonly logger = new Logger(DeveloperEnrichmentLoopService.name);
  private readonly sessions = new Map<string, Session>();

  constructor(
    private readonly llmService: LlmService,
    private readonly prisma: PrismaService,
    private readonly enrichmentService: DeveloperEnrichmentService,
    private readonly configService: ConfigService,
  ) {}

  startSession(
    developerId: string,
    topic?: string,
  ): [string, Observable<DeveloperEnrichmentEvent>] {
    const sessionId = randomUUID();
    const subject = new Subject<DeveloperEnrichmentEvent>();
    const session: Session = { subject, pendingTool: null };
    this.sessions.set(sessionId, session);

    subject.next({ type: 'session_start', sessionId });

    void this.runLoop(sessionId, developerId, topic, subject, session).catch(
      (err: unknown) => {
        const message = err instanceof Error ? err.message : 'Unknown error';
        subject.next({ type: 'error', message });
        subject.complete();
        this.sessions.delete(sessionId);
      },
    );

    return [sessionId, subject.asObservable()];
  }

  resumeSession(sessionId: string, developerAnswer: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      this.logger.warn(`Session ${sessionId} not found`);
      return;
    }
    if (!session.pendingTool) {
      this.logger.warn(`Session ${sessionId} has no pending tool`);
      return;
    }

    session.subject.next({ type: 'answer', content: developerAnswer });
    const { resolve } = session.pendingTool;
    session.pendingTool = null;
    resolve(developerAnswer);
  }

  private waitForToolResult(session: Session): Promise<string> {
    return new Promise<string>((resolve) => {
      session.pendingTool = { resolve };
    });
  }

  private async runLoop(
    sessionId: string,
    developerId: string,
    topic: string | undefined,
    subject: Subject<DeveloperEnrichmentEvent>,
    session: Session,
  ): Promise<void> {
    const developer = await this.prisma.developerProfile.findUnique({
      where: { id: developerId },
    });

    if (!developer) {
      subject.next({ type: 'error', message: 'Developer not found' });
      subject.complete();
      this.sessions.delete(sessionId);
      return;
    }

    const existingFactsSummary =
      await this.enrichmentService.getExistingFactsSummary(developerId);

    const systemPrompt = `You are helping a developer named ${developer.name} build out their professional profile.
Your goal is to discover facts about their experience that may not be fully captured in their resume.

${topic ? `Focus on: ${topic}` : 'Cover their overall professional background.'}

Existing facts already known (do NOT re-ask about these):
${existingFactsSummary}

Guidelines:
- Ask one question at a time.
- After the developer answers, store any confirmed facts using store_developer_fact.
- The claim must be based strictly on what the developer said — do not embellish or add assumptions.
- sourceText should be a quote or paraphrase of the developer's exact words.
- After gathering 3-5 facts or if the developer seems done, provide a brief summary and close.`;

    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
    ];

    const model =
      this.configService.get<string>('ai.models.resumeSynthesis') ?? 'gpt-4o-mini';

    let maxIterations = 20;

    while (maxIterations-- > 0) {
      const response = await this.llmService.chat(
        messages as unknown as Parameters<typeof this.llmService.chat>[0],
        {
          model,
          temperature: 0.3,
          tools: ENRICHMENT_TOOLS,
          toolChoice: 'auto',
        },
      );

      if (!response.toolCalls || response.toolCalls.length === 0) {
        if (response.content) {
          messages.push({ role: 'assistant', content: response.content });
        }
        break;
      }

      messages.push({
        role: 'assistant',
        content: response.content ?? null,
        tool_calls: response.toolCalls.map((tc) => ({
          id: tc.id,
          type: 'function' as const,
          function: { name: tc.function.name, arguments: tc.function.arguments },
        })),
      });

      for (const toolCall of response.toolCalls) {
        const toolResult = await this.handleToolCall(
          toolCall,
          developerId,
          session,
          subject,
        );

        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: toolResult,
        });
      }
    }

    subject.complete();
    this.sessions.delete(sessionId);
  }

  private async handleToolCall(
    toolCall: ToolCall,
    developerId: string,
    session: Session,
    subject: Subject<DeveloperEnrichmentEvent>,
  ): Promise<string> {
    const args = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;

    if (toolCall.function.name === 'ask_developer_question') {
      const question = args['question'] as string;
      const context = args['context'] as string | undefined;

      subject.next({ type: 'question', question, context });
      return this.waitForToolResult(session);
    }

    if (toolCall.function.name === 'store_developer_fact') {
      const factInput: FactInput = {
        factType: args['factType'] as string,
        claim: args['claim'] as string,
        sourceText: args['sourceText'] as string,
        company: args['company'] as string | undefined,
        title: args['title'] as string | undefined,
        startDate: args['startDate'] as string | undefined,
        endDate: args['endDate'] as string | undefined,
      };

      await this.enrichmentService.storeFact(developerId, factInput);
      subject.next({ type: 'fact_stored', claim: factInput.claim, factType: factInput.factType });
      return 'Fact stored successfully.';
    }

    return 'Unknown tool.';
  }
}
