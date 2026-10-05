import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { destination, weight } = body; // destination ID kecamatan & berat barang dalam gram

    const apiKey = process.env.KOMERCE_SHIPPING_KEY || process.env.KOMERCE_SANDBOX_KEY;

    // Mengirim permintaan kalkulasi ongkir ke Komerce API Sandbox
    const response = await fetch('https://api-sandbox.collaborator.komerce.id/tariff/api/v1/calculate', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        destination: destination,
        weight: weight || 1000, // Default 1kg (1000gr) jika tidak diisi
        courier: 'jne,jnt,sicepat,pos' // Opsi kurir yang ingin ditampilkan
      })
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
