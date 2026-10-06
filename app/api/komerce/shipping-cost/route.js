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
    const payload = {
      destination,
      weight: weight || 1000, // default 1kg
      courier: 'jne,jnt,sicepat,pos,ninja,anteraja',
    };
    // Origin opsional – kalau user set KOMERCE_ORIGIN_ID atau origin dikirim dari client
    const originId = origin || process.env.KOMERCE_ORIGIN_ID;
    if (originId) payload.origin = originId;

    const response = await fetch(`${baseUrl}/tariff/api/v1/calculate`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
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
