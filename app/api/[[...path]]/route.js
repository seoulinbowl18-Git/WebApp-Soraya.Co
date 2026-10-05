export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGO_URL = process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME || 'soraya_co';

// Membaca API Key Komerc dari Vercel Environment Variables
const KOMERCE_SHIPPING_KEY = process.env.KOMERCE_SHIPPING_KEY || process.env.KOMERC_T_KEY || '';
const KOMERCE_PAYMENT_KEY = process.env.KOMERCE_PAYMENT_KEY || process.env.KOMERC_G_KEY || '';

let cachedClient = null;
let cachedDb = null;

// Data Produk Fallback / Dummy jika MongoDB tidak terkoneksi atau kosong
const DUMMY_PRODUCTS = [
  {
    "id": "1",
    "name": "Soraya Blouse Linen Beige",
    "title": "Soraya Blouse Linen Beige",
    "price": 185000,
    "originalPrice": 245000,
    "discount": "24%",
    "category": "Blouse",
    "weight_grams": 220,
    "dimensions": "3cm x 3cm x 3cm",
    "image": "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=60",
    "description": "Blouse linen premium dengan potongan minimalis dan nyaman untuk penggunaan sehari-hari.",
    "variants": [
      {
        "sku": "SBL-001",
        "name": "Beige",
        "stock": 45,
        "size": "All Size (Fit L)"
      }
    ]
  },
  {
    "id": "2",
    "name": "Atasan Katun Hitam Minimal",
    "title": "Atasan Katun Hitam Minimal",
    "price": 165000,
    "originalPrice": 199000,
    "discount": "17%",
    "category": "Atasan (Top)",
    "weight_grams": 200,
    "dimensions": "3cm x 3cm x 3cm",
    "image": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop&q=60",
    "description": "Atasan katun hitam sejuk dengan detail kerah minimalis elegan.",
    "variants": [
      {
        "sku": "AKH-002",
        "name": "Hitam",
        "stock": 20,
        "size": "L, XL"
      }
    ]
  },
  {
    "id": "3",
    "name": "Tunik Rayon Monokrom",
    "title": "Tunik Rayon Monokrom",
    "price": 215000,
    "originalPrice": 265000,
    "discount": "19%",
    "category": "Tunik Rayon",
    "weight_grams": 250,
    "dimensions": "3cm x 3cm x 3cm",
    "image": "https://images.unsplash.com/photo-1551803091-e20673f15770?w=800&auto=format&fit=crop&q=60",
    "description": "Tunik bahan rayon jatuh dan ringan dengan motif monokrom modern.",
    "variants": [
      {
        "sku": "TRM-003",
        "name": "Monokrom",
        "stock": 35,
        "size": "M, L"
      }
    ]
  },
  {
    "id": "4",
    "name": "Gamis Maxy Elegant Noir",
    "title": "Gamis Maxy Elegant Noir",
    "price": 345000,
    "originalPrice": 425000,
    "discount": "18%",
    "category": "Gamis Maxy",
    "weight_grams": 380,
    "dimensions": "3cm x 3cm x 3cm",
    "image": "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&auto=format&fit=crop&q=60",
    "description": "Gamis maxy anggun dengan aksen pita di pinggang dan bahan satin silk premium.",
    "variants": [
      {
        "sku": "GME-004",
        "name": "Noir Black",
        "stock": 15,
        "size": "All Size"
      }
    ]
  },
  {
    "id": "5",
    "name": "Midi Dress Rayon Polos",
    "title": "Midi Dress Rayon Polos",
    "price": 145000,
    "originalPrice": 179000,
    "discount": "19%",
    "category": "Midi Dress",
    "weight_grams": 280,
    "dimensions": "3cm x 3cm x 3cm",
    "image": "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&auto=format&fit=crop&q=60",
    "description": "Model midi, cocok acara formal maupun santai",
    "variants": [
      {
        "sku": "MDR-005",
        "name": "Default",
        "stock": 25,
        "size": "All Size"
      }
    ]
  },
  {
    "id": "6",
    "name": "Setelan Kulot Rayon",
    "title": "Setelan Kulot Rayon",
    "price": 175000,
    "originalPrice": 210000,
    "discount": "16%",
    "category": "Setelan",
    "weight_grams": 400,
    "dimensions": "3cm x 3cm x 3cm",
    "image": "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&auto=format&fit=crop&q=60",
    "description": "Set atasan + kulot, bahan rayon premium",
    "variants": [
      {
        "sku": "SKR-006",
        "name": "Default",
        "stock": 30,
        "size": "L, XL"
      }
    ]
  },
  {
    "id": "7",
    "name": "Piyama Set Katun Motif",
    "title": "Piyama Set Katun Motif",
    "price": 99000,
    "originalPrice": 125000,
    "discount": "20%",
    "category": "Pyajamas",
    "weight_grams": 300,
    "dimensions": "3cm x 3cm x 3cm",
    "image": "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=60",
    "description": "Piyama set atasan + celana, bahan katun lembut",
    "variants": [
      {
        "sku": "PSK-007",
        "name": "Default",
        "stock": 50,
        "size": "All Size"
      }
    ]
  },
  {
    "id": "8",
    "name": "OVERSIZE BLOUSE MOTIF - ATASAN RAYON",
    "title": "OVERSIZE BLOUSE MOTIF - ATASAN RAYON",
    "price": 79000,
    "originalPrice": 99000,
    "discount": "20%",
    "category": "Atasan (Top)",
    "weight_grams": 250,
    "dimensions": "3cm x 3cm x 3cm",
    "image": "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=60",
    "description": "KEMEJA OVERSIZE Bahan Rayon Uniqlo, LD 130 cm",
    "variants": [
      {
        "sku": "TRM-008",
        "name": "MIKA GREY",
        "stock": 50,
        "size": "One Size"
      }
    ]
  }
];

