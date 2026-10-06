import { NextResponse } from 'next/server';
import { store, checkAdmin } from '@/lib/store';

export async function GET(request) {
  if (!checkAdmin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const items = Array.from(store.affiliates.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return NextResponse.json({ items });
}
