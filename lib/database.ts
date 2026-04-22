import { ParsedColumn, ParsedTable, DatabaseInfo, ColumnType } from '@/types';

// ─── Column type inference ────────────────────────────────────────────────────

const DATE_RE = /^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}([ T]\d{1,2}:\d{2})?/;
const TIME_RE = /^\d{1,2}:\d{2}(:\d{2})?$/;

export function inferColumnType(values: any[]): ColumnType {
  const sample = values
    .filter((v) => v !== null && v !== undefined && v !== '')
    .slice(0, 200)
    .map((v) => String(v).trim());

  if (sample.length === 0) return 'text';

  const boolSet = new Set(['true', 'false', '0', '1', 'yes', 'no', 'ja', 'nee', 'waar', 'onwaar']);
  if (sample.every((v) => boolSet.has(v.toLowerCase()))) return 'boolean';

  const dateMatches = sample.filter((v) => DATE_RE.test(v) || TIME_RE.test(v));
  if (dateMatches.length / sample.length >= 0.8) return 'date';

  const numMatches = sample.filter((v) => !isNaN(Number(v)) && v !== '');
  if (numMatches.length / sample.length >= 0.85) return 'number';

  const unique = new Set(sample);
  if (unique.size <= Math.min(30, sample.length * 0.4)) return 'category';

  return 'text';
}

function buildColumn(
  name: string,
  sqlType: string,
  allValues: any[]
): ParsedColumn {
  const inferredType = inferColumnType(allValues);
  const unique = new Set(allValues.filter((v) => v !== null && v !== undefined && v !== '').map(String));
  const sampleValues = Array.from(unique).slice(0, 6).map(String);
  return {
    name: name.toLowerCase(),
    originalName: name,
    sqlType,
    inferredType,
    nullable: allValues.some((v) => v === null || v === undefined || v === ''),
    uniqueCount: unique.size,
    sampleValues,
  };
}

// ─── SQLite parsing ───────────────────────────────────────────────────────────

export async function parseSQLite(buffer: ArrayBuffer): Promise<ParsedTable[]> {
  const initSqlJs = (await import('sql.js')).default;
  const SQL = await initSqlJs({ locateFile: (f: string) => `/${f}` });
  const db = new SQL.Database(new Uint8Array(buffer));

  const tableRes = db.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`);
  const tableNames: string[] = tableRes[0]?.values.map((r: any[]) => String(r[0])) ?? [];

  const tables: ParsedTable[] = [];

  for (const tableName of tableNames) {
    const countRes = db.exec(`SELECT COUNT(*) FROM "${tableName}"`);
    const rowCount: number = Number(countRes[0]?.values[0][0] ?? 0);

    const limit = Math.min(rowCount, 2000);
    const dataRes = db.exec(`SELECT * FROM "${tableName}" LIMIT ${limit}`);
    const row0 = dataRes[0];

    if (!row0) {
      tables.push({ name: tableName, rowCount, columns: [], data: [] });
      continue;
    }

    const colNames: string[] = row0.columns;
    const rows: Record<string, any>[] = row0.values.map((r: any[]) =>
      Object.fromEntries(colNames.map((c, i) => [c, r[i]]))
    );

    const schemaRes = db.exec(`PRAGMA table_info("${tableName}")`);
    const sqlTypes: Record<string, string> = {};
    schemaRes[0]?.values.forEach((r: any[]) => {
      sqlTypes[String(r[1])] = String(r[2]);
    });

    const columns: ParsedColumn[] = colNames.map((col) => {
      const vals = rows.map((r) => r[col]);
      return buildColumn(col, sqlTypes[col] ?? 'TEXT', vals);
    });

    tables.push({ name: tableName, rowCount, columns, data: rows });
  }

  db.close();
  return tables;
}

// ─── CSV parsing ──────────────────────────────────────────────────────────────

export async function parseCSV(text: string, fileName: string): Promise<ParsedTable[]> {
  const Papa = (await import('papaparse')).default;
  const result = Papa.parse<Record<string, any>>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  const data = result.data.slice(0, 2000);
  const colNames = result.meta.fields ?? [];

  const columns: ParsedColumn[] = colNames.map((col) => {
    const vals = data.map((r) => r[col]);
    return buildColumn(col, 'TEXT', vals);
  });

  const tableName = fileName.replace(/\.[^.]+$/, '');

  return [{ name: tableName, rowCount: result.data.length, columns, data }];
}

// ─── Entry point ─────────────────────────────────────────────────────────────

export async function parseFile(file: File): Promise<DatabaseInfo> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';

  let tables: ParsedTable[];

  if (ext === 'csv') {
    const text = await file.text();
    tables = await parseCSV(text, file.name);
  } else if (['db', 'sqlite', 'sqlite3'].includes(ext)) {
    const buffer = await file.arrayBuffer();
    tables = await parseSQLite(buffer);
  } else {
    throw new Error(`Unsupported file type: .${ext}`);
  }

  return {
    fileName: file.name,
    fileType: ext === 'csv' ? 'csv' : 'sqlite',
    fileSize: file.size,
    tables,
    uploadedAt: new Date().toISOString(),
  };
}
