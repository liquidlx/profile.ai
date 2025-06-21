// Example usage of guards and decorators in controllers

import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { GoogleAuthGuard } from '../guards/google-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from 'generated/prisma';

@Controller('example')
export class ExampleController {
  // Protected route with JWT authentication only
  @Get('jwt-only')
  @UseGuards(JwtAuthGuard)
  jwtOnlyRoute() {
    return { message: 'This route requires JWT authentication' };
  }

  // Protected route with Google OAuth only
  @Get('google-only')
  @UseGuards(GoogleAuthGuard)
  googleOnlyRoute() {
    return { message: 'This route requires Google OAuth' };
  }

  // Protected route with role-based access (Developer only)
  @Get('developer-only')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DEVELOPER)
  developerOnlyRoute() {
    return { message: 'This route is for developers only' };
  }

  // Protected route with role-based access (Recruiter only)
  @Get('recruiter-only')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECRUITER)
  recruiterOnlyRoute() {
    return { message: 'This route is for recruiters only' };
  }

  // Protected route with multiple roles allowed
  @Get('both-roles')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DEVELOPER, UserRole.RECRUITER)
  bothRolesRoute() {
    return { message: 'This route is for both developers and recruiters' };
  }

  // Public route (no authentication required)
  @Get('public')
  publicRoute() {
    return { message: 'This route is public' };
  }
}

/*
Usage Examples:

1. JWT Authentication:
   GET /example/jwt-only
   Authorization: Bearer <jwt-token>

2. Google OAuth:
   GET /auth/google (initiates OAuth flow)
   GET /auth/google/callback (handles OAuth callback)

3. Role-based Access:
   GET /example/developer-only (requires JWT + DEVELOPER role)
   GET /example/recruiter-only (requires JWT + RECRUITER role)
   GET /example/both-roles (requires JWT + either role)

4. Environment Variables Needed:
   JWT_SECRET=your-secret-key
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_CALLBACK_URL=http://localhost:3003/auth/google/callback
   FRONTEND_URL=http://localhost:3000
*/
