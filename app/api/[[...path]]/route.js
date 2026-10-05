export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

const DUMMY_PRODUCTS = [
  {
    id: "1",
    name: "Soraya Blouse Linen Beige",
    price: 185000,
    originalPrice: 245000,
    category: "Blouse",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=60",
    description: "Blouse linen premium dengan potongan minimalis dan nyaman."
  },
  {
    id: "2",
    name: "Atasan Katun Hitam Minimal",
    price: 165000,
    originalPrice: 199000,
    category: "Atasan (Top)",
    image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop&q=60",
    description: "Atasan katun hitam sejuk dengan detail kerah minimalis."
  },
  {
    id: "3",
    name: "Tunik Rayon Monokrom",
    price: 215000,
    originalPrice: 265000,
    category: "Tunik Rayon",
    image: "https://images.unsplash.com/photo-1551803091-e20673f15770?w=800&auto=format&fit=crop&q=60",
    description: "Tunik bahan rayon jatuh dan ringan."
  },
  {
    id: "4",
    name: "Gamis Maxy Elegant Noir",
    price: 345000,
    originalPrice: 425000,
    category: "Gamis Maxy",
    image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&auto=format&fit=crop&q=60",
    description: "Gamis maxy anggun bahan satin silk."
  }
];

export async function GET(req, { params }) {
  const resolvedParams = await params;
  const path = resolvedParams?.path || [];

  // Jika memanggil /api/products/[id]
  if (path.length >= 2 && path[0] === 'products') {
    const prodId = path[1];
    const prod = DUMMY_PRODUCTS.find((p) => String(p.id) === String(prodId)) || DUMMY_PRODUCTS[0];
    return NextResponse.json(prod);
  }

  // Jika memanggil /api/products
  return NextResponse.json({
    items: DUMMY_PRODUCTS,
    products: DUMMY_PRODUCTS
  });
}
