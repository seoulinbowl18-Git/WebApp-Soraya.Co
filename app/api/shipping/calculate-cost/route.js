import { NextResponse } from 'next/server';
import { getFallbackRates } from '@/lib/shipping-fallback';

const getBase = () => {
  const isSandbox = (process.env.KOMERCE_IS_SANDBOX || 'true').toLowerCase() === 'true';
  return isSandbox
    ? 'https://api-sandbox.collaborator.komerce.id'
    : 'https://api.collaborator.komerce.id';
};

// POST /api/shipping/calculate-cost
// Body: { destinationDistrictId, weight, itemValue }
// Response: { success, options: [...], source: 'komerce'|'fallback' }
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

    const idStr = String(destinationDistrictId);

    // Jika destinasi dari fallback catalog (prefix LOCAL-), langsung pakai fallback rate
    if (idStr.startsWith('LOCAL-')) {
      const options = getFallbackRates(idStr, itemValue);
      return NextResponse.json({
        success: true,
        options,
        source: 'fallback',
        notice: 'Tarif estimasi dari katalog lokal (Komerce shipping belum aktif).',
      });
    }

    const apiKey = process.env.KOMERCE_SHIPPING_KEY;

    if (apiKey) {
      try {
        const originId = process.env.KOMERCE_ORIGIN_ID || '574';
        const w = Math.max(500, Number(weight) || 1000);
        const qs = new URLSearchParams({
          origin: String(originId),
          destination: idStr,
          weight: String(w),
          item_value: String(Number(itemValue) || 0),
          courier: 'jne:jnt:sicepat:pos:ninja:anteraja',
        }).toString();

        const resp = await fetch(`${getBase()}/tariff/api/v1/calculate?${qs}`, {
          method: 'GET',
          headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
        });

        const text = await resp.text();
        if (resp.ok) {
          try {
            const data = JSON.parse(text);
            const raw = data.data || data;
            let flat = [];
            if (Array.isArray(raw)) flat = raw;
            else if (typeof raw === 'object' && raw) {
              for (const k of Object.keys(raw)) if (Array.isArray(raw[k])) flat = flat.concat(raw[k]);
            }
            const options = flat.map((r) => ({
              service: (r.shipping_name || r.courier_name || r.code || r.courier || '').toLowerCase(),
              service_name: r.service_name || r.service || r.shipping_type || '',
              price: Number(r.shipping_cost || r.price || r.tariff || 0),
              estimated_days: r.etd || r.etd_days || r.estimated_days || '',
            })).filter((o) => o.price > 0);

            if (options.length > 0) {
              return NextResponse.json({ success: true, options, source: 'komerce' });
            }
          } catch { /* fallback */ }
        }
        // 401/404 dari Komerce → fallback silently
      } catch { /* network err → fallback */ }
    }

    // Fallback flat rate — gunakan zona Jabodetabek sebagai default karena ID bukan LOCAL-
    // (angka ID Komerce biasa, user bisa test dengan tarif default)
    const defaultOptions = [
      { service: 'jne', service_name: 'JNE REG', estimated_days: '2-3', price: 18000 },
      { service: 'jnt', service_name: 'J&T Express', estimated_days: '2-3', price: 17000 },
      { service: 'sicepat', service_name: 'SiCepat REG', estimated_days: '2-3', price: 16000 },
      { service: 'anteraja', service_name: 'AnterAja Reguler', estimated_days: '2-3', price: 15500 },
    ];
    const insurance = itemValue > 500000 ? Math.round(itemValue * 0.002) : 0;
    const options = defaultOptions.map((o) => ({ ...o, price: o.price + insurance }));

    return NextResponse.json({
      success: true,
      options,
      source: 'fallback',
      notice: 'Tarif estimasi dari katalog lokal (Komerce shipping belum aktif).',
    });
  } catch (error) {
    console.error('shipping/calculate-cost error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal error', options: [] },
      { status: 500 }
    );
  }
}
