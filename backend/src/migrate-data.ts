/**
 * Copy data from the local SQLite database into the configured PostgreSQL DB.
 *
 * Usage:
 *   npm run migrate:sqlite-to-postgres --workspace=backend
 *   npm run migrate:sqlite-to-postgres --workspace=backend -- --clear
 *
 * Environment:
 *   POSTGRES_URL or DATABASE_URL - remote PostgreSQL connection string
 *   SQLITE_DB_PATH              - SQLite file path, default: loan_db_safe.sqlite
 */
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { dataSourceOptions } from './data-source';

dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

type ColumnValue = string | number | boolean | Date | null;
type RawRow = Record<string, ColumnValue>;

const repoRoot = path.resolve(__dirname, '../..');
const postgresUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const sqlitePath = resolveSqlitePath(
  process.env.SQLITE_DB_PATH || 'loan_db_safe.sqlite',
);
const clearDestination =
  process.argv.includes('--clear') || process.env.MIGRATE_CLEAR === 'true';
const dryRun =
  process.argv.includes('--dry-run') || process.env.MIGRATE_DRY_RUN === 'true';
const chunkSize = getChunkSize();
const tableOrder = [
  'admin_user',
  'institution',
  'sacco',
  'announcement',
  'content_string',
  'user',
  'institution_criteria',
  'loan_product',
  'financial_profile',
  'loan_application',
  'loan',
  'reminder',
  'notification_log',
  'admin_activity_log',
  'eligibility_checks',
  'otp',
];

const entities = dataSourceOptions.entities as any;

const sqliteSource = new DataSource({
  type: 'sqlite',
  database: sqlitePath,
  entities,
  synchronize: false,
});

const postgresSource = new DataSource({
  type: 'postgres',
  url: postgresUrl,
  ssl: { rejectUnauthorized: false },
  entities,
  synchronize: process.env.TYPEORM_SYNC === 'true',
  extra: {
    max: 3,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 20000,
  },
});

function resolveSqlitePath(inputPath: string): string {
  return path.isAbsolute(inputPath)
    ? inputPath
    : path.resolve(repoRoot, inputPath);
}

function getChunkSize(): number {
  const arg = process.argv.find((value) => value.startsWith('--chunk-size='));
  const rawValue = arg?.split('=')[1] || process.env.MIGRATE_CHUNK_SIZE || '100';
  const parsed = Number(rawValue);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : 100;
}

function validateConfig(): void {
  if (
    !postgresUrl ||
    (!postgresUrl.startsWith('postgres://') &&
      !postgresUrl.startsWith('postgresql://'))
  ) {
    throw new Error(
      'POSTGRES_URL or DATABASE_URL must be set to a postgres:// or postgresql:// URL.',
    );
  }

  if (!fs.existsSync(sqlitePath)) {
    throw new Error(`SQLite database was not found at ${sqlitePath}`);
  }

  if (!entities?.length) {
    throw new Error('No TypeORM entities were found in dataSourceOptions.');
  }
}

