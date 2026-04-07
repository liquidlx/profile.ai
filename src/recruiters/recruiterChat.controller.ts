import {
  Controller,
  Post,
  Body,
  Param,
  Query,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RecruiterChatService } from './recruiterChat.service';
import { AgentLoopService } from './agent-loop.service';
import { AskQuestionDto } from './dto';
import { StreamQueryDto } from './dto/stream-query.dto';
import { ResumeDto } from './dto/resume.dto';

@Controller('recruiter-chat')
export class RecruiterChatController {
  constructor(
    private readonly recruiterChatService: RecruiterChatService,
    private readonly agentLoopService: AgentLoopService,
  ) {}

  // Existing synchronous endpoint — unchanged
  @Post(':developerId/ask')
  async askQuestion(
    @Param('developerId') developerId: string,
    @Body() askQuestionDto: AskQuestionDto,
  ) {
    const answer = await this.recruiterChatService.answerRecruiterQuestion(
      developerId,
      askQuestionDto.recruiterId,
      askQuestionDto.question,
    );

    return { answer };
  }

  // SSE streaming endpoint — opens the agent loop
  @Sse(':developerId/stream')
  stream(
    @Param('developerId') developerId: string,
    @Query() query: StreamQueryDto,
  ): Observable<MessageEvent> {
    const [, events$] = this.agentLoopService.startSession(
      developerId,
      query.recruiterId,
      query.question,
    );

    return events$.pipe(
      map((event) => ({ data: event }) as MessageEvent),
    );
  }

  // Resume endpoint — sends tool result back into the paused loop
  @Post(':sessionId/resume')
  resume(
    @Param('sessionId') sessionId: string,
    @Body() dto: ResumeDto,
  ): { ok: boolean } {
    this.agentLoopService.resumeSession(sessionId, dto.toolResult);
    return { ok: true };
  }
}
