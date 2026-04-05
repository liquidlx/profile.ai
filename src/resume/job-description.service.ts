import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmService } from '../ai/llm.service';
import { JobRequirements } from './types';

@Injectable()
export class JobDescriptionService {
  private readonly logger = new Logger(JobDescriptionService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly llmService: LlmService,
  ) {}

  async analyzeJobDescription(
    jobDescription: string,
  ): Promise<JobRequirements> {
    const systemPrompt = `You are an expert job description analyzer. Extract structured information from job postings.

Return ONLY valid JSON in this exact format:
{
  "requiredSkills": ["skill1", "skill2"],
  "preferredSkills": ["skill3", "skill4"],
  "responsibilities": ["responsibility1", "responsibility2"],
  "requiredExperience": ["experience1", "experience2"],
  "preferredExperience": ["experience3"],
  "keyQualifications": ["qualification1", "qualification2"]
}

Extract:
- requiredSkills: Technologies, tools, or skills explicitly marked as required
- preferredSkills: Skills mentioned as "nice to have" or "preferred"
- responsibilities: Key job duties and responsibilities
- requiredExperience: Experience levels or types explicitly required
- preferredExperience: Experience mentioned as preferred but not required
- keyQualifications: Important qualifications, certifications, or requirements

Be specific and actionable. Return empty arrays if a category has no items.`;

    const userPrompt = `Analyze this job description:\n\n${jobDescription}`;

    try {
      const { content } = await this.llmService.chat(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        {
          model: this.configService.get<string>('ai.models.jobDescription')!,
          temperature: this.configService.get<number>(
            'ai.params.jobDescription.temperature',
          ),
          responseFormat: 'json_object',
        },
      );

      const parsed = JSON.parse(content!) as JobRequirements;

      // Validate structure
      if (
        !Array.isArray(parsed.requiredSkills) ||
        !Array.isArray(parsed.preferredSkills) ||
        !Array.isArray(parsed.responsibilities) ||
        !Array.isArray(parsed.requiredExperience) ||
        !Array.isArray(parsed.preferredExperience) ||
        !Array.isArray(parsed.keyQualifications)
      ) {
        throw new Error('Invalid job requirements structure from AI');
      }

      return parsed;
    } catch (error) {
      this.logger.error('Failed to analyze job description:', error);
      throw new Error(
        `Failed to analyze job description: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async extractJobTitle(jobDescription: string): Promise<string | null> {
    // Try to extract job title using common patterns
    const patterns = [
      // Pattern: "Job Title" or "Position: Job Title"
      /(?:position|role|title|job)[\s:]+([A-Z][A-Za-z\s&]+(?:Engineer|Developer|Manager|Lead|Architect|Analyst|Designer|Specialist|Consultant|Director|Coordinator|Administrator))/i,
      // Pattern: "We are looking for a/an Job Title"
      /(?:looking\s+for|seeking|hiring)\s+(?:a|an)?\s*([A-Z][A-Za-z\s&]+(?:Engineer|Developer|Manager|Lead|Architect|Analyst|Designer|Specialist|Consultant|Director|Coordinator|Administrator))/i,
      // Pattern: "Job Title at Company" or "Job Title - Company"
      /^([A-Z][A-Za-z\s&]+(?:Engineer|Developer|Manager|Lead|Architect|Analyst|Designer|Specialist|Consultant|Director|Coordinator|Administrator))\s+(?:at|-)/i,
      // Pattern: First line often contains job title
      /^([A-Z][A-Za-z\s&]+(?:Engineer|Developer|Manager|Lead|Architect|Analyst|Designer|Specialist|Consultant|Director|Coordinator|Administrator))/,
    ];

    for (const pattern of patterns) {
      const match = jobDescription.match(pattern);
      if (match && match[1]) {
        const title = match[1].trim();
        // Clean up common prefixes/suffixes
        return title
          .replace(/^(position|role|title|job)[\s:]+/i, '')
          .replace(/\s+/g, ' ')
          .trim();
      }
    }

    // Fallback: Use AI extraction if patterns fail
    try {
      const systemPrompt = `Extract the job title from a job description. Return ONLY the job title, nothing else. Examples: "Senior Backend Engineer", "Full Stack Developer", "Product Manager". If no clear title, return null.`;

      const { content } = await this.llmService.chat(
        [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Extract job title from:\n\n${jobDescription.substring(0, 500)}`,
          },
        ],
        {
          model: this.configService.get<string>('ai.models.jobDescription')!,
          temperature: 0,
          maxTokens: 50,
        },
      );

      const title = content?.trim();
      return title && title !== 'null' ? title : null;
    } catch (error) {
      this.logger.error(
        'Failed to extract job title with AI, returning null',
        error,
      );
      return null;
    }
  }
}
