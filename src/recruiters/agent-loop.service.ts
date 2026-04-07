import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import { LlmService } from '../ai/llm.service';
import { ConfigService } from '@nestjs/config';
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

const ASK_RECRUITER_CONFIRMATION_TOOL: ToolDefinition = {
  type: 'function',
  function: {
    name: 'ask_recruiter_confirmation',
    description:
      'Ask the recruiter for clarification or additional details before answering.',
    parameters: {
      type: 'object',
      properties: {
        question: {
          type: 'string',
          description: 'The clarifying question to ask the recruiter.',
        },
      },
      required: ['question'],
    },
  },
};

export interface AgentLoopResult {
  answer: string;
  citedFactIds: string[];
  hasInformation: boolean;
}

@Injectable()
export class AgentLoopService {
  private readonly logger = new Logger(AgentLoopService.name);

  constructor(
    private readonly llmService: LlmService,
    private readonly configService: ConfigService,
    private readonly recruiterChatService: RecruiterChatService,
  ) {}

  async startSession(
    developerId: string,
    question: string,
  ): Promise<AgentLoopResult> {
    const { systemPrompt, retrievedFacts } =
      await this.recruiterChatService.buildContext(developerId, question);

    return this.runLoop(systemPrompt, question, retrievedFacts);
  }

  private async runLoop(
    systemPrompt: string,
    question: string,
    retrievedFacts: RetrievedFact[],
  ): Promise<AgentLoopResult> {
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

    // Phase 1: Tool-calling loop
    let iterations = 0;
    const maxIterations = 5;

    while (iterations < maxIterations) {
      iterations++;

      const response = await this.llmService.chat(messages, {
        model,
        temperature,
        maxTokens,
        tools: [ASK_RECRUITER_CONFIRMATION_TOOL],
        toolChoice: 'auto',
      });

      if (response.content) {
        messages.push({ role: 'assistant', content: response.content });
      }

      if (!response.toolCalls || response.toolCalls.length === 0) {
        break;
      }

      for (const toolCall of response.toolCalls) {
        this.logger.debug(`Tool called: ${toolCall.function.name}`);
      }
    }

    // Phase 2: Final structured answer with citation enforcement
    messages.push({
      role: 'user',
      content:
        'Based on the facts provided, give your final structured answer. ' +
        'Only cite fact IDs that were listed in the system prompt.',
    });

    const structuredResponse = await this.llmService.chat(messages, {
      model,
      temperature,
      zodSchema: RecruiterAnswerSchema,
    });

    let parsed: z.infer<typeof RecruiterAnswerSchema>;
    try {
      parsed = RecruiterAnswerSchema.parse(
        JSON.parse(structuredResponse.content ?? '{}'),
      );
    } catch (err) {
      this.logger.warn('Failed to parse structured LLM response', err);
      return { answer: NO_INFO_ANSWER, citedFactIds: [], hasInformation: false };
    }

    // Validate citations
    const validIds = new Set(retrievedFacts.map((f) => f.id));
    const validCitations = parsed.citedFactIds.filter((id) => validIds.has(id));
    const allValid = validCitations.length === parsed.citedFactIds.length;

    if (!allValid) {
      this.logger.warn(
        `Citation validation failed: some IDs not in retrieved facts. ` +
          `Requested: ${parsed.citedFactIds.join(', ')}`,
      );
    }

    const answer = parsed.hasInformation ? parsed.answer : NO_INFO_ANSWER;

    return {
      answer,
      citedFactIds: validCitations,
      hasInformation: parsed.hasInformation,
    };
  }
}
