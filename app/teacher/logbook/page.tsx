import { TeacherLogbookClient } from '../teacher-logbook-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function TeacherLogbookPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-12">
      <TeacherLogbookClient />
    </div>
  );
}
