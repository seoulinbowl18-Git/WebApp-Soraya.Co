import { NextResponse } from 'next/server';
import { CATALOG } from '@/lib/catalog';

// GET /api/products/[id] → single product
export async function GET(request, { params }) {
  const { id } = await params;
  const product = CATALOG.find((p) => String(p.id) === String(id));
  if (!product) {
    return NextResponse.json(
      { success: false, error: 'Produk tidak ditemukan' },
      { status: 404 }
    );
  }
  return NextResponse.json(product);
}
