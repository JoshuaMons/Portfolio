import AdmZip from 'adm-zip';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Strip ODF inner tags; keep visible text. */
function odfPlain(fragment: string): string {
  return fragment.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Best-effort OpenDocument Text → simple HTML for inline preview.
 * Volledige lay-out (tabellen, lijsten) wordt niet nagebootst.
 */
export function odtBufferToHtml(buffer: ArrayBuffer): string | null {
  try {
    const zip = new AdmZip(Buffer.from(buffer));
    const entry = zip.getEntry('content.xml');
    if (!entry) return null;
    const xml = entry.getData().toString('utf8');
    const parts: string[] = [];

    const blockRe = /<(?:text:h|text:p)\b[^>]*>([\s\S]*?)<\/(?:text:h|text:p)>/g;
    let m: RegExpExecArray | null;
    while ((m = blockRe.exec(xml))) {
      const full = m[0];
      const inner = m[1];
      const plain = odfPlain(inner);
      if (!plain) continue;
      if (full.startsWith('<text:h')) {
        const levM = full.match(/text:outline-level="(\d)"/);
        const n = levM ? Math.min(6, Math.max(1, parseInt(levM[1], 10))) : 2;
        parts.push(`<h${n}>${escapeHtml(plain)}</h${n}>`);
      } else {
        parts.push(`<p>${escapeHtml(plain)}</p>`);
      }
    }

    if (!parts.length) return null;
    return `<div class="odt-plain-preview">${parts.join('')}</div>`;
  } catch {
    return null;
  }
}
