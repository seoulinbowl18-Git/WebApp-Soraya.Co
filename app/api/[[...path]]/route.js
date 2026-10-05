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
    "title": "OVERSIZE BLOUSE MOTIF - ATASAN RAYON FULL KANCING JUMBO / KEMEJA",
    ...
  {
    "title": "OVERSIZE BLOUSE MOTIF - ATASAN RAYON FULL KANCING JUMBO / KEMEJA",
    "category": "Atasan (Top)",
    "price": 79000,
    "weight_grams": 250,
    "dimensions": "3cm x 3cm x 3cm",
    "description": "KEMEJA OVERSIZE\nBahan : Rayon Uniqlo\nLd baju : 130 cm\nPj baju depan : -+70 cm\nPj baju Belakang : -+ 80 cm\nLingkar ketiak : -+ 55 cm",
    "variants": [
      {"sku": "TRM-004-1", "name": "MIKA GREY", "stock": 50, "size": "One Size"},
      {"sku": "TRM-004-2", "name": "MIKA DUSTY", "stock": 50, "size": "One Size"},
      {"sku": "TRM-004-3", "name": "NONA MAGENTA", "stock": 50, "size": "One Size"},
      {"sku": "TRM-004-4", "name": "WILONA", "stock": 50, "size": "One Size"},
      {"sku": "TRM-004-5", "name": "POLKA HITAM", "stock": 50, "size": "One Size"},
      {"sku": "TRM-004-6", "name": "AISHA", "stock": 50, "size": "One Size"},
      {"sku": "TRM-004-7", "name": "FREESIA", "stock": 50, "size": "One Size"},
      {"sku": "TRM-004-8", "name": "SHOFIA", "stock": 50, "size": "One Size"},
      {"sku": "TRM-004-9", "name": "LYODRA", "stock": 50, "size": "One Size"},
      {"sku": "TRM-004-10", "name": "MAWAR", "stock": 50, "size": "One Size"},
      {"sku": "TRM-004-11", "name": "LEONA", "stock": 50, "size": "One Size"},
      {"sku": "TRM-004-12", "name": "TAMARA", "stock": 50, "size": "One Size"},
      {"sku": "TRM-004-13", "name": "ALANA", "stock": 50, "size": "One Size"},
      {"sku": "TRM-004-14", "name": "LILA", "stock": 50, "size": "One Size"},
      {"sku": "TRM-004-15", "name": "SELINA", "stock": 50, "size": "One Size"},
      {"sku": "TRM-004-16", "name": "KAMILA", "stock": 50, "size": "One Size"},
      {"sku": "TRM-004-17", "name": "YURA", "stock": 50, "size": "One Size"},
      {"sku": "TRM-004-18", "name": "SARAH", "stock": 50, "size": "One Size"},
      {"sku": "TRM-004-19", "name": "MARBEL", "stock": 50, "size": "One Size"},
      {"sku": "TRM-004-20", "name": "NAOMI", "stock": 50, "size": "One Size"},
      {"sku": "TRM-004-21", "name": "FEROSA", "stock": 50, "size": "One Size"},
      {"sku": "TRM-004-22", "name": "SORA CREAM", "stock": 50, "size": "One Size"},
      {"sku": "TRM-004-23", "name": "IRIS", "stock": 50, "size": "One Size"},
      {"sku": "TRM-004-24", "name": "MARLEN", "stock": 50, "size": "One Size"},
      {"sku": "TRM-004-25", "name": "MESYA", "stock": 50, "size": "One Size"},
      {"sku": "TRM-004-26", "name": "CLARA", "stock": 50, "size": "One Size"},
      {"sku": "TRM-004-27", "name": "AGNES", "stock": 50, "size": "One Size"},
      {"sku": "TRM-004-28", "name": "CUNDA", "stock": 50, "size": "One Size"},
      {"sku": "TRM-004-29", "name": "AMEENA", "stock": 50, "size": "One Size"},
      {"sku": "TRM-004-30", "name": "SANIA", "stock": 50, "size": "One Size"},
      {"sku": "TRM-004-31", "name": "MARIGOLD", "stock": 50, "size": "One Size"},
      {"sku": "TRM-004-32", "name": "SUNFLOWER", "stock": 50, "size": "One Size"},
      {"sku": "TRM-004-33", "name": "TULIP", "stock": 50, "size": "One Size"},
      {"sku": "TRM-004-34", "name": "RIYUKI", "stock": 50, "size": "One Size"},
      {"sku": "TRM-004-35", "name": "ALUNA", "stock": 50, "size": "One Size"}
    ]
  },
  {
    "title": "ALYSA BLOUSE ATASAN WANITA RAYON MOTIF",
    "category": "Blouse",
    "price": 89000,
    "weight_grams": 200,
    "dimensions": "3cm x 3cm x 3cm",
    "description": "Bahan : Rayon Premium\nTersedia 3 ukuran :\n- Standar : LD 110 CM\n- Jumbo : LD 120 CM\n- Super Jumbo : LD 130 CM\nModel : Kerah Shanghai\nPergelangan Tangan Model Terompet",
    "variants": [
      {"sku": "BKD-001", "name": "LB. ALYSA", "stock": 60, "sizes": ["L", "XL", "XXL"]},
      {"sku": "BKD-002", "name": "LB. ERICA", "stock": 60, "sizes": ["L", "XL", "XXL"]},
      {"sku": "BKD-003", "name": "LB. LAVENDER", "stock": 60, "sizes": ["L", "XL", "XXL"]},
      {"sku": "BKD-004", "name": "LB. TIARA", "stock": 60, "sizes": ["L", "XL", "XXL"]},
      {"sku": "BKD-005", "name": "LB. LUNA BLACK", "stock": 60, "sizes": ["L", "XL", "XXL"]},
      {"sku": "BKD-006", "name": "LB. SASKIA", "stock": 60, "sizes": ["L", "XL", "XXL"]}
    ]
  }
]

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
