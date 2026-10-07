import { NextResponse } from 'next/server';
import { store, checkAdmin } from '@/lib/store';

function sanitizeVariants(v) {
  if (!Array.isArray(v)) return [];
  return v.filter((x) => x && (x.name || x.sku)).map((x) => ({
    sku: String(x.sku || '').trim(),
    name: String(x.name || '').trim(),
    image: String(x.image || '').trim(),
    stock: Math.max(0, Math.round(Number(x.stock) || 0)),
  }));
}
function sanitizeSizes(s) {
  if (!Array.isArray(s)) return ['All Size'];
  const cleaned = s.map((x) => String(x || '').trim()).filter(Boolean);
  return cleaned.length ? cleaned : ['All Size'];
}
function sanitizeDimensions(d) {
  if (!d || typeof d !== 'object') return { length: 0, width: 0, height: 0 };
  return {
    length: Math.max(0, Math.round(Number(d.length) || 0)),
    width: Math.max(0, Math.round(Number(d.width) || 0)),
    height: Math.max(0, Math.round(Number(d.height) || 0)),
  };
}

export async function GET(request) {
  if (!checkAdmin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return NextResponse.json({ items: store.catalog });
}

export async function POST(request) {
  if (!checkAdmin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const body = await request.json();
    if (!body.name || !body.price) return NextResponse.json({ error: 'name & price wajib' }, { status: 400 });
    const nextId = String((Math.max(0, ...store.catalog.map((p) => Number(p.id) || 0)) + 1));
    const product = {
      id: nextId,
      name: String(body.name),
      price: Math.round(Number(body.price) || 0),
      originalPrice: Math.round(Number(body.originalPrice) || Number(body.price) * 1.3),
      category: body.category || 'Blouse',
      image: body.image || '',
      description: String(body.description || ''),
      sizes: sanitizeSizes(body.sizes),
      stock: Math.max(0, Math.round(Number(body.stock) || 10)),
      weight: Math.max(100, Math.round(Number(body.weight) || 300)),
      dimensions: sanitizeDimensions(body.dimensions),
      sku: String(body.sku || ''),
      commissionPct: Math.max(0, Math.min(50, Number(body.commissionPct) || 10)),
      variants: sanitizeVariants(body.variants),
    };
    store.catalog.push(product);
    return NextResponse.json({ success: true, product });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
