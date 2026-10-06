import { NextResponse } from 'next/server';
import { store, checkAdmin } from '@/lib/store';

// POST update, DELETE remove
export async function POST(request, { params }) {
  if (!checkAdmin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const body = await request.json();
  const idx = store.catalog.findIndex((p) => String(p.id) === String(id));
  if (idx < 0) return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
  const prev = store.catalog[idx];
  const updated = {
    ...prev,
    ...body,
    price: body.price !== undefined ? Math.round(Number(body.price) || 0) : prev.price,
    originalPrice: body.originalPrice !== undefined ? Math.round(Number(body.originalPrice) || 0) : prev.originalPrice,
    stock: body.stock !== undefined ? Math.max(0, Math.round(Number(body.stock))) : prev.stock,
    weight: body.weight !== undefined ? Math.max(100, Math.round(Number(body.weight))) : prev.weight,
    commissionPct: body.commissionPct !== undefined ? Math.max(0, Math.min(50, Number(body.commissionPct))) : (prev.commissionPct ?? 10),
    sizes: Array.isArray(body.sizes) ? body.sizes : prev.sizes,
    variants: Array.isArray(body.variants) ? body.variants : prev.variants,
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
