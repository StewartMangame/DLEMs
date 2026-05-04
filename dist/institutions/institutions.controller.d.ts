import { InstitutionsService } from './institutions.service';
export declare class InstitutionsController {
    private readonly instService;
    constructor(instService: InstitutionsService);
    getInstitutions(): Promise<{
        institutions: import("../entities/institution.entity").Institution[];
    }>;
}
