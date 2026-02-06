import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaClient, ResumeChunk } from '../../generated/prisma';
import { EmbeddingService } from '../ai/embedding.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { JobRequirements, TailoredResume } from './types';

@Injectable()
export class ResumeSynthesisService {
  private readonly logger = new Logger(ResumeSynthesisService.name);
  private readonly openAiChatUrl = 'https://api.openai.com/v1/chat/completions';
  private readonly model = 'gpt-4o-mini'; // Using more capable model for structured output

  constructor(
    private readonly prisma: PrismaClient,
    private readonly embeddingService: EmbeddingService,
    private readonly configService: ConfigService,
  ) {}

  async synthesizeTailoredResume(
    developerId: string,
    jobRequirements: JobRequirements,
  ): Promise<TailoredResume> {
    // Get developer profile with original resume text
    const developer = await this.prisma.developerProfile.findUnique({
      where: { id: developerId },
      include: { user: { select: { email: true } } },
    });

    if (!developer) {
      throw new NotFoundException('Developer profile not found');
    }

    if (!developer.originalResumeText) {
      throw new NotFoundException(
        'Resume not found. Please upload a resume first.',
      );
    }

    // Get relevant resume chunks using vector search
    const relevantChunks = await this.getRelevantResumeChunks(
      developerId,
      jobRequirements,
    );

    // Build context for GPT
    const resumeContext = this.buildResumeContext(
      developer.originalResumeText,
      relevantChunks,
    );

    // Generate tailored resume using GPT
    const tailoredResume = await this.generateTailoredResume(
      resumeContext,
      jobRequirements,
    );

    return tailoredResume;
  }

  private async getRelevantResumeChunks(
    developerId: string,
    jobRequirements: JobRequirements,
  ): Promise<ResumeChunk[]> {
    // Create a query from job requirements
    const queryText = [
      ...jobRequirements.requiredSkills,
      ...jobRequirements.preferredSkills,
      ...jobRequirements.responsibilities.join(' '),
    ].join(' ');

    // Get embedding for the query
    const queryEmbedding = await this.embeddingService.getEmbedding(queryText);

    // Find top relevant chunks
    const topChunks: ResumeChunk[] = await this.prisma.$queryRaw`
      SELECT "id", "chunkText", "developerId", "createdAt"
      FROM "ResumeChunk"
      WHERE "developerId" = ${developerId}
      ORDER BY embedding <-> ${queryEmbedding}::vector
      LIMIT 10
    `;

    return topChunks;
  }

  private buildResumeContext(
    originalText: string,
    relevantChunks: ResumeChunk[],
  ): string {
    const chunkTexts = relevantChunks
      .map((chunk) => chunk.chunkText)
      .join('\n\n---\n\n');

    return `Original Resume:\n${originalText}\n\nMost Relevant Sections:\n${chunkTexts}`;
  }

  private async generateTailoredResume(
    resumeContext: string,
    jobRequirements: JobRequirements,
  ): Promise<TailoredResume> {
    const systemPrompt = `You are an expert resume tailor. Your job is to adapt a resume to match a specific job description.

CRITICAL RULES - YOU MUST FOLLOW THESE:
1. ONLY use content from the provided original resume - NEVER invent, add, or exaggerate
2. Reorder sections by relevance to the job (most relevant first)
3. Rewrite bullet points to emphasize aspects that match the job requirements
4. Prioritize skills that match the job requirements
5. If evidence doesn't support a job requirement, omit it - never make it up
6. Provide reasoning for each significant change

Return ONLY valid JSON in this exact format:
{
  "name": "Developer Name",
  "sections": [
    {
      "title": "Section Title",
      "content": ["bullet point 1", "bullet point 2"],
      "order": 1
    }
  ],
  "skills": ["skill1", "skill2"],
  "summary": "Optional summary if present in original",
  "changes": {
    "sectionOrder": ["Section1", "Section2"],
    "rewrittenBullets": [
      {
        "original": "Original bullet text",
        "tailored": "Rewritten bullet emphasizing job relevance",
        "reason": "Why this change was made"
      }
    ],
    "prioritizedSkills": ["skill1", "skill2"]
  }
}

Sections should include: Experience, Education, Skills, Projects, etc. as they appear in the original resume.
Order sections by relevance to the job (most relevant first).
Rewrite bullets to emphasize job-relevant aspects while staying truthful to the original content.`;

    const userPrompt = `Job Requirements:
Required Skills: ${jobRequirements.requiredSkills.join(', ')}
Preferred Skills: ${jobRequirements.preferredSkills.join(', ')}
Responsibilities: ${jobRequirements.responsibilities.join('; ')}
Required Experience: ${jobRequirements.requiredExperience.join(', ')}
Key Qualifications: ${jobRequirements.keyQualifications.join(', ')}

${resumeContext}

Generate a tailored resume that matches these job requirements. Remember: ONLY use content from the original resume.`;

    try {
      const response = await axios.post(
        this.openAiChatUrl,
        {
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.2,
          response_format: { type: 'json_object' },
        },
        {
          headers: {
            Authorization: `Bearer ${this.configService.get<string>('OPENAI_API_KEY')}`,
          },
        },
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const content = response.data.choices[0].message.content as string;
      const parsed = JSON.parse(content) as TailoredResume;

      // Validate structure
      if (
        !parsed.name ||
        !Array.isArray(parsed.sections) ||
        !Array.isArray(parsed.skills) ||
        !parsed.changes
      ) {
        throw new Error('Invalid tailored resume structure from AI');
      }

      this.logger.log('Tailored resume generated successfully:', parsed);

      return parsed;
    } catch (error) {
      this.logger.error('Failed to synthesize tailored resume:', error);
      throw new Error(
        `Failed to synthesize tailored resume: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
