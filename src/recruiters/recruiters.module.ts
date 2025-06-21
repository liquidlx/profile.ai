import { Module } from '@nestjs/common';
import { RecruiterChatService } from './recruiterChat.service';
import { PrismaClient } from 'generated/prisma';
import { AiModule } from '../ai';
import { RecruiterChatController } from './recruiterChat.controller';

@Module({
  imports: [AiModule],
  controllers: [RecruiterChatController],
  providers: [RecruiterChatService, PrismaClient],
  exports: [RecruiterChatService],
})
export class RecruitersModule {}
