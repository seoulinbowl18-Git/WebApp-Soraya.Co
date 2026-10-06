import { NextResponse } from 'next/server';
import { store, computeAffiliateStats } from '@/lib/store';

export async function GET(request, { params }) {
  const { code } = await params;
  const affiliate = store.affiliates.get(code);
  if (!affiliate) return NextResponse.json({ error: 'Kode afiliator tidak ditemukan' }, { status: 404 });
  const stats = computeAffiliateStats(code);
  const orders = Array.from(store.orders.values())
    .filter((o) => o.affiliateCode === code || o.ref === code)
    .map((o) => ({
      id: o.id,
      orderNumber: o.number || o.id,
      createdAt: o.createdAt,
      total: o.grandTotal,
      commission: o.commission || 0,
      status: o.affiliateStatus || (o.paymentStatus === 'paid' ? 'approved' : 'pending'),
      ref: code,
    }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return NextResponse.json({ affiliate, stats, orders, trend: stats.trend });
}
