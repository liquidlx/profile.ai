import { Module } from '@nestjs/common';
import { RecruiterChatService } from './recruiterChat.service';
import { AgentLoopService } from './agent-loop.service';
import { AiModule } from '../ai';
import { RecruiterChatController } from './recruiterChat.controller';

@Module({
  imports: [AiModule],
  controllers: [RecruiterChatController],
  providers: [RecruiterChatService, AgentLoopService],
  exports: [RecruiterChatService, AgentLoopService],
})
export class RecruitersModule {}
