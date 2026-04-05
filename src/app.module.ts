import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './app.controller';
import { DevelopersModule } from './developers';
import { RecruitersModule } from './recruiters';
import { AiModule } from './ai';
import { AuthModule } from './auth';
import { RedisModule } from './redis';
import { ResumeModule } from './resume';
import { PrismaModule } from './prisma';
import { aiConfig } from './ai/ai.config';

@Module({
  imports: [
    DevelopersModule,
    RecruitersModule,
    AiModule,
    AuthModule,
    RedisModule,
    ResumeModule,
    PrismaModule,
    ConfigModule.forRoot({ envFilePath: '.env', isGlobal: true, load: [aiConfig] }),
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
