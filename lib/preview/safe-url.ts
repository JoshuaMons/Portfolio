const MAX_LEN = 4000;
const BYTES = 4 * 1024 * 1024; // 4MB

const PRIVATE_IPV4 = [
  /^0\./,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./,
  /^169\.254\./,
  /^224\./, // mcast
  /^240\./, // res
];

const BLOCKED_HOSTNAMES = new Set(
  [
    'localhost',
    'metadata.google.internal',
    'metadata',
    '169.254.169.254',
  ].map((h) => h.toLowerCase())
);

export function isBlockedIpv4(s: string): boolean {
  return PRIVATE_IPV4.some((r) => r.test(s));
}

export function safeParseUrl(raw: string): { ok: true; url: URL } | { ok: false; error: string } {
  if (raw.length > MAX_LEN) return { ok: false, error: 'URL te lang' };
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return { ok: false, error: 'Ongeldige URL' };
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    return { ok: false, error: 'Alleen http(s) is toegestaan' };
  }
  const host = u.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(host) || host.endsWith('.local')) {
    return { ok: false, error: 'Deze host is geblokkeerd voor beveiliging' };
  }
  if (host === '169.254.169.254' || host === '0.0.0.0') {
    return { ok: false, error: 'Deze host is geblokkeerd voor beveiliging' };
  }
  // block literal IPv4 private ranges
  if (/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(host) && isBlockedIpv4(host)) {
    return { ok: false, error: 'Interne/verboden IP-reeksen zijn niet toegestaan' };
  }
  return { ok: true, url: u };
}

export { BYTES as MAX_BYTES };

export async function safeFetch(
  startUrl: string
): Promise<
  { ok: true; url: string; finalUrl: string; status: number; contentType: string; buffer: ArrayBuffer } | { ok: false; error: string }
> {
  const parsed = safeParseUrl(startUrl);
  if (!parsed.ok) return parsed;

  let current = startUrl;
  for (let hop = 0; hop < 4; hop++) {
    const p2 = safeParseUrl(current);
    if (!p2.ok) return p2;
    const res = await fetch(p2.url.toString(), {
      method: 'GET',
      redirect: 'manual',
      headers: {
        'User-Agent': 'PortfolioPreview/1.0 (document preview)',
        Accept: '*/*',
      },
    });

    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location');
      if (!loc) return { ok: false, error: 'Ongeldige redirect' };
      const next = new URL(loc, p2.url).toString();
      const nextP = safeParseUrl(next);
      if (!nextP.ok) return nextP;
      current = nextP.url.toString();
      continue;
    }

    if (!res.ok) {
      return { ok: false, error: `Download mislukt (${res.status})` };
    }
    const len = res.headers.get('content-length');
    if (len && Number(len) > BYTES) {
      return { ok: false, error: 'Bestand is te groot voor preview' };
    }
    const ab = await res.arrayBuffer();
    if (ab.byteLength > BYTES) {
      return { ok: false, error: 'Bestand is te groot voor preview' };
    }
    const contentType = (res.headers.get('content-type') || 'application/octet-stream').split(';')[0].trim();
    return { ok: true, url: startUrl, finalUrl: p2.url.toString(), status: res.status, contentType, buffer: ab };
  }
  return { ok: false, error: 'Te veel redirects' };
}

export function fileExtFromPath(pathname: string): string {
  const m = pathname.match(/\.([a-zA-Z0-9]+)(?:$|\?)/);
  return (m?.[1] || '').toLowerCase();
}
