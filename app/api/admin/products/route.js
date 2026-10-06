import { NextResponse } from 'next/server';
import { store, checkAdmin } from '@/lib/store';

// GET list, POST create
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
      image: body.image || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=60',
      description: body.description || '',
      sizes: Array.isArray(body.sizes) ? body.sizes : ['All Size'],
      stock: Math.max(0, Math.round(Number(body.stock) || 10)),
      weight: Math.max(100, Math.round(Number(body.weight) || 300)),
      sku: body.sku || '',
      commissionPct: Number(body.commissionPct) || 10,
      variants: Array.isArray(body.variants) ? body.variants : [],
    };
    store.catalog.push(product);
    return NextResponse.json({ success: true, product });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
