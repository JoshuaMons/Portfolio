import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function AdminBlogPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold">Logboek</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Het logboek is nu automatisch en staat op <code className="font-mono">/admin/logbook</code>.
      </p>
      <div className="mt-4">
        <Button asChild>
          <Link href="/admin/logbook">Open automatisch logboek</Link>
        </Button>
      </div>
    </div>
  );
}

