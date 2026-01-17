import { Module } from '@nestjs/common';
import { DevelopersService } from './developers.service';
import { DevelopersController } from './developers.controller';
import { ResumeUploaderService } from './uploader/resumeUploader.service';
import { PdfCleanerService } from './uploader/pdfCleaner.service';
import { AiModule } from '../ai';
import { RedisModule } from '../redis';
import { PrismaClient } from 'generated/prisma';

@Module({
  imports: [AiModule, RedisModule],
  controllers: [DevelopersController],
  providers: [
    DevelopersService,
    ResumeUploaderService,
    PdfCleanerService,
    PrismaClient,
  ],
  exports: [DevelopersService, ResumeUploaderService],
})
export class DevelopersModule {}
