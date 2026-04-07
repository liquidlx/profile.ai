import { Module } from '@nestjs/common';
import { DevelopersService } from './developers.service';
import { DevelopersController } from './developers.controller';
import { ResumeUploaderService } from './uploader/resumeUploader.service';
import { PdfCleanerService } from './uploader/pdfCleaner.service';
import { DeveloperEnrichmentController } from './enrichment/developer-enrichment.controller';
import { DeveloperEnrichmentLoopService } from './enrichment/developer-enrichment-loop.service';
import { DeveloperEnrichmentService } from './enrichment/developer-enrichment.service';
import { AiModule } from '../ai';
import { RedisModule } from '../redis';

@Module({
  imports: [AiModule, RedisModule],
  controllers: [DevelopersController, DeveloperEnrichmentController],
  providers: [
    DevelopersService,
    ResumeUploaderService,
    PdfCleanerService,
    DeveloperEnrichmentService,
    DeveloperEnrichmentLoopService,
  ],
  exports: [DevelopersService, ResumeUploaderService],
})
export class DevelopersModule {}
