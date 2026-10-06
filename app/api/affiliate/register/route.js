import { NextResponse } from 'next/server';
import { store, newAffiliateCode } from '@/lib/store';

export async function POST(request) {
  try {
    const body = await request.json();
    const { fullName, email, phone, socialLinks, payout } = body;
    if (!fullName || !email || !phone) {
      return NextResponse.json({ error: 'Nama, email, dan nomor WhatsApp wajib diisi' }, { status: 400 });
    }
    // Cek duplikat email
    for (const a of store.affiliates.values()) {
      if (a.email.toLowerCase() === String(email).toLowerCase()) {
        return NextResponse.json({ error: 'Email sudah terdaftar sebagai afiliator' }, { status: 400 });
      }
    }
    const code = newAffiliateCode();
    const affiliate = {
      code,
      fullName,
      email,
      phone,
      socialLinks: socialLinks || '',
      payout: {
        method: payout?.method || 'bca',
        accountName: payout?.accountName || '',
        accountNumber: payout?.accountNumber || '',
      },
      commissionPct: 10,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    store.affiliates.set(code, affiliate);
    return NextResponse.json({ success: true, affiliate });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 });
  }
}
