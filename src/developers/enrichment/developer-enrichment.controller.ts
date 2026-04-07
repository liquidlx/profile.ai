import {
  Controller,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DeveloperEnrichmentLoopService } from './developer-enrichment-loop.service';
import { StartEnrichmentDto } from './dto/start-enrichment.dto';
import { ResumeEnrichmentDto } from './dto/resume-enrichment.dto';

@Controller('developers/:developerId/enrichment')
@UseGuards(JwtAuthGuard)
export class DeveloperEnrichmentController {
  constructor(
    private readonly loopService: DeveloperEnrichmentLoopService,
  ) {}

  @Sse('stream')
  stream(
    @Param('developerId') developerId: string,
    @Query() query: StartEnrichmentDto,
  ): Observable<MessageEvent> {
    const [, events$] = this.loopService.startSession(developerId, query.topic);
    return events$.pipe(map((event) => ({ data: event }) as MessageEvent));
  }

  @Post(':sessionId/resume')
  resume(
    @Param('sessionId') sessionId: string,
    @Body() dto: ResumeEnrichmentDto,
  ): { ok: boolean } {
    this.loopService.resumeSession(sessionId, dto.developerAnswer);
    return { ok: true };
  }
}
