import {
  Controller,
  Post,
  Body,
  Res,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminPanelAuthService } from './admin-panel-auth.service';
import type { Response } from 'express';

@Controller('admin-panel/auth')
export class AdminPanelAuthController {
  constructor(private readonly authService: AdminPanelAuthService) {}

  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(body.email, body.password);
    res.cookie('admin_jwt', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 8 * 3600 * 1000, // 8 hours
    });
    return result;
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('admin_jwt', { path: '/' });
    return { success: true };
  }

  @UseGuards(AuthGuard('admin-jwt'))
  @Get('me')
  async me(@Req() req: any) {
    return { admin: req.user };
  }
}
