import { NextResponse } from 'next/server';
import { store, newId, computeAffiliateStats } from '@/lib/store';

export async function POST(request) {
  try {
    const { code, amount } = await request.json();
    const a = store.affiliates.get(code);
    if (!a) return NextResponse.json({ error: 'Afiliator tidak ditemukan' }, { status: 404 });
    if (a.status !== 'active') return NextResponse.json({ error: 'Akun belum diaktivasi admin' }, { status: 400 });
    const stats = computeAffiliateStats(code);
    const req = Number(amount || 0);
    if (req < 50000) return NextResponse.json({ error: 'Minimum tarik dana Rp 50.000' }, { status: 400 });
    if (req > stats.available) return NextResponse.json({ error: `Saldo tidak cukup. Tersedia Rp ${stats.available.toLocaleString('id-ID')}` }, { status: 400 });
    const payout = {
      id: newId('PO'),
      affiliateCode: code,
      amount: req,
      method: a.payout.method,
      account: `${a.payout.accountName} · ${a.payout.accountNumber}`,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };
    store.payouts.push(payout);
    return NextResponse.json({ success: true, payout });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
