import { NextResponse } from 'next/server';

const PRODUCTS = [
  {
    id: '1',
    name: 'Soraya Blouse Linen Beige',
    price: 185000,
    originalPrice: 245000,
    category: 'Blouse',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=60',
    description: 'Blouse linen premium dengan potongan minimalis dan nyaman.',
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 25,
  },
  {
    id: '2',
    name: 'Atasan Katun Hitam Minimal',
    price: 165000,
    originalPrice: 199000,
    category: 'Atasan (Top)',
    image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop&q=60',
    description: 'Atasan katun hitam sejuk dengan detail kerah minimalis.',
    sizes: ['S', 'M', 'L'],
    stock: 20,
  },
  {
    id: '3',
    name: 'Tunik Rayon Monokrom',
    price: 215000,
    originalPrice: 265000,
    category: 'Tunik Rayon',
    image: 'https://images.unsplash.com/photo-1551803091-e20673f15770?w=800&auto=format&fit=crop&q=60',
    description: 'Tunik bahan rayon jatuh dan ringan.',
    sizes: ['M', 'L', 'XL'],
    stock: 15,
  },
];

// GET /api/products → list produk (array, bukan wrapper, supaya page.js bisa langsung Array.isArray cek)
export async function GET() {
  return NextResponse.json(PRODUCTS);
}
