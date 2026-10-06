import { NextResponse } from 'next/server';
import { store, checkAdmin } from '@/lib/store';

export async function POST(request, { params }) {
  if (!checkAdmin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { code } = await params;
  const a = store.affiliates.get(code);
  if (!a) return NextResponse.json({ error: 'Afiliator tidak ditemukan' }, { status: 404 });
  a.status = 'active';
  a.activatedAt = new Date().toISOString();
  store.affiliates.set(code, a);
  return NextResponse.json({ success: true, affiliate: a });
}
