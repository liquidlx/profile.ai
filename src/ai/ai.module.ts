import { Module } from '@nestjs/common';
import { EmbeddingService } from './embedding.service';
import { ChunkerService } from './chunker.service';
import { RedisModule } from '../redis';

@Module({
  imports: [RedisModule],
  providers: [EmbeddingService, ChunkerService],
  exports: [EmbeddingService, ChunkerService],
})
export class AiModule {}
