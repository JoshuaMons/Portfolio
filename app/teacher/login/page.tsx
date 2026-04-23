import { Suspense } from 'react';
import { TeacherLoginClient } from './teacher-login-client';

export default function TeacherLoginPage() {
  return (
    <Suspense>
      <TeacherLoginClient />
    </Suspense>
  );
}

