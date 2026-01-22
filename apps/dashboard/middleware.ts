import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const publicPaths = [
  '/',           // Homepage (marketing)
  '/login',
  '/signup',
  '/auth/callback',
  '/api/widget',
  '/api/auth',
  '/widget.js',  // Widget script
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Update session for all requests (to refresh tokens)
  const { response, user } = await updateSession(request);

  // Allow public paths without auth check
  const isPublicPath = publicPaths.some(path =>
    path === '/' ? pathname === '/' : pathname.startsWith(path)
  );
  if (isPublicPath) {
    return response;
  }

  // Check if user is authenticated using the actual session state
  if (!user && !pathname.startsWith('/api/')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
