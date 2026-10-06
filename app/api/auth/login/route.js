import { NextResponse } from 'next/server';

// POST /api/auth/login — dummy OTP flow
export async function POST(request) {
  const { email, phone } = await request.json().catch(() => ({}));
  const contact = phone || email;
  if (!contact) return NextResponse.json({ error: 'Email atau nomor WhatsApp wajib' }, { status: 400 });
  const otpId = `OTP-${Date.now()}-${Math.floor(Math.random() * 9000) + 1000}`;
  return NextResponse.json({ success: true, otpId, message: 'Kode OTP: 123456 (dummy)', devOtp: '123456' });
}
