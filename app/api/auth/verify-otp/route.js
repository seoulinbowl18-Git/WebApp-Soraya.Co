import { NextResponse } from 'next/server';

// POST /api/auth/verify-otp — dummy accepts 123456
export async function POST(request) {
  const { otp, otpId, email, phone } = await request.json().catch(() => ({}));
  if (String(otp) !== '123456') return NextResponse.json({ error: 'OTP salah. Gunakan 123456 (demo).' }, { status: 400 });
  const user = {
    id: `usr_${Date.now()}`,
    name: 'Pelanggan Soraya',
    email: email || 'customer@soraya.co',
    phone: phone || '08000000000',
    role: 'customer',
    token: `jwt-${otpId}-${Date.now()}`,
  };
  return NextResponse.json({ success: true, user, token: user.token });
}
