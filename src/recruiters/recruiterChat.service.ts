import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient, ResumeChunk } from '../../generated/prisma';
import { EmbeddingService } from '../ai/embedding.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class RecruiterChatService {
  private readonly logger = new Logger(RecruiterChatService.name);
  private readonly openAiChatUrl = 'https://api.openai.com/v1/chat/completions';
  private readonly model = 'gpt-3.5-turbo';

  constructor(
    private readonly prisma: PrismaClient,
    private readonly embeddingService: EmbeddingService,
    private readonly configService: ConfigService,
  ) {}

  async answerRecruiterQuestion(
    developerId: string,
    recruiterId: string,
    question: string,
  ): Promise<string> {
    // Step 1: Embed recruiter question
    const questionEmbedding =
      await this.embeddingService.getEmbedding(question);

    // Step 2: Retrieve top relevant chunks
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

Summary:
${developer.summary}

Key Skills:
${developer.keySkills}

Relevant Experience:
${contextChunks}

Recruiter Question:
${question}
`;

    // Step 4: Call OpenAI chat completion
    const response = await axios.post(
      this.openAiChatUrl,
      {
        model: this.model,
        messages: [{ role: 'system', content: systemPrompt }],
        temperature: 0,
        max_tokens: 300,
      },
      {
        headers: {
          Authorization: `Bearer ${this.configService.get<string>('OPENAI_API_KEY')}`,
        },
      },
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const answer = response.data.choices[0].message.content as string;

    // // Save recruiter question to DB for analytics
    // await this.prisma.`
    //     recruiterId,
    //     developerId,
    //     question,
    //     answer,
    //   },
    // });

    return answer;
  }
}
