import { headers } from 'next/headers';

import type { Project } from '@/types/portfolio';
import { TeacherProjectsClient } from './teacher-projects-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TeacherPage() {
  const h = headers();
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const host = h.get('x-forwarded-host') ?? h.get('host');
  const baseUrl = host ? `${proto}://${host}` : '';
  const cookie = h.get('cookie') ?? '';

  let projects: Project[] = [];
  let teacherProjectsOk: boolean | null = null;
  if (baseUrl) {
    const res = await fetch(`${baseUrl}/api/teacher/projects`, {
      headers: { cookie },
      cache: 'no-store',
    }).catch(() => null);
    teacherProjectsOk = Boolean(res?.ok);
    if (res?.ok) {
      const json = (await res.json().catch(() => ({}))) as { data?: Project[] };
      projects = json.data ?? [];
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-12">
      <TeacherProjectsClient
        projects={projects}
        teacherProjectsApiOk={teacherProjectsOk}
        baseUrlConfigured={Boolean(baseUrl)}
      />
    </div>
  );
}
