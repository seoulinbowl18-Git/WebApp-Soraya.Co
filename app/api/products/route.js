import { NextResponse } from 'next/server';
import { CATALOG } from '@/lib/catalog';

// GET /api/products → list produk (array)
export async function GET() {
  return NextResponse.json(CATALOG);
}
