// TODO: Implement Google OAuth strategy
// This file is a placeholder for future OAuth implementation
// When ready to implement OAuth, uncomment and configure the strategy below

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { PrismaClient, UserRole } from 'generated/prisma';
import { ConfigService } from '@nestjs/config';

interface GoogleProfile {
  id: string;
  displayName: string;
  name: {
    givenName: string;
    familyName: string;
  };
  emails: Array<{ value: string; verified: boolean }>;
  photos: Array<{ value: string }>;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly configService: ConfigService,
  ) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL =
      configService.get<string>('GOOGLE_CALLBACK_URL') ||
      'http://localhost:3003/auth/google/callback';

    // Initialize with placeholder values if environment variables are not set
    super({
      clientID: clientID || 'placeholder',
      clientSecret: clientSecret || 'placeholder',
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: GoogleProfile,
    done: VerifyCallback,
  ): Promise<void> {
    // Check if Google OAuth is properly configured
    if (
      !this.configService.get<string>('GOOGLE_CLIENT_ID') ||
      !this.configService.get<string>('GOOGLE_CLIENT_SECRET')
    ) {
      return done(
        new Error(
          'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.',
        ),
        undefined,
      );
    }

    try {
      const { emails, photos } = profile;
      const email = emails[0]?.value;
      const picture = photos[0]?.value;

      if (!email) {
        return done(new Error('Email not found in Google profile'), undefined);
      }

      // Check if user exists
      let user = await this.prisma.user.findUnique({
        where: { email },
        include: {
          developerProfile: {
            select: {
              id: true,
              slug: true,
              name: true,
            },
          },
          recruiterProfile: {
            select: {
              id: true,
              company: true,
              position: true,
            },
          },
        },
      });

      if (!user) {
        // Create new user with Google OAuth data
        user = await this.prisma.user.create({
          data: {
            email,
            password: '', // OAuth users don't need password
            role: UserRole.DEVELOPER, // Default role, can be changed later
            profilePic: picture,
          },
          include: {
            developerProfile: {
              select: {
                id: true,
                slug: true,
                name: true,
              },
            },
            recruiterProfile: {
              select: {
                id: true,
                company: true,
                position: true,
              },
            },
          },
        });
      }

      const userWithoutPassword = {
        id: user.id,
        email: user.email,
        role: user.role,
        profilePic: user.profilePic,
        developerProfile: user.developerProfile,
        recruiterProfile: user.recruiterProfile,
      };

      done(null, userWithoutPassword);
    } catch (error) {
      done(error, undefined);
    }
  }
}
