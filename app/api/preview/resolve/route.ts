import { NextResponse } from 'next/server';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

import type { PreviewResult } from '@/lib/preview/types';
import { fileExtFromPath, safeFetch } from '@/lib/preview/safe-url';
import { parseIpynbBuffer } from '@/lib/preview/parse-ipynb';

export const runtime = 'nodejs';

const CODE_EXT: Record<string, string> = {
  ts: 'typescript',
  tsx: 'tsx',
  js: 'javascript',
  jsx: 'jsx',
  mjs: 'javascript',
  cjs: 'javascript',
  py: 'python',
  rb: 'ruby',
  go: 'go',
  rs: 'rust',
  java: 'java',
  cpp: 'cpp',
  cxx: 'cpp',
  cc: 'cpp',
  h: 'c',
  cs: 'csharp',
  php: 'php',
  swift: 'swift',
  kt: 'kotlin',
  sql: 'sql',
  r: 'r',
  sh: 'bash',
  bash: 'bash',
  zsh: 'bash',
  yml: 'yaml',
  yaml: 'yaml',
  json: 'json',
  xml: 'xml',
  html: 'html',
  htm: 'html',
  css: 'css',
  scss: 'scss',
  sass: 'scss',
  md: 'markdown',
  toml: 'toml',
  txt: 'text',
  env: 'text',
};

const MAX_HTML = 600_000;
const MAX_CODE_CHARS = 180_000;
const MAX_ROWS = 200;
const MAX_COLS = 40;

