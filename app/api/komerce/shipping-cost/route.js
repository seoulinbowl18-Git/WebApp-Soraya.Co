import { NextResponse } from 'next/server';

const getShippingBaseUrl = () => {
  const isSandbox = (process.env.KOMERCE_IS_SANDBOX || 'true').toLowerCase() === 'true';
  return isSandbox
    ? 'https://api-sandbox.collaborator.komerce.id'
    : 'https://api.collaborator.komerce.id';
};

export async function POST(request) {
  try {
    const body = await request.json();
    const { destination, weight, origin } = body;

    if (!destination) {
      return NextResponse.json(
        { success: false, message: 'destination (ID kecamatan) wajib diisi' },
        { status: 400 }
      );
    }

    const apiKey = process.env.KOMERCE_SHIPPING_KEY || process.env.KOMERCE_SANDBOX_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: 'KOMERCE_SHIPPING_KEY belum di-set' },
        { status: 500 }
      );
    }

    const baseUrl = getShippingBaseUrl();
    const originId = origin || process.env.KOMERCE_ORIGIN_ID || '574';
    const qs = new URLSearchParams({
      origin: String(originId),
      destination: String(destination),
      weight: String(weight || 1000),
      item_value: String(body.item_value || 0),
      courier: 'jne:jnt:sicepat:pos:ninja:anteraja',
    }).toString();

    const response = await fetch(`${baseUrl}/tariff/api/v1/calculate?${qs}`, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    // Read response as text first, then try to parse as JSON
    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      // If JSON parsing fails, return a clean error
      return NextResponse.json(
        { 
          success: false, 
          message: response.status === 401 
            ? 'Unauthenticated - KOMERCE_SHIPPING_KEY tidak valid atau tidak aktif' 
            : 'Gagal hitung ongkir - response tidak valid',
          statusCode: response.status,
          raw: responseText.substring(0, 200) // Only include first 200 chars
        },
        { status: response.status }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || 'Gagal hitung ongkir', raw: data },
        { status: response.status }
      );
    }
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
