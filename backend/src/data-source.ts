import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from './entities/user.entity';
import { Institution } from './entities/institution.entity';
import { InstitutionCriteria } from './entities/institution-criteria.entity';
import { FinancialProfile } from './entities/financial-profile.entity';
import { Loan } from './entities/loan.entity';
import { LoanApplication } from './entities/loan-application.entity';
import { Reminder } from './entities/reminder.entity';
import { NotificationLog } from './entities/notification-log.entity';
import { AdminUser } from './entities/admin-user.entity';
import { AdminActivityLog } from './entities/admin-activity-log.entity';
import { Sacco } from './entities/sacco.entity';
import { LoanProduct } from './entities/loan-product.entity';
import { ContentString } from './entities/content-string.entity';
import { Announcement } from './entities/announcement.entity';
import { EligibilityCheckLog } from './entities/eligibility-check-log.entity';
import { Otp } from './entities/otp.entity';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load the root .env and backend .env for local migrations
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const isProduction = process.env.NODE_ENV === 'production';
const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const isPostgres = !!databaseUrl && (databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://'));

export const dataSourceOptions: DataSourceOptions = isPostgres
  ? {
      type: 'postgres',
      url: databaseUrl,
      ssl: isProduction ? { rejectUnauthorized: false } : false,
      synchronize: false, // Must be false in production, migrations will handle changes
      entities: [
        User,
        Institution,
        InstitutionCriteria,
        FinancialProfile,
        Loan,
        LoanApplication,
        Reminder,
        NotificationLog,
        AdminUser,
        AdminActivityLog,
        Sacco,
        LoanProduct,
        ContentString,
        Announcement,
        EligibilityCheckLog,
        Otp,
      ],
      migrations: [path.join(__dirname, 'migrations/*.{ts,js}')],
      extra: {
        max: 10, // Serverless connection pooling limit
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      },
    }
  : {
      type: 'sqlite',
      database: process.env.SQLITE_DB_PATH || 'loan_db.sqlite',
      synchronize: process.env.TYPEORM_SYNC === 'true',
      entities: [
        User,
        Institution,
        InstitutionCriteria,
        FinancialProfile,
        Loan,
        LoanApplication,
        Reminder,
        NotificationLog,
        AdminUser,
        AdminActivityLog,
        Sacco,
        LoanProduct,
        ContentString,
        Announcement,
        EligibilityCheckLog,
        Otp,
      ],
      migrations: [path.join(__dirname, 'migrations/*.{ts,js}')],
    };

// Singleton instance for serverless environments
let connection: DataSource | null = null;

export const getDataSource = async (): Promise<DataSource> => {
  if (!connection) {
    connection = new DataSource(dataSourceOptions);
    await connection.initialize();
  } else if (!connection.isInitialized) {
    await connection.initialize();
  }
  return connection;
};

export const AppDataSource = new DataSource(dataSourceOptions);
