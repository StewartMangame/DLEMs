import {
  Controller,
  Post,
  Res,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';

@Controller('admin-panel/auth')
export class AdminPanelAuthController {
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
