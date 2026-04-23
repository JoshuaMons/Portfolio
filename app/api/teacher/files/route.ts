import { NextResponse } from 'next/server';

import { requireTeacherServiceClient } from '@/lib/teacher-route-auth';

export async function GET() {
  const auth = await requireTeacherServiceClient();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { data: rows, error } = await auth.serviceClient
    .from('files')
    .select(
      'id,title,description,tags,storage_path,original_name,mime_type,size_bytes,show_on_website,show_for_teacher,visibility,created_at,updated_at,mini_project_id,mini_projects(token)'
    )
    .eq('owner_id', auth.adminUserId)
    .eq('show_for_teacher', true)
    .order('updated_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items = await Promise.all(
    (rows ?? []).map(async (r: Record<string, unknown>) => {
      const path = r.storage_path as string | null;
      const signed =
        path && path.length > 0
          ? await auth.serviceClient.storage.from('uploads').createSignedUrl(path, 60 * 10)
          : { data: null as { signedUrl: string } | null };
      const nested = r.mini_projects as { token: string } | { token: string }[] | null | undefined;
      const miniTok = Array.isArray(nested) ? nested[0]?.token : nested?.token;
      const { mini_projects: _drop, ...rest } = r;
      return {
        ...rest,
        mini_project_token: miniTok ?? null,
        signed_url: signed.data?.signedUrl ?? null,
      };
    })
  );

  return NextResponse.json({ data: items });
}
