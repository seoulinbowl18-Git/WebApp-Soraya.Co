import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  const path = params?.path || [];
  const endpoint = path.join('/');

  // Menangkap SEMUA request kirim OTP (baik WhatsApp maupun Email)
  if (endpoint.includes('auth') || endpoint.includes('otp')) {
    return NextResponse.json({
      success: true,
      message: 'Kode OTP berhasil dikirim (Dummy Mode: 123456)',
      otp: '123456'
    });
  }

  // Kode bawaan Anda lainnya untuk endpoint POST lain tetap di bawah ini...
  return NextResponse.json({ success: true });
}
