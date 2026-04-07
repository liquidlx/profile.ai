import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';
import { LlmService } from './llm.service';

export interface ExtractedFact {
  factType: 'SKILL' | 'EXPERIENCE' | 'ACHIEVEMENT' | 'EDUCATION' | 'CERTIFICATION' | 'OTHER';
  claim: string;
  sourceText: string;
  company?: string;
  title?: string;
  startDate?: string;
  endDate?: string;
}

const FactSchema = z.object({
  factType: z.enum(['SKILL', 'EXPERIENCE', 'ACHIEVEMENT', 'EDUCATION', 'CERTIFICATION', 'OTHER']),
  claim: z.string().describe('One atomic statement. Do not combine multiple ideas. Do not infer.'),
  sourceText: z
    .string()
    .describe('Exact verbatim quote from the resume text that supports this claim.'),
  company: z.string().optional(),
  title: z.string().optional(),
  startDate: z
    .string()
    .optional()
    .describe('ISO 8601 date string, e.g. "2021-03-01", or omit if unknown.'),
  endDate: z.string().optional(),
});

const ExtractionResponseSchema = z.object({
  facts: z.array(FactSchema),
});

const SYSTEM_PROMPT = `You are a precise resume parser. Extract every verifiable fact from the resume text below.

Rules (MUST follow):
- Only extract what is literally written in the text.
- Each fact must be a single atomic claim (one idea). If a sentence contains two claims, create two separate facts.
- sourceText must be an exact verbatim quote from the resume — never paraphrase.
- Do NOT infer, assume, or combine information. If the resume says "led a team", the claim is "led a team" — do not add size, context, or outcomes unless they appear in the text.
- Do NOT generate facts about skills that are only implied (e.g., if someone worked at a company using React, do not generate a React skill fact unless the resume explicitly states React proficiency).`;

@Injectable()
export class FactExtractionService {
  private readonly logger = new Logger(FactExtractionService.name);
  private readonly model: string;
  private readonly maxTokens: number;

  constructor(
    private readonly llmService: LlmService,
    configService: ConfigService,
  ) {
    this.model = configService.get<string>('ai.models.factExtraction') ?? 'gpt-4o-mini';
    this.maxTokens = configService.get<number>('ai.params.factExtraction.maxTokens') ?? 4096;
  }

  async extractFacts(resumeText: string): Promise<ExtractedFact[]> {
    try {
      const response = await this.llmService.chat(
        [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: resumeText },
        ],
        {
          model: this.model,
          temperature: 0,
          maxTokens: this.maxTokens,
          zodSchema: ExtractionResponseSchema,
        },
      );

      const { content } = response;
      if (!content) {
        this.logger.warn('LLM returned no content');
        return [];
      }

      const parsed = ExtractionResponseSchema.parse(JSON.parse(content));
      return parsed.facts;
    } catch (error) {
      this.logger.error('Extraction failed', error);
      return [];
    }
  }
}
