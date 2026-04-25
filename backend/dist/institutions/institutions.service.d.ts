import { Repository } from 'typeorm';
import { Institution } from '../entities/institution.entity';
import { InstitutionCriteria } from '../entities/institution-criteria.entity';
export declare class InstitutionsService {
    private instRepo;
    private criteriaRepo;
    constructor(instRepo: Repository<Institution>, criteriaRepo: Repository<InstitutionCriteria>);
    getAllInstitutions(): Promise<Institution[]>;
    findByName(name: string): Promise<Institution>;
    seedDefaultInstitutions(): Promise<void>;
}
