export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { CATALOG } from '@/lib/catalog';

const DUMMY_USER = {
  id: 'usr_dummy_123',
  name: 'Pelanggan Soraya',
  email: 'lazkids02@gmail.com',
  phone: '0852156666',
  role: 'customer',
  token: 'dummy-jwt-token-soraya-123456'
};

export async function GET(request) {
  return NextResponse.json({
    success: true,
    status: 'success',
    products: CATALOG,
    data: CATALOG
  });
}

export async function POST(request) {
  return NextResponse.json({
    success: true,
    status: 'success',
    message: 'Berhasil (Dummy Mode)',
    otp: '123456',
    code: '123456',
    token: 'dummy-jwt-token-soraya-123456',
    user: DUMMY_USER,
    data: {
      user: DUMMY_USER,
      token: 'dummy-jwt-token-soraya-123456',
      otp: '123456'
    }
  });
}

export async function PUT(request) {
  return NextResponse.json({ success: true, status: 'success', data: DUMMY_USER });
}

export async function DELETE(request) {
  return NextResponse.json({ success: true, status: 'success' });
}
