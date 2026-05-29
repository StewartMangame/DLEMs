const fs = require('fs');
const os = require('os');
const path = require('path');
const sqlite3 = require('sqlite3');

require('ts-node').register({
  project: path.resolve(__dirname, '../tsconfig.json'),
});
require('tsconfig-paths/register');

const { DataSource } = require('typeorm');
const { dataSourceOptions } = require('../src/data-source');

const sourcePath = path.resolve(__dirname, '../database_export.sql');
const outputPath = path.resolve(__dirname, '../database_export.postgres.sql');
const tempSqlitePath = path.join(os.tmpdir(), `database_export_${Date.now()}.sqlite`);

const tableOrder = [
  'admin_user',
  'institution',
  'sacco',
  'announcement',
  'content_string',
  'user',
  'institution_criteria',
  'loan_application',
  'loan',
  'loan_product',
  'financial_profile',
  'reminder',
  'notification_log',
  'admin_activity_log',
  'eligibility_checks',
  'otp',
];

function quoteIdentifier(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function sqlLiteral(value, column) {
  if (value === null || value === undefined) return 'NULL';

  if (column.type === Boolean || column.type === 'boolean') {
    return value === 1 || value === true || value === '1' ? 'true' : 'false';
  }

  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL';

  return `'${String(value).replace(/'/g, "''")}'`;
}

function readTextFile(filePath) {
  const buffer = fs.readFileSync(filePath);
  const hasUtf16LeBom = buffer[0] === 0xff && buffer[1] === 0xfe;
  const hasUtf16BeBom = buffer[0] === 0xfe && buffer[1] === 0xff;
  const hasManyNullBytes = buffer.subarray(0, 200).some((byte, index) => index % 2 === 1 && byte === 0);

  if (hasUtf16LeBom || hasManyNullBytes) {
    return buffer.toString('utf16le').replace(/^\uFEFF/, '');
  }

  if (hasUtf16BeBom) {
    throw new Error('UTF-16BE database exports are not supported by this converter.');
  }

  return buffer.toString('utf8').replace(/^\uFEFF/, '');
}

function runSqliteExec(db, sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (error) => (error ? reject(error) : resolve()));
  });
}

function splitSqlStatements(sql) {
  const statements = [];
  let current = '';
  let inString = false;

  for (let index = 0; index < sql.length; index += 1) {
    const char = sql[index];
    const next = sql[index + 1];

    current += char;

    if (char === "'") {
      if (inString && next === "'") {
        current += next;
        index += 1;
      } else {
        inString = !inString;
      }
    }

    if (char === ';' && !inString) {
      const statement = current.trim();
      if (statement) statements.push(statement);
      current = '';
    }
  }

  const trailing = current.trim();
  if (trailing) statements.push(trailing);

  return statements;
}

async function loadDumpIntoSqlite(db, sqliteDump) {
  for (const statement of splitSqlStatements(sqliteDump)) {
    try {
      await runSqliteExec(db, statement);
    } catch (error) {
      error.message = `${error.message}\nFailed statement:\n${statement.slice(0, 1000)}`;
      throw error;
    }
  }
}

async function sqliteTableExists(source, tableName) {
  const rows = await source.query(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
    [tableName],
  );

  return rows.length > 0;
}

function orderedMetadata(source) {
  const order = new Map(tableOrder.map((tableName, index) => [tableName, index]));

  return [...source.entityMetadatas].sort((left, right) => {
    const leftOrder = order.get(left.tableName) ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = order.get(right.tableName) ?? Number.MAX_SAFE_INTEGER;

    if (leftOrder !== rightOrder) return leftOrder - rightOrder;
    return left.tableName.localeCompare(right.tableName);
  });
}

async function main() {
  const sqliteDump = readTextFile(sourcePath);
  const db = new sqlite3.Database(tempSqlitePath);

  try {
    await loadDumpIntoSqlite(db, sqliteDump);
  } finally {
    db.close();
  }

  const source = new DataSource({
    type: 'sqlite',
    database: tempSqlitePath,
    entities: dataSourceOptions.entities,
    synchronize: false,
  });

  await source.initialize();

  try {
    const metadataList = orderedMetadata(source);
    const tableNames = metadataList.map((metadata) => metadata.tableName);
    const lines = [
      '-- Converted from backend/database_export.sql for PostgreSQL.',
      '-- This import replaces data in the listed app tables.',
      'BEGIN;',
      `TRUNCATE TABLE ${tableNames.map(quoteIdentifier).join(', ')} RESTART IDENTITY CASCADE;`,
      '',
    ];
    const importedCounts = {};

    for (const metadata of metadataList) {
      const tableName = metadata.tableName;
      if (!(await sqliteTableExists(source, tableName))) {
        importedCounts[tableName] = 0;
        continue;
      }

      const columns = metadata.columns;
      const columnNames = columns.map((column) => column.databaseName);
      const rows = await source.query(
        `SELECT ${columnNames.map(quoteIdentifier).join(', ')} FROM ${quoteIdentifier(tableName)}`,
      );

      importedCounts[tableName] = rows.length;

      if (rows.length === 0) continue;

      lines.push(`-- ${tableName}: ${rows.length} rows`);
      for (const row of rows) {
        const values = columns.map((column) => sqlLiteral(row[column.databaseName], column));
        lines.push(
          `INSERT INTO ${quoteIdentifier(tableName)} (${columnNames
            .map(quoteIdentifier)
            .join(', ')}) VALUES (${values.join(', ')});`,
        );
      }
      lines.push('');
    }

    for (const metadata of metadataList) {
      const primaryColumn = metadata.primaryColumns[0];
      if (!primaryColumn) continue;

      lines.push(
        `SELECT setval(pg_get_serial_sequence('${metadata.tableName}', '${primaryColumn.databaseName}'), COALESCE((SELECT MAX(${quoteIdentifier(primaryColumn.databaseName)}) FROM ${quoteIdentifier(metadata.tableName)}), 0) + 1, false);`,
      );
    }

    lines.push('COMMIT;', '');
    fs.writeFileSync(outputPath, lines.join('\n'), 'utf8');

    console.log(`Wrote ${outputPath}`);
    console.log(JSON.stringify(importedCounts, null, 2));
  } finally {
    await source.destroy();
    fs.rmSync(tempSqlitePath, { force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
