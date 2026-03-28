import { NextRequest, NextResponse } from 'next/server';
import { DASHBOARD_COOKIE_NAME, isDashboardAuthEnabled, isValidDashboardKey } from '@/lib/adminAuth';

export async function POST(req: NextRequest) {
  if (!isDashboardAuthEnabled()) {
    return NextResponse.json({ success: true, authEnabled: false });
  }

  const body = await req.json().catch(() => ({}));
  const accessKey = typeof body.accessKey === 'string' ? body.accessKey : '';

  if (!isValidDashboardKey(accessKey)) {
    return NextResponse.json({ error: 'Chave de acesso invalida' }, { status: 401 });
  }

  const response = NextResponse.json({ success: true, authEnabled: true });
  response.cookies.set(DASHBOARD_COOKIE_NAME, accessKey.trim(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(DASHBOARD_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return response;
}
