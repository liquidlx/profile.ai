import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    role: string;
    profilePic?: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return {
      message: 'Login successful',
      ...result,
    };
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    return {
      message: 'Registration successful',
      ...result,
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: RequestWithUser) {
    const profile = await this.authService.getProfile(req.user.id);
    return {
      message: 'Profile retrieved successfully',
      data: profile,
    };
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  async refreshToken(@Request() req: RequestWithUser) {
    const result = await this.authService.refreshToken(req.user.id);
    return {
      message: 'Token refreshed successfully',
      ...result,
    };
  }

  // Google OAuth endpoints
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // This endpoint initiates Google OAuth
    // The guard will redirect to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  googleAuthCallback(@Request() req: RequestWithUser, @Res() res: Response) {
    // Handle Google OAuth callback
    const payload = { email: req.user.email, sub: req.user.id };
    const accessToken = this.jwtService.sign(payload);

    // Redirect to frontend with token
    const redirectUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    res.redirect(`${redirectUrl}/auth/callback?token=${accessToken}`);
  }

  @Get('google/login')
  @UseGuards(GoogleAuthGuard)
  async googleLogin() {
    // Alternative endpoint for Google login
  }

  @Get('google/status')
  googleOAuthStatus() {
    const isConfigured = !!(
      this.configService.get<string>('GOOGLE_CLIENT_ID') &&
      this.configService.get<string>('GOOGLE_CLIENT_SECRET')
    );
    return {
      configured: isConfigured,
      message: isConfigured
        ? 'Google OAuth is configured and ready to use'
        : 'Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.',
    };
  }
}
