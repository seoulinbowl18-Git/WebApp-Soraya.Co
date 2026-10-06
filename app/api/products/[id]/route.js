import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET(request, { params }) {
  const { id } = await params;
  const product = store.catalog.find((p) => String(p.id) === String(id));
  if (!product) {
    return NextResponse.json(
      { success: false, error: 'Produk tidak ditemukan' },
      { status: 404 }
    );
  }
  return NextResponse.json(product);
}
