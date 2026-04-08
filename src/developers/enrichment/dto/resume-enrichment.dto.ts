import { IsString } from 'class-validator';

export class ResumeEnrichmentDto {
  @IsString()
  developerAnswer: string;
}
