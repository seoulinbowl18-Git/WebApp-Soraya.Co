export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'node:crypto';
import { getSnapClient, getMidtransServerKey, getMidtransClientKey, describeMidtransError } from '@/lib/midtrans';
import { searchFallbackDistricts, getFallbackRates } from '@/lib/shipping-fallback';
import { FALLBACK_PRODUCTS, filterProducts } from '@/lib/catalog-fallback';
import { getMemoryDb } from '@/lib/memory-db';

const MONGO_URL = process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME || 'soraya_co';

const FALLBACK_MOBILE_BACKEND = 'https://style-commerce-app-5.preview.emergentagent.com';
const MOBILE_BACKEND = (process.env.NEXT_PUBLIC_BACKEND_URL || FALLBACK_MOBILE_BACKEND).replace(/\/$/, '');
const ADMIN_KEY = 'soraya-admin-2026';

let cachedClient = null;
let cachedDb = null;

async function getDb() {
  if (!MONGO_URL) return getMemoryDb();
  if (cachedDb) return cachedDb;
  if (!cachedClient) {
    cachedClient = new MongoClient(MONGO_URL, { connectTimeoutMS: 8000, socketTimeoutMS: 10000 });
    await cachedClient.connect();
  }
  cachedDb = cachedClient.db(DB_NAME);
  return cachedDb;
}

function verifyAdmin(req) {
  const authHeader = req.headers.get('authorization') || '';
  const key = req.headers.get('x-admin-key') || (authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '');
  return key === ADMIN_KEY;
}

async function handleCheckout(req) {
  try {
    const body = await req.json();
    const { items, customer, address, shippingMethod, shippingCost, paymentMethod, refCode } = body || {};

    if (!items || !items.length) {
      return NextResponse.json({ error: 'Keranjang kosong' }, { status: 400 });
    }

    const db = await getDb();
    let subtotal = 0;
    let commission = 0;
    let affiliateValid = false;

    if (refCode) {
      const aff = await db.collection('affiliates').findOne({ code: refCode });
      if (aff) affiliateValid = true;
    }

    const resolved = [];
    for (const it of items) {
      let p = await db.collection('products').findOne({ id: it.id });
      if (!p && typeof it.id === 'string' && it.id.includes(':::')) {
        const base = it.id.split(':::')[0];
        p = await db.collection('products').findOne({ id: base });
      }
      if (!p && it.name && it.price) p = { id: it.id, name: it.name, price: it.price, image: it.image };
      if (!p) continue;

      const unitPrice = Number(it.price || p.price);
      const lineTotal = unitPrice * (it.qty || 1);
      subtotal += lineTotal;
      if (affiliateValid) commission += Math.round((lineTotal * (p.commissionPct || 10)) / 100);

      resolved.push({
        id: String(it.id),
        name: it.name || p.name,
        price: unitPrice,
        qty: it.qty || 1,
        image: it.image || p.image || ''
      });
    }

    const finalShippingCost = Number(shippingCost || 0);
    const grandTotal = subtotal + finalShippingCost;
    const orderId = `SRC-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const orderDoc = {
      orderId,
      items: resolved,
      subtotal,
      shippingCost: finalShippingCost,
      shippingMethod: shippingMethod || 'standard',
      grandTotal,
      customer: customer || {},
      address: address || {},
      status: 'pending',
      paymentMethod: paymentMethod || 'midtrans',
      refCode: affiliateValid ? refCode : null,
      affiliateCommission: affiliateValid ? commission : 0,
      createdAt: new Date()
    };

    let snapToken = null;
    let redirectUrl = null;

    if (paymentMethod === 'midtrans' || !paymentMethod) {
      const snap = getSnapClient();
      const transactionDetails = {
        order_id: orderId,
        gross_amount: grandTotal
      };

      const itemDetails = resolved.map((i) => ({
        id: i.id.slice(0, 50),
        price: i.price,
        quantity: i.qty,
        name: (i.name || 'Produk').slice(0, 50)
      }));

      if (finalShippingCost > 0) {
        itemDetails.push({
          id: 'SHIPPING',
          price: finalShippingCost,
          quantity: 1,
          name: 'Ongkos Kirim'
        });
      }

      const customerDetails = {
        first_name: customer?.name || 'Pelanggan',
        email: customer?.email || 'customer@example.com',
        phone: customer?.phone || '08123456789'
      };

      try {
        const snapResp = await snap.createTransaction({
          transaction_details: transactionDetails,
          item_details: itemDetails,
          customer_details: customerDetails
        });
        snapToken = snapResp.token;
        redirectUrl = snapResp.redirect_url;
        orderDoc.snapToken = snapToken;
        orderDoc.snapRedirectUrl = redirectUrl;
      } catch (err) {
        console.error('Midtrans transaction failed:', describeMidtransError(err));
      }
    }

    await db.collection('orders').insertOne(orderDoc);

    return NextResponse.json({
      success: true,
      orderId,
      snapToken,
      redirectUrl,
      grandTotal,
      message: 'Pesanan berhasil dibuat'
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
      const products = await db.collection('products').find({}).toArray();
      if (!products.length) return NextResponse.json(FALLBACK_PRODUCTS);
      return NextResponse.json(products);
    } catch {
      return NextResponse.json(FALLBACK_PRODUCTS);
    }
  }

  if (endpoint === 'shipping/districts') {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const districts = searchFallbackDistricts(q);
    return NextResponse.json(districts);
  }

  return NextResponse.json({ error: 'Endpoint tidak ditemukan' }, { status: 404 });
}

export async function POST(req, { params }) {
  const path = params?.path || [];
  const endpoint = path.join('/');

  if (endpoint === 'checkout') {
    return handleCheckout(req);
  }

  if (endpoint === 'shipping/rates') {
    try {
      const body = await req.json();
      const rates = getFallbackRates(body.districtId, body.weightGrams || 1000);
      return NextResponse.json(rates);
    } catch {
      return NextResponse.json({ error: 'Gagal menghitung ongkir' }, { status: 400 });
    }
  }

  return NextResponse.json({ error: 'Endpoint tidak ditemukan' }, { status: 404 });
}