function htmlResponse(r: PreviewResult) {
  return NextResponse.json(r);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as { url?: string } | null;
    const url = typeof body?.url === 'string' ? body.url.trim() : '';
    if (!url) return htmlResponse({ ok: false, error: 'Geen URL' });

    const pathExt = fileExtFromPath(new URL(url).pathname);

    const fetched = await safeFetch(url);
    if (!fetched.ok) return htmlResponse({ ok: false, error: fetched.error });

    const { contentType, buffer, finalUrl } = fetched;
    const finalPath = new URL(finalUrl).pathname;
    const ext = pathExt || fileExtFromPath(finalPath);

    const ct = contentType.toLowerCase();

    // --- Web / HTML sites
    if (ct.includes('text/html') || ct.includes('application/xhtml')) {
      return htmlResponse({ ok: true, kind: 'web' });
    }

    // PDF
    if (ct.includes('application/pdf') || ext === 'pdf') {
      return htmlResponse({ ok: true, kind: 'pdf' });
    }

    // Images
    if (ct.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico', 'avif'].includes(ext)) {
      if (ext === 'svg' || ct.includes('image/svg')) {
        return htmlResponse({
          ok: true,
          kind: 'unsupported',
          mime: contentType,
          ext: ext || '—',
          message: 'SVG preview is uitgezet (beveiliging). Open of download in een nieuw tabblad.',
        });
      }
      return htmlResponse({ ok: true, kind: 'image' });
    }

    // Video
    if (ct.startsWith('video/') || ['mp4', 'webm', 'ogg', 'ogv', 'mov'].includes(ext)) {
      return htmlResponse({ ok: true, kind: 'video' });
    }

    // Word
    if (ext === 'docx' || ct.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
      const { value: html } = await mammoth.convertToHtml({ arrayBuffer: buffer });
      if (html.length > MAX_HTML) {
        return htmlResponse({
          ok: true,
          kind: 'unsupported',
          mime: contentType,
          ext,
          message: 'Word-document is te groot om inline te tonen. Open in een nieuw tabblad of downloaden.',
        });
      }
      return htmlResponse({ ok: true, kind: 'docx_html', html, label: 'Word (DOCX) → leesbare preview' });
    }

    if (ext === 'doc' || ct.includes('application/msword')) {
      return htmlResponse({
        ok: true,
        kind: 'unsupported',
        mime: contentType,
        ext: ext || 'doc',
        message: 'Klassiek .doc kan niet in de browser ingelezen worden. Sla op als .docx of zet in PDF, of download.',
      });
    }

    // Excel
    if (
      ext === 'xlsx' ||
      ext === 'xlsm' ||
      ext === 'xls' ||
      ct.includes('application/vnd.openxmlformats-officedocument.spreadsheetml') ||
      ct.includes('application/vnd.ms-excel') ||
      ct.includes('officedocument.spreadsheetml')
    ) {
      const wb = XLSX.read(buffer, { type: 'array' });
      const sheetName = wb.SheetNames[0];
      if (!sheetName) {
        return htmlResponse({
          ok: true,
          kind: 'unsupported',
          ext,
          mime: contentType,
          message: 'Geen tabblad gevonden in de spreadsheet.',
        });
      }
      const sheet = wb.Sheets[sheetName];
      const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as (string | number)[][];
      const trimmed = aoa
        .filter((r) => r.some((c) => String(c).trim() !== ''))
        .map((r) => r.map((c) => (c == null ? '' : String(c))));
      let rows = trimmed.slice(0, MAX_ROWS + 1);
      const truncated = trimmed.length > MAX_ROWS + 1;
      if (rows.length > 0) {
        for (const row of rows) {
          if (row.length > MAX_COLS) row.splice(MAX_COLS, row.length - MAX_COLS);
        }
      }
      const headerRow = (rows[0] ?? []) as string[];
      const dataRows = rows.slice(1) as string[][];
      return htmlResponse({
        ok: true,
        kind: 'xlsx_table',
        sheetName,
        headers: headerRow,
        rows: dataRows,
        truncated,
      });
    }

    // CSV
    if (ext === 'csv' || ct.includes('text/csv') || ct.includes('application/csv')) {
      const t = new TextDecoder().decode(buffer);
      if (t.length > MAX_CODE_CHARS) {
        return htmlResponse({
          ok: true,
          kind: 'unsupported',
          mime: contentType,
          ext: 'csv',
          message: 'CSV is te groot voor inline preview. Download of open in desktop Excel.',
        });
      }
      const wb = XLSX.read(t, { type: 'string' });
      const sn = wb.SheetNames[0];
      if (!sn) {
        return htmlResponse({ ok: true, kind: 'unsupported', ext: 'csv', mime: contentType, message: 'Kon CSV niet parsen.' });
      }
      const sheet = wb.Sheets[sn];
      const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as (string | number)[][];
      const trimmed = aoa.filter((r) => r.some((c) => String(c).trim() !== '')).map((r) => r.map((c) => (c == null ? '' : String(c))));
      const truncated = trimmed.length > MAX_ROWS + 1;
      const rowsOut = trimmed.slice(0, MAX_ROWS + 1);
      const headers = (rowsOut[0] ?? []).map(String);
      const dataRows = rowsOut.slice(1);
      return htmlResponse({ ok: true, kind: 'csv_table', headers, rows: dataRows, truncated });
    }

    // Jupyter
    if (ext === 'ipynb' || ct.includes('application/x-ipynb+json') || (ct.includes('application/json') && ext === 'ipynb')) {
      const ipynb = parseIpynbBuffer(buffer);
      if (ipynb) return htmlResponse({ ok: true, kind: 'ipynb', cells: ipynb.cells });
    }

    // Text / code
    if (ext in CODE_EXT) {
      const t = new TextDecoder().decode(buffer);
      if (t.length > MAX_CODE_CHARS) {
        return htmlResponse({
          ok: true,
          kind: 'code',
          language: CODE_EXT[ext] || 'text',
          text: t.slice(0, MAX_CODE_CHARS) + '\n\n…(afgekapt voor preview)…\n',
          truncated: true,
        });
      }
      return htmlResponse({ ok: true, kind: 'code', language: CODE_EXT[ext] || 'text', text: t, truncated: false });
    }

    if (ct.startsWith('text/') || (ct.includes('json') && ext !== 'ipynb') || ct.includes('javascript') || ct.includes('typescript')) {
      const t = new TextDecoder().decode(buffer);
      if (t.length > MAX_CODE_CHARS) {
        return htmlResponse({
          ok: true,
          kind: 'code',
          language: ext && CODE_EXT[ext] ? CODE_EXT[ext] : 'text',
          text: t.slice(0, MAX_CODE_CHARS) + '\n\n…(afgekapt)…\n',
          truncated: true,
        });
      }
      return htmlResponse({
        ok: true,
        kind: 'code',
        language: (ext && CODE_EXT[ext]) || 'text',
        text: t,
        truncated: false,
      });
    }

    return htmlResponse({
      ok: true,
      kind: 'unsupported',
      mime: contentType,
      ext: ext || '—',
      message: 'Geen geschikte inline preview. Open in een nieuw tabblad of download het bestand.',
    });
  } catch (e: any) {
    return htmlResponse({ ok: false, error: e?.message || 'Preview mislukt' });
  }
}
