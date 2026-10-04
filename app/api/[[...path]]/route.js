export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGO_URL = process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME || 'soraya_co';

const KOMERCE_SHIPPING_KEY = process.env.KOMERCE_SHIPPING_KEY;
const KOMERCE_PAYMENT_KEY = process.env.KOMERCE_PAYMENT_KEY;

let cachedClient = null;
let cachedDb = null;

async function getDb() {
  if (!MONGO_URL) return null;
  if (cachedDb) return cachedDb;
  if (!cachedClient) {
    cachedClient = new MongoClient(MONGO_URL, { connectTimeoutMS: 8000, socketTimeoutMS: 10000 });
    await cachedClient.connect();
  }
  cachedDb = cachedClient.db(DB_NAME);
  return cachedDb;
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
      qrisUrl: data.qr_code_url || data.qris_string,
      invoiceUrl: data.invoice_url
    };
  } catch (err) {
    console.error('Komerce QRIS Error:', err);
    return { success: false, error: err.message };
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
    let commission = 0;
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
        if (!p && typeof it.id === 'string' && it.id.includes(':::')) {
          const base = it.id.split(':::')[0];
          p = await db.collection('products').findOne({ id: base });
        }
      }
      
      const unitPrice = Number(it.price || p?.price || 0);
      const lineTotal = unitPrice * (it.qty || 1);
      subtotal += lineTotal;

      resolved.push({
        id: String(it.id),
        name: it.name || p?.name || 'Produk',
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
      qrisUrl: komercePayment.qrisUrl || null,
      invoiceUrl: komercePayment.invoiceUrl || null,
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

export async function GET(req, { params }) {
  const path = params?.path || [];
  const endpoint = path.join('/');

  if (endpoint === 'products') {
    try {
      const db = await getDb();
      if (!db) return NextResponse.json([]);
      const products = await db.collection('products').find({}).toArray();
      return NextResponse.json(products);
    } catch {
      return NextResponse.json([]);
    }
  }

  return NextResponse.json({ error: 'Endpoint tidak ditemukan' }, { status: 404 });
}

export async function POST(req, { params }) {
  const path = params?.path || [];
  const endpoint = path.join('/');

  // --- TAMBAHKAN BLOK INI DARI SINI ---
  if (endpoint.includes('auth') || endpoint.includes('otp') || endpoint.includes('login')) {
    return NextResponse.json({
      success: true,
      message: 'Kode OTP berhasil dikirim (Sandbox Dummy)',
      otp: '123456'
    });
  }
  // --- SAMPAI SINI ---

  if (endpoint === 'checkout') {
    return handleCheckout(req);
  }

  if (endpoint === 'shipping/cost' || endpoint === 'shipping/rates') {
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
