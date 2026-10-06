import { NextResponse } from 'next/server';
import { store, checkAdmin, commissionFor } from '@/lib/store';

export async function POST(request, { params }) {
  if (!checkAdmin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const { status } = await request.json();
  const o = store.orders.get(id);
  if (!o) return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 });
  o.affiliateStatus = status;
  o.updatedAt = new Date().toISOString();
  // Hitung komisi kalau approved & ada ref
  if (status === 'approved' && o.affiliateCode) {
    o.commission = (o.items || []).reduce((s, it) => {
      const prod = store.catalog.find((p) => String(p.id) === String(it.id));
      return s + commissionFor(prod || { commissionPct: 10 }, (it.price || 0) * (it.qty || 1));
    }, 0);
  }
  store.orders.set(id, o);
  return NextResponse.json({ success: true, order: o });
}
