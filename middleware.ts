import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const adminUserId = process.env.ADMIN_USER_ID;
  const teacherUserId = process.env.TEACHER_USER_ID;

  // If Supabase isn't configured yet, don't block navigation.
  if (!url || !anonKey || !adminUserId) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id ?? null;

  const isAdminRoute =
    request.nextUrl.pathname === '/admin' ||
    request.nextUrl.pathname.startsWith('/admin/') ||
    request.nextUrl.pathname === '/blog' ||
    request.nextUrl.pathname.startsWith('/blog/');

  if (isAdminRoute && userId !== adminUserId) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  const isTeacherRoute =
    request.nextUrl.pathname === '/teacher' ||
    request.nextUrl.pathname.startsWith('/teacher/');

  if (isTeacherRoute) {
    if (!teacherUserId || userId !== teacherUserId) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/teacher/login';
      redirectUrl.searchParams.set('next', request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/blog/:path*', '/teacher/:path*'],
};

