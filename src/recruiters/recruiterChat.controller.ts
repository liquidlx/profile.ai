import { Controller, Post, Body, Param } from '@nestjs/common';
import { RecruiterChatService } from './recruiterChat.service';

export class AskQuestionDto {
  question: string;
  recruiterId: string;
}

@Controller('recruiter-chat')
export class RecruiterChatController {
  constructor(private readonly recruiterChatService: RecruiterChatService) {}

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
}
