import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DevelopersService } from './developers.service';
import { ResumeUploaderService } from './uploader/resumeUploader.service';
import { CreateDeveloperDto, UpdateDeveloperDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from 'generated/prisma';

interface RequestWithUser extends Request {
  user: {
    id: string;
    profileId: string;
    email: string;
    role: UserRole;
    profilePic?: string;
  };
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DEVELOPER)
@Controller('developers')
export class DevelopersController {
  constructor(
    private readonly developersService: DevelopersService,
    private readonly resumeUploaderService: ResumeUploaderService,
  ) {}

  @Post()
  async create(
    @Body() createDeveloperDto: CreateDeveloperDto,
    @Request() req: RequestWithUser,
  ) {
    const developer = await this.developersService.create({
      ...createDeveloperDto,
      userId: req.user.id,
    });
    return {
      message: 'Developer profile created successfully',
      data: developer,
    };
  }

  @Post(':developerId/upload-resume')
  @UseInterceptors(FileInterceptor('file'))
  async uploadResume(
    @Param('developerId') developerId: string,
    @UploadedFile() file: { buffer: Buffer },
    @Request() req: RequestWithUser,
  ) {
    const result = await this.resumeUploaderService.processResume(
      req.user.id,
      developerId,
      file,
    );

    return {
      message: 'Resume uploaded and processed successfully',
      chunksCreated: result.chunksCreated,
    };
  }

  @Get()
  async findAll() {
    const developers = await this.developersService.findAll();
    return {
      message: 'Developers retrieved successfully',
      data: developers,
      count: developers.length,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const developer = await this.developersService.findOne(id);
    return {
      message: 'Developer retrieved successfully',
      data: developer,
    };
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    const developer = await this.developersService.findBySlug(slug);
    return {
      message: 'Developer retrieved successfully',
      data: developer,
    };
  }

  @Get('user/:userId')
  async findByUserId(@Param('userId') userId: string) {
    const developer = await this.developersService.findByUserId(userId);
    return {
      message: 'Developer profile retrieved successfully',
      data: developer,
    };
  }

  @Get('my/profile')
  async getMyProfile(@Request() req: RequestWithUser) {
    const developer = await this.developersService.findByUserId(req.user.id);
    return {
      message: 'Your developer profile retrieved successfully',
      data: developer,
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDeveloperDto: UpdateDeveloperDto,
    @Request() req: RequestWithUser,
  ) {
    const developer = await this.developersService.update(
      req.user.id,
      updateDeveloperDto,
    );
    return {
      message: 'Developer profile updated successfully',
      data: developer,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.developersService.remove(id);
    return {
      message: 'Developer profile deleted successfully',
    };
  }

  @Delete('my/profile')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMyProfile(@Request() req: RequestWithUser) {
    await this.developersService.remove(req.user.id);
    return {
      message: 'Your developer profile deleted successfully',
    };
  }
}
