import { Injectable, Logger } from '@nestjs/common';
import { DeveloperProfile, ResumeChunk } from '../../generated/prisma';
import { PrismaService } from '../prisma';
import { EmbeddingService } from '../ai/embedding.service';
import { LlmService } from '../ai/llm.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RecruiterChatService {
  private readonly logger = new Logger(RecruiterChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingService: EmbeddingService,
    private readonly llmService: LlmService,
    private readonly configService: ConfigService,
  ) {}

  async buildContext(
    developerId: string,
    question: string,
  ): Promise<{ systemPrompt: string; developer: DeveloperProfile }> {
    const questionEmbedding = await this.embeddingService.getEmbedding(question);

    const topChunks: ResumeChunk[] = await this.prisma.$queryRaw`
      SELECT "chunkText" FROM "ResumeChunk"
      WHERE "developerId" = ${developerId}
      ORDER BY embedding <-> ${questionEmbedding}::vector
      LIMIT 3
    `;

    const developer = await this.prisma.developerProfile.findUnique({
      where: { id: developerId },
    });

    if (!developer) {
      throw new Error('Developer not found');
    }

    const contextChunks = topChunks.map((chunk) => chunk.chunkText).join('\n\n');

    const systemPrompt = `
You are an assistant helping recruiters evaluate the developer ${developer.name}.
You can only answer based on the information provided.
If the question is out of scope or missing information, say "I don't have information about that."
Never make up information.
If you need clarification from the recruiter to give a better answer, use the ask_recruiter_confirmation tool.

Summary:
${developer.summary}

Key Skills:
${developer.keySkills}

Relevant Experience:
${contextChunks}

Recruiter Question:
${question}
`;

    return { systemPrompt, developer };
  }

  async answerRecruiterQuestion(
    developerId: string,
    recruiterId: string,
    question: string,
  ): Promise<string> {
    const { systemPrompt } = await this.buildContext(developerId, question);

    const { content } = await this.llmService.chat(
      [{ role: 'system', content: systemPrompt }],
      {
        model: this.configService.get<string>('ai.models.recruiterChat')!,
        temperature: this.configService.get<number>(
          'ai.params.recruiterChat.temperature',
        ),
        maxTokens: this.configService.get<number>(
          'ai.params.recruiterChat.maxTokens',
        ),
      },
    );

    return content ?? '';
  }
}
