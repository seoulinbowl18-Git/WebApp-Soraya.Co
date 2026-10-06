import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function POST(request) {
  try {
    const { code, productId } = await request.json();
    if (!code) return NextResponse.json({ error: 'code wajib' }, { status: 400 });
    if (!store.affiliates.has(code)) return NextResponse.json({ success: true, tracked: false });
    store.clicks.push({ code, productId: productId || null, ts: new Date().toISOString() });
    return NextResponse.json({ success: true, tracked: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
