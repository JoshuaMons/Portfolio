import { FilesClient, type PublicFile } from './files-client';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function FilesPage() {
  const h = headers();
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const host = h.get('x-forwarded-host') ?? h.get('host');
  const baseUrl = host ? `${proto}://${host}` : '';

  const res = await fetch(`${baseUrl}/api/files/public`, {
    cache: 'no-store',
  }).catch(() => null);

  const json = res ? await res.json().catch(() => ({})) : {};
  const data = (json?.data as PublicFile[] | undefined) ?? [];

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-12">
      <div>
        <h1 className="text-2xl font-semibold">Bestanden</h1>
        <p className="mt-1 text-sm text-muted-foreground">Public uploads van het portfolio.</p>
      </div>

      {!res || !res.ok ? (
        <p className="mt-6 rounded-2xl border border-border/60 bg-background/50 p-4 text-sm text-muted-foreground">
          Kon bestanden niet laden. Check of `SUPABASE_SERVICE_ROLE_KEY` is gezet op Vercel.
        </p>
      ) : null}

      <FilesClient initial={data} />
    </div>
  );
}

