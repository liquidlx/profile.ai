import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { RedisCacheService } from '../redis/redis.service';
import * as crypto from 'crypto';

@Injectable()
export class EmbeddingService {
  private readonly openai: OpenAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly redisCache: RedisCacheService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('ai.openaiApiKey'),
      maxRetries: this.configService.get<number>('ai.retry.maxRetries') ?? 3,
    });
  }

  async getEmbedding(text: string): Promise<number[]> {
    // Create a hash of the text for caching
    const textHash = crypto.createHash('sha256').update(text).digest('hex');
    const cacheKey = `embedding:${textHash}`;

    // Try to get from cache first
    const cachedEmbedding = await this.redisCache.get(cacheKey);
    if (cachedEmbedding) {
      try {
        const parsed = JSON.parse(cachedEmbedding) as unknown;
        if (
          Array.isArray(parsed) &&
          parsed.every((item) => typeof item === 'number')
        ) {
          return parsed;
        }
      } catch {
        // If parsing fails, continue to generate new embedding
      }
    }

    const model =
      this.configService.get<string>('ai.models.embedding') ??
      'text-embedding-3-small';

    const response = await this.openai.embeddings.create({ input: text, model });
    const embedding = response.data[0].embedding;

    // Cache the embedding for 24 hours (86400 seconds)
    await this.redisCache.set(cacheKey, JSON.stringify(embedding), 86400);

    return embedding;
  }
}
