import { ParsedColumn, ParsedTable, DatabaseInfo, ColumnType } from '@/types';

export type ProgressFn = (pct: number, msg: string) => void;

// ─── Column type inference ────────────────────────────────────────────────────

const DATE_RE = /^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}([ T]\d{1,2}:\d{2})?/;
const TIME_RE = /^\d{1,2}:\d{2}(:\d{2})?$/;

export function inferColumnType(values: any[]): ColumnType {
  const sample = values
    .filter((v) => v !== null && v !== undefined && v !== '')
    .slice(0, 500)
    .map((v) => String(v).trim());

  if (sample.length === 0) return 'text';

  const boolSet = new Set(['true', 'false', '0', '1', 'yes', 'no', 'ja', 'nee', 'waar', 'onwaar']);
  if (sample.every((v) => boolSet.has(v.toLowerCase()))) return 'boolean';

  const dateMatches = sample.filter((v) => DATE_RE.test(v) || TIME_RE.test(v));
  if (dateMatches.length / sample.length >= 0.8) return 'date';

  const numMatches = sample.filter((v) => !isNaN(Number(v)) && v !== '');
  if (numMatches.length / sample.length >= 0.85) return 'number';

  const unique = new Set(sample);
  if (unique.size <= Math.min(50, sample.length * 0.4)) return 'category';

  return 'text';
}

function buildColumn(name: string, sqlType: string, allValues: any[]): ParsedColumn {
  const inferredType = inferColumnType(allValues);
  const unique = new Set(allValues.filter((v) => v !== null && v !== undefined && v !== '').map(String));
  const sampleValues = Array.from(unique).slice(0, 8).map(String);
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

// ─── Shared sql.js DB → tables ────────────────────────────────────────────────

const DISPLAY_LIMIT = 10_000;

async function extractTables(db: any, onProgress?: ProgressFn): Promise<ParsedTable[]> {
  const tableRes = db.exec(
    `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`
  );
  const tableNames: string[] = tableRes[0]?.values.map((r: any[]) => String(r[0])) ?? [];

  const tables: ParsedTable[] = [];

  for (let ti = 0; ti < tableNames.length; ti++) {
    const tableName = tableNames[ti];
    const pct = 50 + Math.round((ti / tableNames.length) * 45);
    onProgress?.(pct, `Analysing table "${tableName}"…`);

    // Exact row count via SQL — no row-loading needed
    const countRes = db.exec(`SELECT COUNT(*) FROM "${tableName}"`);
    const rowCount: number = Number(countRes[0]?.values[0][0] ?? 0);

    // Schema
    const schemaRes = db.exec(`PRAGMA table_info("${tableName}")`);
    const sqlTypes: Record<string, string> = {};
    schemaRes[0]?.values.forEach((r: any[]) => {
      sqlTypes[String(r[1])] = String(r[2]);
    });

    // Sample data — limited for display & analytics
    const dataRes = db.exec(`SELECT * FROM "${tableName}" LIMIT ${DISPLAY_LIMIT}`);
    const row0 = dataRes[0];

    if (!row0) {
      tables.push({ name: tableName, rowCount, columns: [], data: [] });
      continue;
    }

    const colNames: string[] = row0.columns;
    const rows: Record<string, any>[] = row0.values.map((r: any[]) =>
      Object.fromEntries(colNames.map((c, i) => [c, r[i]]))
    );

    const columns: ParsedColumn[] = colNames.map((col) =>
      buildColumn(col, sqlTypes[col] ?? 'TEXT', rows.map((r) => r[col]))
    );

    tables.push({ name: tableName, rowCount, columns, data: rows });
  }

  return tables;
}

// ─── SQLite binary (.db / .sqlite) ───────────────────────────────────────────

export async function parseSQLite(buffer: ArrayBuffer, onProgress?: ProgressFn): Promise<ParsedTable[]> {
  onProgress?.(5, 'Loading database engine…');
  const initSqlJs = (await import('sql.js')).default;
  const SQL = await initSqlJs({ locateFile: (f: string) => `/${f}` });

  onProgress?.(20, 'Opening database…');
  const db = new SQL.Database(new Uint8Array(buffer));

  const tables = await extractTables(db, onProgress);
  db.close();
  onProgress?.(100, 'Done');
  return tables;
}

// ─── SQL dump (.sql) ─────────────────────────────────────────────────────────

export async function parseSQL(text: string, onProgress?: ProgressFn): Promise<ParsedTable[]> {
  onProgress?.(5, 'Loading database engine…');
  const initSqlJs = (await import('sql.js')).default;
  const SQL = await initSqlJs({ locateFile: (f: string) => `/${f}` });

  onProgress?.(15, 'Creating in-memory database…');
  const db = new SQL.Database();

  // Split on statement boundaries, preserving strings correctly
  onProgress?.(20, 'Executing SQL statements…');
  const statements = splitSQL(text);
  const total = statements.length;

  for (let i = 0; i < total; i++) {
    const stmt = statements[i].trim();
    if (!stmt) continue;
    try {
      db.run(stmt);
    } catch {
      // skip statements that fail (comments, unknown syntax, etc.)
    }
    if (i % 500 === 0) {
      const pct = 20 + Math.round((i / total) * 28);
      onProgress?.(pct, `Executing statements… (${i.toLocaleString()} / ${total.toLocaleString()})`);
      // yield to UI thread briefly
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  const tables = await extractTables(db, onProgress);
  db.close();
  onProgress?.(100, 'Done');
  return tables;
}

/** Splits a SQL dump into individual statements, respecting quoted strings. */
function splitSQL(sql: string): string[] {
  const stmts: string[] = [];
  let buf = '';
  let inString = false;
  let quote = '';

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];

    if (inString) {
      buf += ch;
      if (ch === quote && sql[i - 1] !== '\\') inString = false;
    } else if (ch === "'" || ch === '"' || ch === '`') {
      inString = true;
      quote = ch;
      buf += ch;
    } else if (ch === '-' && sql[i + 1] === '-') {
      // line comment: skip to EOL
      const eol = sql.indexOf('\n', i);
      i = eol === -1 ? sql.length : eol;
    } else if (ch === '/' && sql[i + 1] === '*') {
      // block comment: skip to */
      const end = sql.indexOf('*/', i + 2);
      i = end === -1 ? sql.length : end + 1;
    } else if (ch === ';') {
      if (buf.trim()) stmts.push(buf.trim());
      buf = '';
    } else {
      buf += ch;
    }
  }

  if (buf.trim()) stmts.push(buf.trim());
  return stmts;
}

// ─── CSV streaming ────────────────────────────────────────────────────────────

export function parseCSVFile(file: File, onProgress?: ProgressFn): Promise<ParsedTable[]> {
  return new Promise((resolve, reject) => {
    // Dynamic import inside the promise — PapaParse only runs client-side
    import('papaparse').then(({ default: Papa }) => {
      const SAMPLE = DISPLAY_LIMIT;
      const data: Record<string, any>[] = [];
      let totalRows = 0;
      let fields: string[] = [];

      onProgress?.(5, 'Parsing CSV…');

      Papa.parse(file as any, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        // PapaParse streams the File in browser-native chunks — no full read needed
        step(row: any) {
          totalRows++;
          if (!fields.length && row.meta?.fields) fields = row.meta.fields;
          if (data.length < SAMPLE) data.push(row.data);

          if (totalRows % 20_000 === 0) {
            const mb = ((file.size * (totalRows / (totalRows + 1))) / 1_048_576).toFixed(1);
            onProgress?.(
              Math.min(90, 5 + Math.round((totalRows / Math.max(totalRows, 1)) * 85)),
              `Read ${totalRows.toLocaleString()} rows… (~${mb} MB)`
            );
          }
        },
        complete(results: any) {
          if (!fields.length) fields = results.meta?.fields ?? [];
          onProgress?.(95, 'Building schema…');

          const tableName = file.name.replace(/\.[^.]+$/, '');
          const columns: ParsedColumn[] = fields.map((col: string) =>
            buildColumn(col, 'TEXT', data.map((r) => r[col]))
          );

          onProgress?.(100, 'Done');
          resolve([{ name: tableName, rowCount: totalRows, columns, data }]);
        },
        error(err: any) {
          reject(new Error(err?.message ?? 'CSV parse error'));
        },
      });
    });
  });
}

