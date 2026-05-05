import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AdminPanelAuthService } from './admin-panel-auth.service';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(
    config: ConfigService,
    private adminAuthService: AdminPanelAuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: any) => {
          const cookie = req?.cookies?.['admin_jwt'];
          return cookie ?? null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('ADMIN_JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    if (payload.type !== 'admin') {
      throw new UnauthorizedException();
    }
    const admin = await this.adminAuthService.validateById(payload.sub);
    if (!admin) {
      throw new UnauthorizedException();
    }
    return { adminId: admin.id, role: admin.role, email: admin.email };
  }
}
