import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

// GET /api/products
// Return object dengan 2 shape agar kompatibel dengan homepage (d.products) & affiliate (d.items)
export async function GET() {
  return NextResponse.json({ items: store.catalog, products: store.catalog, data: store.catalog });
}
