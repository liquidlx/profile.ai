import { IsString, IsOptional } from 'class-validator';

export class StartEnrichmentDto {
  @IsString()
  @IsOptional()
  topic?: string;
}