// ─── Entry point ─────────────────────────────────────────────────────────────

const SQLITE_MAGIC = 'SQLite format 3';

async function isSQLiteBuffer(buffer: ArrayBuffer): Promise<boolean> {
  const bytes = new Uint8Array(buffer, 0, 16);
  const header = new TextDecoder().decode(bytes);
  return header.startsWith(SQLITE_MAGIC);
}

export async function parseFile(file: File, onProgress?: ProgressFn): Promise<DatabaseInfo> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';

  let tables: ParsedTable[];
  let fileType: DatabaseInfo['fileType'];

  if (ext === 'csv') {
    tables = await parseCSVFile(file, onProgress);
    fileType = 'csv';
  } else if (ext === 'sql') {
    onProgress?.(2, 'Reading SQL file…');
    const text = await file.text();
    tables = await parseSQL(text, onProgress);
    fileType = 'sql';
  } else if (['db', 'sqlite', 'sqlite3'].includes(ext)) {
    onProgress?.(2, 'Reading database file…');
    const buffer = await file.arrayBuffer();
    tables = await parseSQLite(buffer, onProgress);
    fileType = 'sqlite';
  } else {
    // Unknown extension — try SQLite magic bytes first, then reject
    onProgress?.(2, 'Detecting file type…');
    const buffer = await file.arrayBuffer();
    if (await isSQLiteBuffer(buffer)) {
      tables = await parseSQLite(buffer, onProgress);
      fileType = 'sqlite';
    } else {
      throw new Error(
        `Unsupported file type ".${ext}". Supported: .db, .sqlite, .sqlite3, .sql, .csv`
      );
    }
  }

  return {
    fileName: file.name,
    fileType,
    fileSize: file.size,
    tables,
    uploadedAt: new Date().toISOString(),
  };
}
