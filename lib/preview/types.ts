export type PreviewKind =
  | 'web'
  | 'pdf'
  | 'image'
  | 'video'
  | 'docx_html'
  | 'xlsx_table'
  | 'ipynb'
  | 'code'
  | 'csv_table'
  | 'unsupported';

export type PreviewResult =
  | { ok: true; kind: 'web' }
  | { ok: true; kind: 'pdf' }
  | { ok: true; kind: 'image' }
  | { ok: true; kind: 'video' }
  | { ok: true; kind: 'docx_html'; html: string; label: string }
  | {
      ok: true;
      kind: 'xlsx_table';
      sheetName: string;
      headers: string[];
      rows: string[][];
      truncated: boolean;
    }
  | { ok: true; kind: 'csv_table'; headers: string[]; rows: string[][]; truncated: boolean }
  | {
      ok: true;
      kind: 'ipynb';
      cells: Array<{ cellType: 'markdown' | 'code'; source: string; language?: string }>;
    }
  | { ok: true; kind: 'code'; language: string; text: string; truncated: boolean }
  | { ok: true; kind: 'unsupported'; mime: string; ext: string; message: string }
  | { ok: false; error: string };
