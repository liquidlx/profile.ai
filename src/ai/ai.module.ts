import { Module } from '@nestjs/common';
import { EmbeddingService } from './embedding.service';
import { ChunkerService } from './chunker.service';
import { LlmService } from './llm.service';
import { RedisModule } from '../redis';

@Module({
  imports: [RedisModule],
  providers: [EmbeddingService, ChunkerService, LlmService],
  exports: [EmbeddingService, ChunkerService, LlmService],
})
export class AiModule {}
