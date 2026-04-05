import { Module } from '@nestjs/common';
import { DevelopersService } from './developers.service';
import { DevelopersController } from './developers.controller';
import { ResumeUploaderService } from './uploader/resumeUploader.service';
import { PdfCleanerService } from './uploader/pdfCleaner.service';
import { AiModule } from '../ai';
import { RedisModule } from '../redis';

@Module({
  imports: [AiModule, RedisModule],
  controllers: [DevelopersController],
  providers: [
    DevelopersService,
    ResumeUploaderService,
    PdfCleanerService,
  ],
  exports: [DevelopersService, ResumeUploaderService],
})
export class DevelopersModule {}
