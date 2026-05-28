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

const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const isPostgres =
  !!databaseUrl &&
  (databaseUrl.startsWith('postgres://') ||
    databaseUrl.startsWith('postgresql://'));

const ALL_ENTITIES = [
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
];

export const dataSourceOptions: DataSourceOptions = isPostgres
  ? {
      type: 'postgres',
      url: databaseUrl,
      // Neon requires SSL. rejectUnauthorized:false accepts Neon's CA without
      // needing to bundle a ca.pem file.
      ssl: { rejectUnauthorized: false },
      synchronize: false, // controlled by app.module at runtime
      entities: ALL_ENTITIES,
      migrations: [path.join(__dirname, 'migrations/*.{ts,js}')],
      extra: {
        // Keep pool small — Neon free tier allows ~5 simultaneous connections.
        max: 3,
        idleTimeoutMillis: 10000,
        connectionTimeoutMillis: 15000,
      },
    }
  : {
      // ── Local SQLite fallback (no POSTGRES_URL set) ──────────────────────
      type: 'sqlite',
      database: process.env.SQLITE_DB_PATH || 'loan_db.sqlite',
      synchronize: process.env.TYPEORM_SYNC === 'true',
      entities: ALL_ENTITIES,
      migrations: [path.join(__dirname, 'migrations/*.{ts,js}')],
    };

// ── Singleton for serverless (reuse across warm invocations) ─────────────────
let _connection: DataSource | null = null;

export const getDataSource = async (): Promise<DataSource> => {
  if (_connection && _connection.isInitialized) return _connection;
  _connection = new DataSource(dataSourceOptions);
  await _connection.initialize();
  return _connection;
};

// Named export used by TypeORM CLI for migrations
export const AppDataSource = new DataSource(dataSourceOptions);
