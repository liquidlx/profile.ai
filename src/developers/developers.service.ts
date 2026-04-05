import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateDeveloperDto, UpdateDeveloperDto } from './dto';
import { DeveloperProfile } from 'generated/prisma';
import { PrismaService } from '../prisma';

@Injectable()
export class DevelopersService {
  private readonly logger = new Logger(DevelopersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(
    createDeveloperDto: CreateDeveloperDto,
  ): Promise<DeveloperProfile> {
    try {
      const developer = await this.prisma.developerProfile.create({
        data: {
          ...createDeveloperDto,
          userId: undefined,
          user: {
            connect: {
              id: createDeveloperDto.userId,
            },
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
        },
      });

      this.logger.log(`Created developer profile: ${developer.id}`);
      return developer;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException('Could not create a developer');
    }
  }

  async findAll(): Promise<DeveloperProfile[]> {
    const developers = await this.prisma.developerProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            recruiterQuestions: true,
            resumeChunks: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return developers;
  }

  async findOne(id: string): Promise<DeveloperProfile> {
    const developer = await this.prisma.developerProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        recruiterQuestions: {
          include: {
            recruiterProfile: {
              select: {
                id: true,
                company: true,
                position: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            recruiterQuestions: true,
            resumeChunks: true,
          },
        },
      },
    });

    if (!developer) {
      throw new NotFoundException(`Developer with ID ${id} not found`);
    }

    return developer;
  }

  async findBySlug(slug: string): Promise<DeveloperProfile> {
    const developer = await this.prisma.developerProfile.findUnique({
      where: { slug },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        recruiterQuestions: {
          include: {
            recruiterProfile: {
              select: {
                id: true,
                company: true,
                position: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            recruiterQuestions: true,
            resumeChunks: true,
          },
        },
      },
    });

    if (!developer) {
      throw new NotFoundException(`Developer with slug ${slug} not found`);
    }

    return developer;
  }

  async update(
    userId: string,
    updateDeveloperDto: UpdateDeveloperDto,
  ): Promise<DeveloperProfile> {
    try {
      const developer = await this.prisma.developerProfile.update({
        where: { userId },
        data: updateDeveloperDto,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
        },
      });

      this.logger.log(`Updated developer profile: ${userId}`);
      return developer;
    } catch (error) {
      if ('code' in error) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (error.code === 'P2025') {
          throw new NotFoundException(
            `Developer with UserID ${userId} not found`,
          );
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (error.code === 'P2002') {
          throw new ConflictException('Slug is already taken');
        }
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.developerProfile.delete({
        where: { id },
      });

      this.logger.log(`Deleted developer profile: ${id}`);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if ('code' in error && error.code === 'P2025') {
        throw new NotFoundException(`Developer with ID ${id} not found`);
      }
      throw error;
    }
  }

  async findByUserId(userId: string): Promise<DeveloperProfile> {
    const developer = await this.prisma.developerProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!developer) {
      throw new NotFoundException(
        `Developer profile for user ${userId} not found`,
      );
    }

    return developer;
  }
}
