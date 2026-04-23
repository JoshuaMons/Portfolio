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
      'id,title,description,tags,storage_path,original_name,mime_type,size_bytes,show_on_website,show_for_teacher,visibility,created_at,updated_at'
    )
    .eq('owner_id', auth.adminUserId)
    .eq('show_for_teacher', true)
    .order('updated_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items = await Promise.all(
    (rows ?? []).map(async (r: Record<string, unknown>) => {
      const path = r.storage_path as string;
      const signed = await auth.serviceClient.storage.from('uploads').createSignedUrl(path, 60 * 10);
      return {
        ...r,
        signed_url: signed.data?.signedUrl ?? null,
      };
    })
  );

  return NextResponse.json({ data: items });
}
