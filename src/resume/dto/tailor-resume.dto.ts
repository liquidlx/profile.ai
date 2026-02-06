import { IsString, IsNotEmpty } from 'class-validator';

export class TailorResumeDto {
  @IsString()
  @IsNotEmpty()
  jobDescription: string;
}
