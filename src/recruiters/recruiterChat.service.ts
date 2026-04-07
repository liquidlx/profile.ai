import { Injectable, Logger } from '@nestjs/common';
import { ResumeChunk, DeveloperProfile } from '../../generated/prisma';
import { PrismaService } from '../prisma';
import { EmbeddingService } from '../ai/embedding.service';
import { LlmService } from '../ai/llm.service';
import { ConfigService } from '@nestjs/config';

export interface RetrievedFact {
  id: string;
  factType: string;
  claim: string;
  sourceText: string;
}

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
  ): Promise<{
    systemPrompt: string;
    developer: DeveloperProfile;
    retrievedFacts: RetrievedFact[];
  }> {
    const [questionEmbedding, developer] = await Promise.all([
      this.embeddingService.getEmbedding(question),
      this.prisma.developerProfile.findUnique({ where: { id: developerId } }),
    ]);

    if (!developer) {
      throw new Error('Developer not found');
    }

    const facts: RetrievedFact[] = await this.prisma.$queryRaw`
      SELECT "id", "factType", "claim", "sourceText"
      FROM "DeveloperFact"
      WHERE "developerId" = ${developerId}
      ORDER BY embedding <-> ${questionEmbedding}::vector
      LIMIT 8
    `;

    const factsBlock = facts
      .map(
        (f) =>
          `[FACT-${f.id}] ${f.factType}: "${f.claim}" (source: "${f.sourceText}")`,
      )
      .join('\n');

    const systemPrompt = `You are an assistant helping recruiters evaluate the developer ${developer.name}.

Summary:
${developer.summary}

Key Skills:
${developer.keySkills}

The following facts are known about this developer (each has an ID you MUST cite):

${factsBlock}

When answering, you MUST only use information from the facts above. Cite the fact IDs you used.`;

    return { systemPrompt, developer, retrievedFacts: facts };
  }

  async answerRecruiterQuestion(
    developerId: string,
    recruiterId: string,
    question: string,
  ): Promise<string> {
    // Step 1: Embed recruiter question
    const questionEmbedding =
      await this.embeddingService.getEmbedding(question);

    // Step 2: Retrieve top relevant chunks (chunk-based, kept for sync endpoint)
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

    const contextChunks = topChunks
      .map((chunk) => chunk.chunkText)
      .join('\n\n');

    // Step 3: Compose system prompt
    const systemPrompt = `
You are an assistant helping recruiters evaluate the developer ${developer.name}.
You can only answer based on the information provided.
If the question is out of scope or missing information, say "I don't have information about that."
Never make up information.

Summary:
${developer.summary}

Key Skills:
${developer.keySkills}

Relevant Experience:
${contextChunks}

Recruiter Question:
${question}
`;

    // Step 4: Call LLM
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
