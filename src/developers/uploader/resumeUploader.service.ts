import { Injectable, Logger } from '@nestjs/common';
import * as pdfParse from 'pdf-parse';
import { PrismaClient } from 'generated/prisma';
import { ChunkerService } from '../../ai/chunker.service';
import { EmbeddingService } from '../../ai/embedding.service';
import { RedisCacheService } from '../../redis/redis.service';
import { PdfCleanerService } from './pdfCleaner.service';
import { randomUUID } from 'crypto';

@Injectable()
export class ResumeUploaderService {
  private readonly logger = new Logger(ResumeUploaderService.name);

  constructor(
    private readonly prisma: PrismaClient,
    private readonly chunker: ChunkerService,
    private readonly embeddingService: EmbeddingService,
    private readonly redisCache: RedisCacheService,
    private readonly pdfCleaner: PdfCleanerService,
  ) {}

  async processResume(
    userId: string,
    developerId: string,
    file: { buffer: Buffer },
  ) {
    const developer = await this.prisma.developerProfile.findUnique({
      where: {
        id: developerId,
      },
    });

    if (!developer) {
      throw new Error('Developer profile not found');
    }

    if (developer.userId !== userId) {
      throw new Error('You can only upload resumes to your own profile');
    }

    if (!file || !file.buffer) {
      throw new Error('Invalid file upload');
    }

    const parsedPdf = await pdfParse(file.buffer);
    const rawText = parsedPdf.text;

    if (!rawText || rawText.trim().length === 0) {
      throw new Error('No text content found in the PDF');
    }

    // Clean the text to remove sensitive information
    const cleanedText = this.pdfCleaner.cleanTextContent(rawText);

    // Log cleaning statistics
    const cleaningStats = this.pdfCleaner.getCleaningStats(
      rawText,
      cleanedText,
    );
    this.logger.log(`PDF cleaning stats: ${JSON.stringify(cleaningStats)}`);

    const chunks = this.chunker.chunkText(cleanedText);

    // Filter out empty chunks
    const validChunks = chunks.filter(
      (chunk) => chunk && chunk.trim().length > 0,
    );

    if (validChunks.length === 0) {
      throw new Error('No valid text chunks found after processing');
    }

    // Clear existing chunks for this developer
    await this.prisma.resumeChunk.deleteMany({
      where: { developerId },
    });

    // Store original cleaned text for resume reconstruction
    await this.prisma.developerProfile.update({
      where: { id: developerId },
      data: { originalResumeText: cleanedText },
    });

    let chunksCreated = 0;
    for (const chunkText of validChunks) {
      try {
        const embedding = await this.embeddingService.getEmbedding(chunkText);

        const id = randomUUID();

        await this.prisma.$executeRaw`
          INSERT INTO "ResumeChunk" ("id", "developerId", "chunkText", "embedding")
          VALUES (${id}, ${developerId}, ${chunkText.trim()}, ${embedding})
        `;

        chunksCreated++;
      } catch (error) {
        this.logger.error(
          `Failed to process chunk ${chunksCreated + 1}:`,
          error,
        );
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to process resume chunk: ${errorMessage}`);
      }
    }

    // TODO: Generate summary & skills extraction here (simplified for now)
    // await this.prisma.developerProfile.update({
    //   where: { id: developerId },
    //   data: {
    //     summary: 'Summary',
    //     keySkills: 'Skills',
    //   },
    // });

    this.logger.log(
      `Resume processing complete for developer ${developerId}. Created ${chunksCreated} chunks.`,
    );
    return { chunksCreated, cleaningStats };
  }
}
