import { Injectable, Logger } from '@nestjs/common';
import { LlmService } from './llm.service';

export interface ExtractedFact {
  factType:
    | 'SKILL'
    | 'EXPERIENCE'
    | 'ACHIEVEMENT'
    | 'EDUCATION'
    | 'CERTIFICATION'
    | 'OTHER';
  claim: string;
  sourceText: string;
  company?: string;
  title?: string;
  startDate?: string;
  endDate?: string;
}

const SYSTEM_PROMPT = `You are an expert resume parser. Extract atomic developer facts from the provided resume text.

Return a JSON array of fact objects. Each object must have:
- factType: one of SKILL, EXPERIENCE, ACHIEVEMENT, EDUCATION, CERTIFICATION, OTHER
- claim: a concise, standalone factual statement (e.g. "Proficient in TypeScript", "Led a team of 5 engineers at Acme Corp")
- sourceText: the verbatim excerpt from the resume that supports this claim
- company: (optional) the company name if relevant
- title: (optional) the job title if relevant
- startDate: (optional) ISO date string (YYYY-MM-DD) if a start date is mentioned
- endDate: (optional) ISO date string (YYYY-MM-DD) if an end date is mentioned

Extract as many distinct facts as possible. Do not merge multiple facts into one. Return only the JSON array with no additional text.`;

@Injectable()
export class FactExtractionService {
  private readonly logger = new Logger(FactExtractionService.name);

  constructor(private readonly llmService: LlmService) {}

  async extractFacts(resumeText: string): Promise<ExtractedFact[]> {
    const response = await this.llmService.chat(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: resumeText },
      ],
      {
        model: 'gpt-4o-mini',
        temperature: 0,
        responseFormat: 'json_object',
        maxTokens: 4096,
      },
    );

    if (!response.content) {
      this.logger.warn('LLM returned empty content during fact extraction');
      return [];
    }

    try {
      const parsed: unknown = JSON.parse(response.content);
      const arr = Array.isArray(parsed)
        ? parsed
        : ((parsed as Record<string, unknown>).facts ??
          (parsed as Record<string, unknown>).data ??
          []);

      if (!Array.isArray(arr)) {
        this.logger.warn('Fact extraction: unexpected LLM response shape');
        return [];
      }

      return (arr as ExtractedFact[]).filter(
        (f) =>
          f && typeof f.claim === 'string' && typeof f.sourceText === 'string',
      );
    } catch (err) {
      this.logger.warn('Failed to parse fact extraction response', err);
      return [];
    }
  }
}
