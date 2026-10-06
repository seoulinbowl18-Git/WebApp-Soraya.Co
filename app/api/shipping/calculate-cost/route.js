import { NextResponse } from 'next/server';

const getBase = () => {
  const isSandbox = (process.env.KOMERCE_IS_SANDBOX || 'true').toLowerCase() === 'true';
  return isSandbox
    ? 'https://api-sandbox.collaborator.komerce.id'
    : 'https://api.collaborator.komerce.id';
};

// POST /api/shipping/calculate-cost
// Body: { destinationDistrictId, weight, itemValue }
// Response shape: { options: [{ service, service_name, price, estimated_days }] }
export async function POST(request) {
  try {
    const body = await request.json();
    const { destinationDistrictId, weight = 1000, itemValue = 0 } = body;

    if (!destinationDistrictId) {
      return NextResponse.json(
        { success: false, message: 'destinationDistrictId wajib diisi', options: [] },
        { status: 400 }
      );
    }

    const apiKey = process.env.KOMERCE_SHIPPING_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: 'KOMERCE_SHIPPING_KEY belum di-set', options: [] },
        { status: 500 }
      );
    }

    const originId = process.env.KOMERCE_ORIGIN_ID || '574';
    const w = Math.max(500, Number(weight) || 1000);
    const qs = new URLSearchParams({
      origin: String(originId),
      destination: String(destinationDistrictId),
      weight: String(w),
      item_value: String(Number(itemValue) || 0),
      courier: 'jne:jnt:sicepat:pos:ninja:anteraja',
    }).toString();

    const resp = await fetch(`${getBase()}/tariff/api/v1/calculate?${qs}`, {
      method: 'GET',
      headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
    });

    const text = await resp.text();
    let data;
    try { data = JSON.parse(text); } catch {
      return NextResponse.json(
        { success: false, message: `Komerce balas non-JSON (HTTP ${resp.status})`, options: [] },
        { status: 502 }
      );
    }

    if (!resp.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data.message || (data.meta && data.meta.message) || `Gagal hitung ongkir (HTTP ${resp.status})`,
          options: [],
        },
        { status: resp.status }
      );
    }

    // Komerce response bisa dalam bentuk { data: { calculate_reguler: [...], calculate_cargo: [...] } }
    // atau array langsung — kita normalisasi semuanya menjadi { options: [...] }
    const raw = data.data || data;
    let flat = [];
    if (Array.isArray(raw)) {
      flat = raw;
    } else if (typeof raw === 'object' && raw) {
      for (const key of Object.keys(raw)) {
        if (Array.isArray(raw[key])) flat = flat.concat(raw[key]);
      }
    }

    const options = flat.map((r) => ({
      service: (r.shipping_name || r.courier_name || r.code || r.courier || '').toLowerCase(),
      service_name: r.service_name || r.service || r.shipping_type || '',
      price: Number(r.shipping_cost || r.price || r.tariff || 0),
      estimated_days: r.etd || r.etd_days || r.estimated_days || '',
      raw: r,
    })).filter((o) => o.price > 0);

    return NextResponse.json({ success: true, options });
  } catch (error) {
    console.error('shipping/calculate-cost error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal error', options: [] },
      { status: 500 }
    );
  }
}
