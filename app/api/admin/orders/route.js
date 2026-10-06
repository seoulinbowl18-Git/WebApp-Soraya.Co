import { NextResponse } from 'next/server';
import { store, checkAdmin } from '@/lib/store';

export async function GET(request) {
  if (!checkAdmin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const items = Array.from(store.orders.values())
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((o) => ({
      id: o.id,
      orderNumber: o.number || o.id,
      createdAt: o.createdAt,
      ref: o.affiliateCode || o.ref || null,
      total: o.grandTotal,
      commission: o.commission || 0,
      status: o.affiliateStatus || (o.paymentStatus === 'paid' ? 'approved' : 'pending'),
      customer: o.customer,
      items: o.items,
    }));
  return NextResponse.json({ items });
}
