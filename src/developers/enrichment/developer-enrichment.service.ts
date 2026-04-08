import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma';
import { EmbeddingService } from '../../ai/embedding.service';

export interface FactInput {
  factType: string;
  claim: string;
  sourceText: string;
  company?: string;
  title?: string;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class DeveloperEnrichmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  async storeFact(developerId: string, fact: FactInput): Promise<void> {
    const embedding = await this.embeddingService.getEmbedding(fact.claim);
    const id = randomUUID();
    const embeddingStr = `[${embedding.join(',')}]`;

    await this.prisma.$executeRaw`
      INSERT INTO "DeveloperFact"
        ("id","developerId","factType","claim","sourceText","sourceType",
         "company","title","startDate","endDate","embedding","createdAt","updatedAt")
      VALUES (
        ${id}, ${developerId}, ${fact.factType}::"FactType", ${fact.claim},
        ${fact.sourceText}, 'DEVELOPER_INPUT'::"FactSourceType",
        ${fact.company ?? null}, ${fact.title ?? null},
        ${fact.startDate ? new Date(fact.startDate) : null},
        ${fact.endDate ? new Date(fact.endDate) : null},
        ${embeddingStr}::vector, NOW(), NOW()
      )
    `;
  }

  async getExistingFactsSummary(developerId: string): Promise<string> {
    const facts = await this.prisma.$queryRaw<
      Array<{ factType: string; claim: string; company: string | null; startDate: Date | null; endDate: Date | null }>
    >`
      SELECT "factType", "claim", "company", "startDate", "endDate"
      FROM "DeveloperFact"
      WHERE "developerId" = ${developerId}
      ORDER BY "createdAt" DESC
      LIMIT 20
    `;

    if (!facts.length) return 'None yet.';

    const summaryParts = facts.map((f) => {
      let part = `${f.factType}: ${f.claim}`;
      if (f.company) {
        part += ` at ${f.company}`;
      }
      if (f.startDate) {
        const start = f.startDate.getFullYear();
        const end = f.endDate ? f.endDate.getFullYear() : 'present';
        part += ` (${start}-${end})`;
      }
      return part;
    });

    return `Already known: ${summaryParts.join('; ')}.`;
  }
}
