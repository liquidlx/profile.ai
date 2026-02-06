import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './app.controller';
import { DevelopersModule } from './developers';
import { RecruitersModule } from './recruiters';
import { AiModule } from './ai';
import { AuthModule } from './auth';
import { RedisModule } from './redis';
import { ResumeModule } from './resume';

@Module({
  imports: [
    DevelopersModule,
    RecruitersModule,
    AiModule,
    AuthModule,
    RedisModule,
    ResumeModule,
    ConfigModule.forRoot({ envFilePath: '.env', isGlobal: true }),
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
