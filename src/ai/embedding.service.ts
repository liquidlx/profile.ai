import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { OPENAI_URL, OPENAI_MODEL } from './consts';
import { ConfigService } from '@nestjs/config';
import { RedisCacheService } from '../redis/redis.service';
import * as crypto from 'crypto';

@Injectable()
export class EmbeddingService {
  constructor(
    private readonly configService: ConfigService,
    private readonly redisCache: RedisCacheService,
  ) {}

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

    // If not in cache, generate embedding
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    const response = await axios.post(
      OPENAI_URL,
      {
        input: text,
        model: OPENAI_MODEL,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const embedding = response.data?.data?.[0]?.embedding as number[];

    // Cache the embedding for 24 hours (86400 seconds)
    await this.redisCache.set(cacheKey, JSON.stringify(embedding), 86400);

    return embedding;
  }
}
