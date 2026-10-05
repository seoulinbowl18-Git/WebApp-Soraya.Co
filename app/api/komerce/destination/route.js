import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword');

  if (!keyword || keyword.trim().length < 3) {
    return NextResponse.json({ data: [] });
  }

  try {
    const apiKey = process.env.KOMERCE_SHIPPING_KEY || process.env.KOMERCE_SANDBOX_KEY;

    const response = await fetch(
      `https://api-sandbox.collaborator.komerce.id/tariff/api/v1/destination/?keyword=${encodeURIComponent(keyword)}`,
      {
        method: 'GET',
        headers: {
          'x-api-key': apiKey || '',
          'Content-Type': 'application/json',
        },
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: result.message || 'Gagal mengambil data dari Komerce' },
        { status: response.status }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Komerce Destination API Error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server internal' },
      { status: 500 }
    );
  }
}
