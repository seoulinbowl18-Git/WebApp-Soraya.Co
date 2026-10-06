import { NextResponse } from 'next/server';

const getShippingBaseUrl = () => {
  const isSandbox = (process.env.KOMERCE_IS_SANDBOX || 'true').toLowerCase() === 'true';
  return isSandbox
    ? 'https://api-sandbox.collaborator.komerce.id'
    : 'https://api.collaborator.komerce.id';
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword');

  if (!keyword || keyword.trim().length < 3) {
    return NextResponse.json({ data: [] });
  }

  try {
    const apiKey = process.env.KOMERCE_SHIPPING_KEY || process.env.KOMERCE_SANDBOX_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: 'KOMERCE_SHIPPING_KEY belum di-set', data: [] },
        { status: 500 }
      );
    }

    const baseUrl = getShippingBaseUrl();
    const response = await fetch(
      `${baseUrl}/tariff/api/v1/destination/?keyword=${encodeURIComponent(keyword)}`,
      {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: result.message || 'Gagal mengambil data dari Komerce', raw: result },
        { status: response.status }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Komerce Destination API Error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server internal', message: error.message },
      { status: 500 }
    );
  }
}
