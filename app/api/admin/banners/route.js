import { NextResponse } from 'next/server';
import { store, checkAdmin } from '@/lib/store';

// GET list, PUT replace all 5
export async function GET(request) {
  if (!checkAdmin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return NextResponse.json({ items: store.banners });
}

export async function PUT(request) {
  if (!checkAdmin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const { items } = await request.json();
    if (!Array.isArray(items)) return NextResponse.json({ error: 'items wajib array' }, { status: 400 });
    const sanitized = items.slice(0, 5).map((b, i) => ({
      id: b.id || `b${i + 1}`,
      image: String(b.image || '').trim(),
      title: String(b.title || '').slice(0, 80),
      subtitle: String(b.subtitle || '').slice(0, 120),
      cta: String(b.cta || 'Belanja Sekarang').slice(0, 32),
      href: String(b.href || '/').slice(0, 200),
      active: b.active !== false,
    }));
    store.banners = sanitized;
    return NextResponse.json({ success: true, items: store.banners });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
