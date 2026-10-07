import { NextResponse } from 'next/server';
import { store, checkAdmin } from '@/lib/store';

function sanitizeVariants(v) {
  if (!Array.isArray(v)) return undefined;
  return v.filter((x) => x && (x.name || x.sku)).map((x) => ({
    sku: String(x.sku || '').trim(),
    name: String(x.name || '').trim(),
    image: String(x.image || '').trim(),
    stock: Math.max(0, Math.round(Number(x.stock) || 0)),
  }));
}
function sanitizeSizes(s) {
  if (!Array.isArray(s)) return undefined;
  const cleaned = s.map((x) => String(x || '').trim()).filter(Boolean);
  return cleaned.length ? cleaned : ['All Size'];
}
function sanitizeDimensions(d) {
  if (!d || typeof d !== 'object') return undefined;
  return {
    length: Math.max(0, Math.round(Number(d.length) || 0)),
    width: Math.max(0, Math.round(Number(d.width) || 0)),
    height: Math.max(0, Math.round(Number(d.height) || 0)),
  };
}

export async function POST(request, { params }) {
  if (!checkAdmin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const body = await request.json();
  const idx = store.catalog.findIndex((p) => String(p.id) === String(id));
  if (idx < 0) return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
  const prev = store.catalog[idx];
  const sizes = sanitizeSizes(body.sizes);
  const variants = sanitizeVariants(body.variants);
  const dims = sanitizeDimensions(body.dimensions);
  const updated = {
    ...prev,
    ...body,
    price: body.price !== undefined ? Math.round(Number(body.price) || 0) : prev.price,
    originalPrice: body.originalPrice !== undefined ? Math.round(Number(body.originalPrice) || 0) : prev.originalPrice,
    stock: body.stock !== undefined ? Math.max(0, Math.round(Number(body.stock))) : prev.stock,
    weight: body.weight !== undefined ? Math.max(100, Math.round(Number(body.weight))) : prev.weight,
    commissionPct: body.commissionPct !== undefined ? Math.max(0, Math.min(50, Number(body.commissionPct))) : (prev.commissionPct ?? 10),
    sizes: sizes !== undefined ? sizes : prev.sizes,
    variants: variants !== undefined ? variants : prev.variants,
    dimensions: dims !== undefined ? dims : (prev.dimensions || { length: 0, width: 0, height: 0 }),
    description: body.description !== undefined ? String(body.description) : prev.description,
    id: prev.id,
  };
  store.catalog[idx] = updated;
  return NextResponse.json({ success: true, product: updated });
}

export async function DELETE(request, { params }) {
  if (!checkAdmin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const idx = store.catalog.findIndex((p) => String(p.id) === String(id));
  if (idx < 0) return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
  const removed = store.catalog.splice(idx, 1)[0];
  return NextResponse.json({ success: true, removed });
}