function maskDatabaseUrl(url: string): string {
  return url.replace(/:([^:@/]+)@/, ':***@');
}

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`;
}

async function tableExists(source: DataSource, tableName: string): Promise<boolean> {
  const rows = await source.query(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
    [tableName],
  );

  return rows.length > 0;
}

async function getSqliteColumns(tableName: string): Promise<Set<string>> {
  const rows = (await sqliteSource.query(
    `PRAGMA table_info(${quoteIdentifier(tableName)})`,
  )) as Array<{ name: string }>;

  return new Set(rows.map((row) => row.name));
}

function normalizeValue(value: ColumnValue, columnType: unknown): ColumnValue {
  if (value === undefined) return null;

  if (
    (columnType === Boolean || columnType === 'boolean') &&
    (value === 0 || value === 1 || value === '0' || value === '1')
  ) {
    return value === 1 || value === '1';
  }

  if (columnType === Date && value === '') {
    return null;
  }

  return value;
}

function buildUpsertQuery(
  tableName: string,
  columns: string[],
  primaryColumns: string[],
  rowCount: number,
): string {
  const quotedColumns = columns.map(quoteIdentifier).join(', ');
  const values = Array.from({ length: rowCount }, (_, rowIndex) => {
    const placeholders = columns.map((_, columnIndex) => {
      return `$${rowIndex * columns.length + columnIndex + 1}`;
    });

    return `(${placeholders.join(', ')})`;
  }).join(', ');
  const conflictColumns = primaryColumns.map(quoteIdentifier).join(', ');
  const updateColumns = columns.filter((column) => !primaryColumns.includes(column));

  if (updateColumns.length === 0) {
    return `INSERT INTO ${quoteIdentifier(tableName)} (${quotedColumns}) VALUES ${values} ON CONFLICT (${conflictColumns}) DO NOTHING`;
  }

  const updates = updateColumns
    .map((column) => {
      const quotedColumn = quoteIdentifier(column);
      return `${quotedColumn} = EXCLUDED.${quotedColumn}`;
    })
    .join(', ');

  return `INSERT INTO ${quoteIdentifier(tableName)} (${quotedColumns}) VALUES ${values} ON CONFLICT (${conflictColumns}) DO UPDATE SET ${updates}`;
}

async function clearPostgresTables(): Promise<void> {
  const tableNames = getOrderedMetadata()
    .map((metadata) => metadata.tableName)
    .reverse();

  if (dryRun) {
    console.log(`[dry-run] Would truncate ${tableNames.length} PostgreSQL tables.`);
    return;
  }

  for (const tableName of tableNames) {
    await postgresSource.query(
      `TRUNCATE TABLE ${quoteIdentifier(tableName)} RESTART IDENTITY CASCADE`,
    );
  }
}

function getOrderedMetadata() {
  const orderByTable = new Map(
    tableOrder.map((tableName, index) => [tableName, index]),
  );

  return [...sqliteSource.entityMetadatas].sort((left, right) => {
    const leftOrder = orderByTable.get(left.tableName) ?? Number.MAX_SAFE_INTEGER;
    const rightOrder =
      orderByTable.get(right.tableName) ?? Number.MAX_SAFE_INTEGER;

    if (leftOrder !== rightOrder) return leftOrder - rightOrder;
    return left.tableName.localeCompare(right.tableName);
  });
}

async function migrateEntity(metadata: DataSource['entityMetadatas'][number]): Promise<number> {
  const tableName = metadata.tableName;

  if (!(await tableExists(sqliteSource, tableName))) {
    console.log(`${tableName}: skipped, table does not exist in SQLite`);
    return 0;
  }

  const sqliteColumns = await getSqliteColumns(tableName);
  const columns = metadata.columns.filter((column) =>
    sqliteColumns.has(column.databaseName),
  );
  const columnNames = columns.map((column) => column.databaseName);
  const primaryColumns = metadata.primaryColumns.map(
    (column) => column.databaseName,
  );

  if (columns.length === 0 || primaryColumns.length === 0) {
    console.log(`${tableName}: skipped, no migratable columns found`);
    return 0;
  }

  const selectColumns = columnNames.map(quoteIdentifier).join(', ');
  const rows = (await sqliteSource.query(
    `SELECT ${selectColumns} FROM ${quoteIdentifier(tableName)}`,
  )) as RawRow[];

  if (rows.length === 0) {
    console.log(`${tableName}: 0 rows`);
    return 0;
  }

  if (dryRun) {
    console.log(`[dry-run] ${tableName}: would migrate ${rows.length} rows`);
    return rows.length;
  }

  for (let index = 0; index < rows.length; index += chunkSize) {
    const chunk = rows.slice(index, index + chunkSize);
    const params = chunk.flatMap((row) =>
      columns.map((column) =>
        normalizeValue(row[column.databaseName], column.type),
      ),
    );

    await postgresSource.query(
      buildUpsertQuery(tableName, columnNames, primaryColumns, chunk.length),
      params,
    );
  }

  await resetSequence(tableName, primaryColumns[0]);
  console.log(`${tableName}: migrated ${rows.length} rows`);

  return rows.length;
}

async function resetSequence(
  tableName: string,
  primaryColumnName: string,
): Promise<void> {
  await postgresSource.query(
    `
      SELECT setval(
        pg_get_serial_sequence($1, $2),
        COALESCE((SELECT MAX(${quoteIdentifier(primaryColumnName)}) FROM ${quoteIdentifier(tableName)}), 0) + 1,
        false
      )
    `,
    [tableName, primaryColumnName],
  );
}

async function run(): Promise<void> {
  validateConfig();

  console.log('Starting SQLite to PostgreSQL migration');
  console.log(`SQLite: ${sqlitePath}`);
  console.log(`PostgreSQL: ${maskDatabaseUrl(postgresUrl as string)}`);
  console.log(`Mode: ${dryRun ? 'dry-run' : 'write'}`);
  console.log(`Clear destination first: ${clearDestination ? 'yes' : 'no'}`);

  await sqliteSource.initialize();
  if (!dryRun) {
    await postgresSource.initialize();
  }

  try {
    if (clearDestination) {
      await clearPostgresTables();
    }

    let totalRows = 0;
    for (const metadata of getOrderedMetadata()) {
      totalRows += await migrateEntity(metadata);
    }

    console.log(`Done. ${totalRows} total rows processed.`);
  } finally {
    if (sqliteSource.isInitialized) await sqliteSource.destroy();
    if (postgresSource.isInitialized) await postgresSource.destroy();
  }
}

run().catch((error: Error) => {
  console.error(`Migration failed: ${error.message}`);
  process.exit(1);
});
