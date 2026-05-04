import { OnModuleInit } from '@nestjs/common';
import { InstitutionsService } from './institutions/institutions.service';
import { AuthService } from './auth/auth.service';
export declare class AppModule implements OnModuleInit {
    private readonly instService;
    private readonly authService;
    constructor(instService: InstitutionsService, authService: AuthService);
    onModuleInit(): Promise<void>;
}
