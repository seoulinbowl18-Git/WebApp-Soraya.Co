export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGO_URL = process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME || 'soraya_co';

const KOMERCE_SHIPPING_KEY = process.env.KOMERCE_SHIPPING_KEY;
const KOMERCE_PAYMENT_KEY = process.env.KOMERCE_PAYMENT_KEY;

let cachedClient = null;
let cachedDb = null;

// Data Produk Fallback / Dummy jika MongoDB tidak terkoneksi atau kosong
const DUMMY_PRODUCTS = [
  {
    id: '1',
    name: 'Gamis Maxy Premium Soraya',
    title: 'Gamis Maxy Premium Soraya',
    price: 185000,
    category: 'Gamis Maxy',
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80',
    description: 'Gamis bahan rayon premium lembut, adem, dan sangat nyaman dipakai seharian.'
  },
  {
    id: '2',
    name: 'Blouse Style Korean Soraya',
    title: 'Blouse Style Korean Soraya',
    price: 125000,
    category: 'Blouse',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80',
    description: 'Blouse atasan kasual elegan dengan potongan minimalis ala Korea.'
  },
  {
    id: '3',
    name: 'Tunik Rayon Polos Premium',
    title: 'Tunik Rayon Polos Premium',
    price: 145000,
    category: 'Tunik Rayon',
    image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=600&q=80',
    description: 'Tunik rayon simpel dengan pilihan warna kekinian yang manis.'
  },
  {
    id: '4',
    name: 'Atasan Casual Modest',
    title: 'Atasan Casual Modest',
    price: 110000,
    category: 'Atasan (Top)',
    image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=600&q=80',
    description: 'Atasan simpel nan elegan cocok untuk kuliah, kerja, maupun jalan-jalan.'
  }
];

async function getDb() {
  if (!MONGO_URL) return null;
  if (cachedDb) return cachedDb;
  try {
    if (!cachedClient) {
      cachedClient = new MongoClient(MONGO_URL, { connectTimeoutMS: 5000, socketTimeoutMS: 5000 });
      await cachedClient.connect();
    }
    cachedDb = cachedClient.db(DB_NAME);
    return cachedDb;
  } catch (err) {
    console.warn('Database connection skipped, using dummy fallback:', err.message);
    return null;
  }
}

// 1. Hitung Ongkir Komerce
async function calculateKomerceShipping(destination, weightGrams, courier) {
  try {
    const res = await fetch('https://api.komerce.id/v1/shipping/cost', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'key': KOMERCE_SHIPPING_KEY || ''
      },
      body: JSON.stringify({
        destination: destination,
        weight: weightGrams || 1000,
        courier: courier || 'jne'
      })
    });
    const data = await res.json();
    return data.data || [];
  } catch (err) {
    console.error('Komerce Shipping Error:', err);
    return [];
  }
}

// 2. Generate QRIS Komerce
async function createKomerceQris(orderId, amount, customerName, customerEmail) {
  try {
    const res = await fetch('https://api.komerce.id/v1/payment/qrisly/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': KOMERCE_PAYMENT_KEY || ''
      },
      body: JSON.stringify({
        partner_order_id: orderId,
        amount: Number(amount),
        customer_name: customerName || 'Pelanggan Soraya',
        customer_email: customerEmail || 'customer@soraya.co',
        description: `Pembayaran Order #${orderId}`
      })
    });
    const data = await res.json();
    return {
      success: true,
      qrisUrl: data.qr_code_url || data.qris_string || 'https://via.placeholder.com/300x300.png?text=QRIS+Dummy+Sandbox',
      invoiceUrl: data.invoice_url || '#'
    };
  } catch (err) {
    console.error('Komerce QRIS Error:', err);
    return {
      success: true,
      qrisUrl: 'https://via.placeholder.com/300x300.png?text=QRIS+Dummy+Sandbox',
      invoiceUrl: '#'
    };
  }
}

