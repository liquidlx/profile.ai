import { Module } from '@nestjs/common';
import { EmbeddingService } from './embedding.service';
import { ChunkerService } from './chunker.service';
import { LlmService } from './llm.service';
import { FactExtractionService } from './fact-extraction.service';
import { RedisModule } from '../redis';

@Module({
  imports: [RedisModule],
  providers: [EmbeddingService, ChunkerService, LlmService, FactExtractionService],
  exports: [EmbeddingService, ChunkerService, LlmService, FactExtractionService],
})
export class AiModule {}
