import { NextResponse } from 'next/server';

const getBase = () => {
  const isSandbox = (process.env.KOMERCE_IS_SANDBOX || 'true').toLowerCase() === 'true';
  return isSandbox
    ? 'https://api-sandbox.collaborator.komerce.id'
    : 'https://api.collaborator.komerce.id';
};

// GET /api/shipping/search-location?search=jakarta
// Response shape used by CartDrawer: { items: [{ id, text }] }
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = (searchParams.get('search') || searchParams.get('keyword') || '').trim();

    if (keyword.length < 3) {
      return NextResponse.json({ success: true, items: [] });
    }

    const apiKey = process.env.KOMERCE_SHIPPING_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: 'KOMERCE_SHIPPING_KEY belum di-set', items: [] },
        { status: 500 }
      );
    }

    const resp = await fetch(
      `${getBase()}/tariff/api/v1/destination?keyword=${encodeURIComponent(keyword)}`,
      { method: 'GET', headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' } }
    );

    const text = await resp.text();
    let data;
    try { data = JSON.parse(text); } catch {
      return NextResponse.json(
        { success: false, message: `Komerce balas non-JSON (HTTP ${resp.status})`, items: [] },
        { status: 502 }
      );
    }

    if (!resp.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data.message || (data.meta && data.meta.message) || `Gagal cari area (HTTP ${resp.status})`,
          items: [],
        },
        { status: resp.status }
      );
    }

    const list = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
    const items = list.map((it) => {
      const parts = [
        it.subdistrict_name || it.name || it.label,
        it.city_name,
        it.province_name,
      ].filter(Boolean);
      return {
        id: String(it.id || it.subdistrict_id || it.destination_id || ''),
        text: parts.join(', '),
        raw: it,
      };
    }).filter((x) => x.id);

    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error('shipping/search-location error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal error', items: [] },
      { status: 500 }
    );
  }
}