async function getDb() {
  if (!MONGO_URL) return null;
  if (cachedDb) return cachedDb;
  try {
    if (!cachedClient) {
      cachedClient = new MongoClient(MONGO_URL, { connectTimeoutMS: 3000, socketTimeoutMS: 3000 });
      await cachedClient.connect();
    }
    cachedDb = cachedClient.db(DB_NAME);
    return cachedDb;
  } catch (err) {
    console.warn('Database connection skipped, using dummy fallback:', err.message);
    return null;
  }
}

// Handler GET Route
export async function GET(req, { params }) {
  const resolvedParams = await params;
  const path = resolvedParams?.path || [];
  const fullPath = path.join('/');

  const db = await getDb();

  // 1. Single Product Detail: GET /api/products/[id]
  if (path.length >= 2 && path[path.length - 2] === 'products') {
    const prodId = path[path.length - 1];
    let prod = null;
    if (db) {
      prod = await db.collection('products').findOne({ id: String(prodId) });
    }
    if (!prod) {
      prod = DUMMY_PRODUCTS.find((p) => String(p.id) === String(prodId)) || DUMMY_PRODUCTS[0];
    }
    return NextResponse.json(prod);
  }

  // 2. Affiliate Detail: GET /api/affiliate/[code]
  if (path.length >= 2 && path[path.length - 2] === 'affiliate') {
    const code = path[path.length - 1];
    let aff = null;
    if (db) {
      aff = await db.collection('affiliates').findOne({ code });
    }
    return NextResponse.json({
      success: true,
      affiliate: aff || { code, name: 'Mitra Soraya', commissionPct: 10 }
    });
  }

  // 3. Products List: GET /api/products
  let products = [];
  if (db) {
    try {
      products = await db.collection('products').find({}).toArray();
    } catch (e) {
      products = [];
    }
  }
  if (!products || products.length === 0) {
    products = DUMMY_PRODUCTS;
  }

  // Return objek dengan array `items` dan array murni agar aman di semua komponen frontend
  return NextResponse.json(
    Object.assign([...products], { items: products, products })
  );
}

// Handler POST Route
export async function POST(req, { params }) {
  const resolvedParams = await params;
  const path = resolvedParams?.path || [];
  const endpoint = path.join('/');

  if (endpoint.includes('auth') || endpoint.includes('otp') || endpoint.includes('login')) {
    return NextResponse.json({
      success: true,
      message: 'Kode OTP berhasil dikirim (Sandbox Mode)',
      otp: '123456'
    });
  }

  return NextResponse.json({ error: 'Endpoint tidak ditemukan' }, { status: 404 });
}
