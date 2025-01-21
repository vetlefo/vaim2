import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Headers, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ValidatedUser } from './interfaces/validated-user.interface';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
  ): Promise<{ access_token: string; user: ValidatedUser }> {
    return this.authService.login(loginDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(@Headers('authorization') auth: string): Promise<void> {
    if (!auth || !auth.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid token format');
    }
    const token = auth.split(' ')[1];
    await this.authService.logout(token);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<{ access_token: string; refresh_token: string }> {
    return this.authService.refresh(refreshTokenDto);
  }
  // @Post('logout')
  // @HttpCode(HttpStatus.OK)
  // @UseGuards(JwtAuthGuard)
  // async logout(@Request() req) {
  //   return this.authService.logout(req.user);
  // }

  // TODO: Implement token refresh endpoint
  // @Post('refresh')
  // @HttpCode(HttpStatus.OK)
  // async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
  //   return this.authService.refresh(refreshTokenDto);
  // }
}