import { NextResponse } from 'next/server';
import { searchFallbackDistricts } from '@/lib/shipping-fallback';

const getBase = () => {
  const isSandbox = (process.env.KOMERCE_IS_SANDBOX || 'true').toLowerCase() === 'true';
  return isSandbox
    ? 'https://api-sandbox.collaborator.komerce.id'
    : 'https://api.collaborator.komerce.id';
};

// GET /api/shipping/search-location?search=jakarta
// Response: { success, items: [{ id, text, fallback? }], source: 'komerce'|'fallback' }
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = (searchParams.get('search') || searchParams.get('keyword') || '').trim();

    if (keyword.length < 3) {
      return NextResponse.json({ success: true, items: [], source: 'empty' });
    }

    const apiKey = process.env.KOMERCE_SHIPPING_KEY;

    // Coba Komerce dulu
    if (apiKey) {
      try {
        const resp = await fetch(
          `${getBase()}/tariff/api/v1/destination?keyword=${encodeURIComponent(keyword)}`,
          { method: 'GET', headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' } }
        );

        const text = await resp.text();
        if (resp.ok) {
          try {
            const data = JSON.parse(text);
            const list = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
            const items = list.map((it) => {
              const parts = [it.subdistrict_name || it.name || it.label, it.city_name, it.province_name].filter(Boolean);
              return {
                id: String(it.id || it.subdistrict_id || it.destination_id || ''),
                text: parts.join(', '),
                raw: it,
              };
            }).filter((x) => x.id);

            if (items.length > 0) {
              return NextResponse.json({ success: true, items, source: 'komerce' });
            }
            // Jika Komerce 200 tapi kosong → fallback
          } catch {
            // JSON parse fail → fallback
          }
        }
        // 401 / 404 / 5xx dari Komerce → fallback silently
      } catch {
        // Network error → fallback
      }
    }

    // Fallback ke data lokal
    const items = searchFallbackDistricts(keyword);
    return NextResponse.json({
      success: true,
      items,
      source: 'fallback',
      notice: items.length > 0
        ? 'Daftar area dari katalog lokal (Komerce shipping belum aktif).'
        : 'Area tidak ditemukan. Coba kata kunci lain.',
    });
  } catch (error) {
    console.error('shipping/search-location error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal error', items: [] },
      { status: 500 }
    );
  }
}
