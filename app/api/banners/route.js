import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

// Public GET — hanya banner yang active
export async function GET() {
  const items = store.banners.filter((b) => b.active && b.image);
  return NextResponse.json({ items });
}
