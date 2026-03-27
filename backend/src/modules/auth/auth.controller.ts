import { Body, Controller, Get, Headers, Post, UnauthorizedException } from '@nestjs/common';
import {
  GoogleVerifyTokenDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
} from '../../dtos';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto);
  }

  @Post('google/verify-token')
  async verifyGoogleToken(@Body() dto: GoogleVerifyTokenDto) {
    return this.authService.verifyGoogleToken(dto);
  }

  @Get('me')
  async me(@Headers('authorization') authorization?: string) {
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = authorization.slice('Bearer '.length);
    const payload = await this.authService.verifyAccessToken(token);
    return this.authService.getMe(payload.sub);
  }
}
