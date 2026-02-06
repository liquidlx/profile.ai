import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Res,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { ResumeService } from './resume.service';
import { PdfGeneratorService } from './pdf-generator.service';
import { TailorResumeDto } from './dto/tailor-resume.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from 'generated/prisma';

interface RequestWithUser extends Request {
  user: {
    id: string;
    profileId: string;
    email: string;
    role: UserRole;
    profilePic?: string;
  };
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DEVELOPER)
@Controller('resume')
export class ResumeController {
  constructor(
    private readonly resumeService: ResumeService,
    private readonly pdfGeneratorService: PdfGeneratorService,
  ) {}

  @Post('tailor')
  async tailorResume(
    @Body() tailorResumeDto: TailorResumeDto,
    @Request() req: RequestWithUser,
    @Res() res: Response,
  ) {
    try {
      // Get developer profile ID from user
      const developer = await this.resumeService.getDeveloperByUserId(
        req.user.id,
      );

      if (!developer) {
        throw new NotFoundException('Developer profile not found');
      }

      // Generate tailored resume PDF
      const { pdfBuffer, jobTitle, name } =
        await this.resumeService.generateTailoredResumePDF(
          developer.id,
          tailorResumeDto.jobDescription,
        );

      // Generate ATS-friendly filename: FirstName_LastName_JobTitle.pdf
      let filename: string;
      if (jobTitle) {
        const sanitizedName = this.pdfGeneratorService.sanitizeFilename(name);
        const sanitizedJobTitle =
          this.pdfGeneratorService.sanitizeFilename(jobTitle);
        filename = `${sanitizedName}_${sanitizedJobTitle}.pdf`;
      } else {
        // Fallback to Name_Resume.pdf if job title extraction fails
        const sanitizedName = this.pdfGeneratorService.sanitizeFilename(name);
        filename = `${sanitizedName}_Resume.pdf`;
      }

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );
      res.setHeader('Content-Length', pdfBuffer.length.toString());

      // Send PDF
      res.status(HttpStatus.OK).send(pdfBuffer);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw error;
    }
  }
}
