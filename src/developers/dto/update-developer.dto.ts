import { z } from 'zod';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsUrl,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export const UpdateDeveloperDtoSchema = z.object({
  slug: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  name: z.string().min(2).max(100).optional(),
  bio: z.string().min(10).max(500).optional(),
  avatarUrl: z.string().url().optional(),
  cvUrl: z.string().url().optional(),
  allowDownload: z.boolean().optional(),
  summary: z.string().min(20).max(1000).optional(),
  keySkills: z.string().min(10).max(500).optional(),
});

export class UpdateDeveloperDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @IsOptional()
  @IsUrl()
  cvUrl?: string;

  @IsOptional()
  @IsBoolean()
  allowDownload?: boolean;

  @IsOptional()
  @IsString()
  @MinLength(20)
  @MaxLength(1000)
  summary?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  keySkills?: string;
}

export type UpdateDeveloperDtoType = z.infer<typeof UpdateDeveloperDtoSchema>;
