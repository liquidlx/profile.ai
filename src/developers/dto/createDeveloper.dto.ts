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

export const CreateDeveloperDtoSchema = z.object({
  userId: z.string().cuid(),
  slug: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/),
  name: z.string().min(2).max(100),
  bio: z.string().min(10).max(500),
  avatarUrl: z.string().url().optional(),
  cvUrl: z.string().url(),
  allowDownload: z.boolean().default(false),
  summary: z.string().min(20).max(1000),
  keySkills: z.string().min(10).max(500),
});

export class CreateDeveloperDto {
  @IsString()
  userId: string;

  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsString()
  @MinLength(10)
  @MaxLength(500)
  bio: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @IsUrl()
  cvUrl: string;

  @IsBoolean()
  allowDownload: boolean = false;

  @IsString()
  @MinLength(20)
  @MaxLength(1000)
  summary: string;

  @IsString()
  @MinLength(10)
  @MaxLength(500)
  keySkills: string;
}

export type CreateDeveloperDtoType = z.infer<typeof CreateDeveloperDtoSchema>;