async function handleCheckout(req) {
  try {
    const body = await req.json();
    const { items, customer, address, shippingMethod, shippingCost, refCode } = body || {};

    if (!items || !items.length) {
      return NextResponse.json({ error: 'Keranjang kosong' }, { status: 400 });
    }

    const db = await getDb();
    let subtotal = 0;
    let affiliateValid = false;

    if (db && refCode) {
      const aff = await db.collection('affiliates').findOne({ code: refCode });
      if (aff) affiliateValid = true;
    }

    const resolved = [];
    for (const it of items) {
      let p = null;
      if (db) {
        p = await db.collection('products').findOne({ id: it.id });
      }
      if (!p) {
        p = DUMMY_PRODUCTS.find((dp) => dp.id === String(it.id));
      }

      const unitPrice = Number(it.price || p?.price || 0);
      const lineTotal = unitPrice * (it.qty || 1);
      subtotal += lineTotal;

      resolved.push({
        id: String(it.id),
        name: it.name || p?.name || p?.title || 'Produk Soraya',
        price: unitPrice,
        qty: it.qty || 1,
        image: it.image || p?.image || ''
      });
    }

    const finalShippingCost = Number(shippingCost || 0);
    const grandTotal = subtotal + finalShippingCost;
    const orderId = `SRC-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const komercePayment = await createKomerceQris(
      orderId,
      grandTotal,
      customer?.name,
      customer?.email
    );

    const orderDoc = {
      orderId,
      items: resolved,
      subtotal,
      shippingCost: finalShippingCost,
      shippingMethod: shippingMethod || 'standard',
      grandTotal,
      customer: customer || {},
      address: address || {},
      status: 'pending_payment',
      paymentMethod: 'qris_komerce',
      qrisUrl: komercePayment.qrisUrl,
      invoiceUrl: komercePayment.invoiceUrl,
      refCode: affiliateValid ? refCode : null,
      createdAt: new Date()
    };

    if (db) {
      await db.collection('orders').insertOne(orderDoc);
    }

    return NextResponse.json({
      success: true,
      orderId,
      grandTotal,
      qrisUrl: komercePayment.qrisUrl,
      invoiceUrl: komercePayment.invoiceUrl,
      message: 'Pesanan berhasil dibuat, silakan lakukan pembayaran QRIS'
    });
  } catch (err) {
    console.error('Checkout error:', err);
    return NextResponse.json({ error: 'Gagal memproses checkout', details: err.message }, { status: 500 });
  }
}

// Handler GET Route
export async function GET(req, { params }) {
  const path = params?.path || [];
  const fullPath = path.join('/');

  const db = await getDb();

  // Handle get single product by ID (Contoh: /api/products/1 atau /api/soraya/products/1)
  if (path.length >= 2 && path[path.length - 2] === 'products') {
    const prodId = path[path.length - 1];
    let prod = null;
    if (db) {
      prod = await db.collection('products').findOne({ id: prodId });
    }
    if (!prod) {
      prod = DUMMY_PRODUCTS.find((p) => p.id === prodId) || DUMMY_PRODUCTS[0];
    }
    return NextResponse.json(prod);
  }

  // Handle list products (Contoh: /api/products, /api/soraya/products, /api)
  if (fullPath.includes('products') || fullPath === '' || fullPath === 'soraya' || fullPath === 'api') {
    let products = [];
    if (db) {
      products = await db.collection('products').find({}).toArray();
    }
    if (!products || products.length === 0) {
      products = DUMMY_PRODUCTS;
    }
    return NextResponse.json(products);
  }

  return NextResponse.json(DUMMY_PRODUCTS);
}

// Handler POST Route
export async function POST(req, { params }) {
  const path = params?.path || [];
  const endpoint = path.join('/');

  // 1. Auth & OTP Dummy Handler
  if (endpoint.includes('auth') || endpoint.includes('otp') || endpoint.includes('login')) {
    return NextResponse.json({
      success: true,
      message: 'Kode OTP berhasil dikirim (Sandbox Mode)',
      otp: '123456'
    });
  }

  // 2. Checkout Handler
  if (endpoint.includes('checkout')) {
    return handleCheckout(req);
  }

  // 3. Shipping Cost Handler (Komerce)
  if (endpoint.includes('shipping')) {
    try {
      const body = await req.json();
      const costs = await calculateKomerceShipping(body.destination, body.weight, body.courier);
      return NextResponse.json({ success: true, costs });
    } catch {
      return NextResponse.json({ error: 'Gagal menghitung ongkir Komerce' }, { status: 400 });
    }
  }

  return NextResponse.json({ error: 'Endpoint tidak ditemukan' }, { status: 404 });
}
