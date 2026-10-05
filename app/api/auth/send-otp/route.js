import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    
    // Respon dummy supaya butang "Kirim Kode OTP" tidak error lagi
    return NextResponse.json({ 
      success: true, 
      message: 'Kode OTP berhasil dikirim (Dummy Mode: 123456)' 
    });
  } catch (error) {
    return NextResponse.json({ success: true, otp: '123456' });
  }
}
