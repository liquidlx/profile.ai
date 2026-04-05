import { registerAs } from '@nestjs/config';

export const aiConfig = registerAs('ai', () => ({
  openaiApiKey: process.env.OPENAI_API_KEY ?? '',

  models: {
    embedding: process.env.AI_MODEL_EMBEDDING ?? 'text-embedding-3-small',
    recruiterChat: process.env.AI_MODEL_RECRUITER_CHAT ?? 'gpt-3.5-turbo',
    jobDescription: process.env.AI_MODEL_JOB_DESCRIPTION ?? 'gpt-3.5-turbo',
    resumeSynthesis: process.env.AI_MODEL_RESUME_SYNTHESIS ?? 'gpt-4o-mini',
  },

  params: {
    recruiterChat: { temperature: 0.1, maxTokens: 300 },
    jobDescription: { temperature: 0, maxTokens: 1024 },
    resumeSynthesis: { temperature: 0.2, maxTokens: 4096 },
  },

  retry: {
    maxRetries: Number(process.env.OPENAI_MAX_RETRIES ?? '3'),
  },
}));
