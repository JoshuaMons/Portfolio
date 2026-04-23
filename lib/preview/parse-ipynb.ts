export function parseIpynbBuffer(
  buf: ArrayBuffer,
  maxText = 1_200_000
): { kind: 'ipynb'; cells: Array<{ cellType: 'markdown' | 'code'; source: string; language?: string }> } | null {
  try {
    const t = new TextDecoder().decode(buf);
    if (t.length > maxText) return null;
    const j = JSON.parse(t) as {
      cells?: Array<{
        cell_type: string;
        source?: string | string[];
        metadata?: { language_info?: { name?: string } };
      }>;
      metadata?: { language_info?: { name?: string } };
    };
    if (!j.cells) return null;
    const defaultLang = j.metadata?.language_info?.name;
    const cells: Array<{ cellType: 'markdown' | 'code'; source: string; language?: string }> = [];
    for (const c of j.cells) {
      const source = Array.isArray(c.source) ? c.source.join('') : String(c.source || '');
      if (c.cell_type === 'markdown') {
        cells.push({ cellType: 'markdown', source });
      } else if (c.cell_type === 'code') {
        const language =
          (c as { metadata?: { language_info?: { name?: string } } }).metadata?.language_info?.name || defaultLang || 'python';
        cells.push({ cellType: 'code', source, language });
      } else {
        // raw, etc. — show as plain
        cells.push({ cellType: 'markdown', source: `\`\`\`\n${source}\n\`\`\`` });
      }
    }
    if (cells.length > 200) {
      return { kind: 'ipynb', cells: cells.slice(0, 200) };
    }
    return { kind: 'ipynb', cells };
  } catch {
    return null;
  }
}
