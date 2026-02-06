import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma';
import { JobDescriptionService } from './job-description.service';
import { ResumeSynthesisService } from './resume-synthesis.service';
import { PdfGeneratorService } from './pdf-generator.service';

@Injectable()
export class ResumeService {
  private readonly logger = new Logger(ResumeService.name);

  constructor(
    private readonly prisma: PrismaClient,
    private readonly jobDescriptionService: JobDescriptionService,
    private readonly resumeSynthesisService: ResumeSynthesisService,
    private readonly pdfGeneratorService: PdfGeneratorService,
  ) {}

  async getDeveloperByUserId(userId: string) {
    return this.prisma.developerProfile.findUnique({
      where: { userId },
    });
  }

  async generateTailoredResumePDF(
    developerId: string,
    jobDescription: string,
  ): Promise<{ pdfBuffer: Buffer; jobTitle: string | null; name: string }> {
    // Step 1: Analyze job description and extract job title
    this.logger.log(`Analyzing job description for developer ${developerId}`);
    const jobRequirements =
      await this.jobDescriptionService.analyzeJobDescription(jobDescription);
    const jobTitle =
      await this.jobDescriptionService.extractJobTitle(jobDescription);

    // Step 2: Synthesize tailored resume
    this.logger.log(
      `Synthesizing tailored resume for developer ${developerId}`,
    );
    const tailoredResume =
      await this.resumeSynthesisService.synthesizeTailoredResume(
        developerId,
        jobRequirements,
      );

    // Step 3: Generate PDF with job title for metadata
    this.logger.log(`Generating PDF for developer ${developerId}`);
    const pdfBuffer = await this.pdfGeneratorService.generateResumePDF(
      tailoredResume,
      jobTitle || undefined,
    );

    return {
      pdfBuffer,
      jobTitle,
      name: tailoredResume.name,
    };
  }
}
