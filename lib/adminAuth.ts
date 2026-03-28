import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const DASHBOARD_COOKIE_NAME = 'ibasocial_dashboard_session';

function getDashboardKey() {
  return process.env.DASHBOARD_ACCESS_KEY?.trim();
}

export function isDashboardAuthEnabled() {
  return Boolean(getDashboardKey());
}

export async function requireDashboardAuth() {
  if (!isDashboardAuthEnabled()) return null;

  const store = await cookies();
  const sessionValue = store.get(DASHBOARD_COOKIE_NAME)?.value;

  if (sessionValue && sessionValue === getDashboardKey()) return null;

  return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
}

export function isValidDashboardKey(accessKey: string) {
  const expectedKey = getDashboardKey();
  if (!expectedKey) return false;
  return accessKey.trim() === expectedKey;
}
