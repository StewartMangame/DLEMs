/**
 * migrate-data.ts
 * ---------------
 * One-shot script that copies all data from a local SQLite database into a
 * remote PostgreSQL database (Neon / Aiven / any standard Postgres).
 *
 * Usage:
 *   npx ts-node src/migrate-data.ts
 *
 * Required env vars (in backend/.env):
 *   POSTGRES_URL=postgres://user:pass@host:port/dbname
 *   SQLITE_DB_PATH=loan_db_safe.sqlite   (default: loan_db.sqlite)
 */
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// ── Load env files ────────────────────────────────────────────────────────────
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

import { dataSourceOptions } from './data-source';

// ── Validate ──────────────────────────────────────────────────────────────────
const POSTGRES_URL = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const SQLITE_PATH  = process.env.SQLITE_DB_PATH || 'loan_db_safe.sqlite';

if (
  !POSTGRES_URL ||
  (!POSTGRES_URL.startsWith('postgres://') &&
    !POSTGRES_URL.startsWith('postgresql://'))
) {
  console.error('❌  POSTGRES_URL is not set or is not a valid postgres:// URL.');
  console.error('    Add it to backend/.env and try again.');
  process.exit(1);
}

// ── Two separate DataSources ──────────────────────────────────────────────────
const sqliteSource = new DataSource({
  type: 'sqlite',
  database: SQLITE_PATH,
  entities: dataSourceOptions.entities,
  synchronize: false,
});

const postgresSource = new DataSource({
  type: 'postgres',
  url: POSTGRES_URL,
  ssl: { rejectUnauthorized: false },
  entities: dataSourceOptions.entities,
  synchronize: true, // create tables if they don't exist yet
  extra: { max: 3, connectionTimeoutMillis: 20000 },
});

// ── Entity order respects FK dependencies ────────────────────────────────────
const ENTITY_ORDER = [
  'AdminUser',
  'User',
  'Sacco',
  'Institution',
  'InstitutionCriteria',
  'LoanProduct',
  'FinancialProfile',
  'Loan',
  'LoanApplication',
  'Reminder',
  'Otp',
  'Announcement',
  'EligibilityCheckLog',
  'AdminActivityLog',
  'NotificationLog',
  'ContentString',
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function transformRecord(record: any, repo: any): any {
  const out: any = { ...record };
  for (const key of Object.keys(out)) {
    const col = repo.metadata.findColumnWithPropertyName(key);
    if (!col) continue;
    const t = col.type;
    // SQLite stores booleans as 0/1
    if ((t === 'boolean' || t === Boolean) && (out[key] === 0 || out[key] === 1)) {
      out[key] = out[key] === 1;
    }
    // SQLite stores dates as strings
    if (
      (t === 'timestamp' || t === 'datetime' || t === Date) &&
      typeof out[key] === 'string' &&
      out[key]
    ) {
      out[key] = new Date(out[key]);
    }
  }
  return out;
}

async function migrateEntity(name: string): Promise<void> {
  const sqliteRepo   = sqliteSource.getRepository(name);
  const postgresRepo = postgresSource.getRepository(name);

  const records = await sqliteRepo.find();
  if (records.length === 0) {
    console.log(`  ↳ ${name}: 0 records — skipping`);
    return;
  }

  const transformed = records.map(r => transformRecord(r, sqliteRepo));

  // Upsert in chunks of 50 to stay within payload limits
  const CHUNK = 50;
  for (let i = 0; i < transformed.length; i += CHUNK) {
    await postgresRepo.save(transformed.slice(i, i + CHUNK));
  }
  console.log(`  ✅  ${name}: ${records.length} records migrated`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🔄  Starting SQLite → PostgreSQL migration\n');

  try {
    console.log(`📂  SQLite: ${SQLITE_PATH}`);
    await sqliteSource.initialize();
    console.log('    connected ✓\n');

    console.log(`🐘  PostgreSQL: ${POSTGRES_URL!.replace(/:([^:@]+)@/, ':***@')}`);
    await postgresSource.initialize();
    console.log('    connected ✓\n');

    for (const name of ENTITY_ORDER) {
      try {
        await migrateEntity(name);
      } catch (err: any) {
        console.error(`  ❌  ${name}: ${err.message}`);
      }
    }

    console.log('\n🎉  Migration complete!\n');
  } catch (err) {
    console.error('\n💥  Migration failed:', err);
    process.exit(1);
  } finally {
    if (sqliteSource.isInitialized)   await sqliteSource.destroy();
    if (postgresSource.isInitialized) await postgresSource.destroy();
  }
}

main();
