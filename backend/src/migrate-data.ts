import { DataSource } from 'typeorm';
import { dataSourceOptions } from './data-source';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load both .env files
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const VERCEL_POSTGRES_URL = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const SQLITE_DB_PATH = process.env.SQLITE_DB_PATH || 'loan_db_safe.sqlite';

if (!VERCEL_POSTGRES_URL || (!VERCEL_POSTGRES_URL.startsWith('postgres://') && !VERCEL_POSTGRES_URL.startsWith('postgresql://'))) {
  console.error('❌ Error: POSTGRES_URL is not set or invalid in .env');
  console.error('Please add your Vercel Postgres URL to backend/.env and run this script again.');
  process.exit(1);
}

// 1. Configure SQLite source (Read)
const sqliteSource = new DataSource({
  type: 'sqlite',
  database: SQLITE_DB_PATH,
  entities: dataSourceOptions.entities,
});

// 2. Configure Postgres source (Write)
const postgresSource = new DataSource({
  type: 'postgres',
  url: VERCEL_POSTGRES_URL,
  ssl: { rejectUnauthorized: false }, // Neon requires SSL
  entities: dataSourceOptions.entities,
  synchronize: true, // Auto-create tables in Postgres for the migration
});

async function migrateData() {
  console.log('🔄 Starting Data Migration from SQLite to PostgreSQL...\n');

  try {
    console.log('📦 Initializing SQLite connection...');
    await sqliteSource.initialize();
    console.log('✅ SQLite connected.\n');

    console.log('📦 Initializing PostgreSQL connection...');
    await postgresSource.initialize();
    console.log('✅ PostgreSQL connected.\n');

    const entitiesToMigrate = [
      'AdminUser',
      'User',
      'Sacco',
      'Institution',
      'InstitutionCriteria',
      'LoanProduct',
      'FinancialProfile',
      'Loan',
      'Reminder',
      'Otp',
      'Announcement',
      'EligibilityCheckLog',
      'AdminActivityLog',
      'NotificationLog',
      'ContentString'
    ];

    for (const entityName of entitiesToMigrate) {
      try {
        console.log(`\n▶ Migrating ${entityName}...`);
        
        const sqliteRepo = sqliteSource.getRepository(entityName);
        const postgresRepo = postgresSource.getRepository(entityName);
        
        const allRecords = await sqliteRepo.find();
        
        if (allRecords.length === 0) {
          console.log(`  └ 0 records found. Skipping.`);
          continue;
        }

        console.log(`  └ Found ${allRecords.length} records. Inserting to Postgres...`);
        
        // Transform data (e.g., boolean 1/0 to true/false)
        const transformedRecords = allRecords.map(record => {
          const newRecord: any = { ...record };
          
          for (const key in newRecord) {
            // SQLite booleans are stored as 1/0, convert them to true/false for Postgres
            if (newRecord[key] === 1 || newRecord[key] === 0) {
              const metaType = sqliteRepo.metadata.findColumnWithPropertyName(key)?.type;
              if (metaType === 'boolean' || metaType === Boolean) {
                newRecord[key] = newRecord[key] === 1;
              }
            }
          }
          return newRecord;
        });

        // Insert in batches to prevent payload limits
        const chunkSize = 100;
        for (let i = 0; i < transformedRecords.length; i += chunkSize) {
          const chunk = transformedRecords.slice(i, i + chunkSize);
          await postgresRepo.save(chunk);
        }

        console.log(`  └ ✅ Success: ${allRecords.length} records migrated.`);

      } catch (err: any) {
        console.error(`  └ ❌ Error migrating ${entityName}:`, err.message);
      }
    }

    console.log('\n🎉 Data Migration Completed Successfully!');

  } catch (error) {
    console.error('\n❌ Migration Failed:', error);
  } finally {
    if (sqliteSource.isInitialized) await sqliteSource.destroy();
    if (postgresSource.isInitialized) await postgresSource.destroy();
  }
}

migrateData();
