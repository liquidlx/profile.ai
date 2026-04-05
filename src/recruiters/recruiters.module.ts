import { Module } from '@nestjs/common';
import { RecruiterChatService } from './recruiterChat.service';
import { AiModule } from '../ai';
import { RecruiterChatController } from './recruiterChat.controller';

@Module({
  imports: [AiModule],
  controllers: [RecruiterChatController],
  providers: [RecruiterChatService],
  exports: [RecruiterChatService],
})
export class RecruitersModule {}
