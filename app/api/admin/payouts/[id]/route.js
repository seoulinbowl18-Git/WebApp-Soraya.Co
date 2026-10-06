import { NextResponse } from 'next/server';
import { store, checkAdmin } from '@/lib/store';

export async function POST(request, { params }) {
  if (!checkAdmin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const { status } = await request.json();
  const p = store.payouts.find((x) => x.id === id);
  if (!p) return NextResponse.json({ error: 'Payout tidak ditemukan' }, { status: 404 });
  p.status = status;
  p.processedAt = new Date().toISOString();
  return NextResponse.json({ success: true, payout: p });
}
