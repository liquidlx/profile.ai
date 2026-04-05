import { Module } from '@nestjs/common';
import { ResumeController } from './resume.controller';
import { ResumeService } from './resume.service';
import { JobDescriptionService } from './job-description.service';
import { ResumeSynthesisService } from './resume-synthesis.service';
import { PdfGeneratorService } from './pdf-generator.service';
import { AiModule } from '../ai';
import { RedisModule } from '../redis';

@Module({
  imports: [AiModule, RedisModule],
  controllers: [ResumeController],
  providers: [
    ResumeService,
    JobDescriptionService,
    ResumeSynthesisService,
    PdfGeneratorService,
  ],
  exports: [ResumeService],
})
export class ResumeModule {}
