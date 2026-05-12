import { OnModuleInit } from '@nestjs/common';
import { InstitutionsService } from './user/institutions/institutions.service';
export declare class AppModule implements OnModuleInit {
    private readonly instService;
    constructor(instService: InstitutionsService);
    onModuleInit(): Promise<void>;
}
