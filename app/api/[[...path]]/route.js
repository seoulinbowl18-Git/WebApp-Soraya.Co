import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

const MONGO_URL = process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME || 'soraya_co';

let client;
let dbPromise;
async function getDb() {
  if (!client) {
    client = new MongoClient(MONGO_URL);
    dbPromise = client.connect().then(() => client.db(DB_NAME));
  }
  return dbPromise;
}

const PRODUCT_IMAGES = [
  'https://images.unsplash.com/photo-1596703343725-7ca01bda9a45',
  'https://images.unsplash.com/photo-1596703343516-57c8fe6282d7',
  'https://images.unsplash.com/photo-1716170802999-d61f368407c7',
  'https://images.unsplash.com/photo-1652953338424-612617bc4b8e',
  'https://images.unsplash.com/photo-1652953338411-5d9ccc011c83',
  'https://images.unsplash.com/photo-1652953338199-41a65077091e',
  'https://images.unsplash.com/photo-1652953338408-023217fe5172',
  'https://images.unsplash.com/photo-1601653233006-5c9fd30eab12',
  'https://images.unsplash.com/photo-1654449753766-560ddcd19b75',
  'https://images.unsplash.com/photo-1504051771394-dd2e66b2e08f',
  'https://images.unsplash.com/photo-1716505681246-2f2e0f41871c',
  'https://images.unsplash.com/photo-1648871035658-1d0d4d5d3f77',
];

const SEED_PRODUCTS = [
  { name: 'Soraya Blouse Linen Beige', category: 'blouse', price: 185000, original: 245000, img: 3 },
  { name: 'Atasan Katun Hitam Minimal', category: 'atasan', price: 165000, original: 199000, img: 4 },
  { name: 'Tunik Rayon Monokrom', category: 'tunik-rayon', price: 215000, original: 265000, img: 5 },
  { name: 'Tunik Rayon Classic White', category: 'tunik-rayon', price: 225000, original: 275000, img: 6 },
  { name: 'Gamis Maxy Elegant Noir', category: 'gamis-maxy', price: 345000, original: 425000, img: 1 },
  { name: 'Gamis Maxy Soft Blue', category: 'gamis-maxy', price: 325000, original: 399000, img: 0 },
  { name: 'Midi Dress Grey Stone', category: 'midi-dress', price: 275000, original: 325000, img: 9 },
  { name: 'Setelan Daily Essentials', category: 'setelan', price: 285000, original: 349000, img: 7 },
  { name: 'Setelan Weekend Monochrome', category: 'setelan', price: 295000, original: 365000, img: 8 },
  { name: 'Best Seller: Abaya Noir', category: 'best-seller', price: 395000, original: 495000, img: 10 },
  { name: 'Best Seller: Abaya Blanche', category: 'best-seller', price: 385000, original: 480000, img: 11 },
  { name: 'Pyajamas Linen Set', category: 'pyajamas', price: 195000, original: 250000, img: 2 },
  { name: 'Pyajamas Soft Cotton', category: 'pyajamas', price: 185000, original: 229000, img: 4 },
  { name: 'Promo Blouse Bundle', category: 'promo', price: 149000, original: 299000, img: 5 },
  { name: 'Promo Tunik Flash Sale', category: 'promo', price: 175000, original: 285000, img: 6 },
  { name: 'Reseller Pack 3 Pcs Mix', category: 'reseller', price: 495000, original: 695000, img: 8 },
  { name: 'Reseller Pack 5 Pcs Mix', category: 'reseller', price: 795000, original: 1125000, img: 7 },
  { name: 'Atasan Linen Minimal II', category: 'atasan', price: 175000, original: 219000, img: 3 },
  { name: 'Blouse Satin Noir', category: 'blouse', price: 225000, original: 279000, img: 4 },
  { name: 'Midi Dress Noir Classic', category: 'midi-dress', price: 285000, original: 349000, img: 1 },
];

async function ensureSeed(db) {
  const col = db.collection('products');
  const count = await col.countDocuments();
  if (count === 0) {
    const docs = SEED_PRODUCTS.map((p) => ({
      id: uuidv4(),
      name: p.name,
      category: p.category,
      price: p.price,
      originalPrice: p.original,
      image: PRODUCT_IMAGES[p.img],
      description:
        'Premium modest wear by Soraya.Co. Crafted from carefully selected fabric for everyday comfort and timeless elegance. Available in multiple sizes.',
      commissionPct: 10,
      stock: 50,
      createdAt: new Date().toISOString(),
    }));
    await col.insertMany(docs);
  }
}

function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

function notFound() {
  return json({ error: 'Not found' }, 404);
}

function genAffiliateCode(name) {
  const base = (name || 'AFF').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'AFF';
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${base}${suffix}`;
}

async function handler(request, { params }) {
  const db = await getDb();
  await ensureSeed(db);
  const path = (params?.path || []).join('/');
  const method = request.method;
  const url = new URL(request.url);

  try {
    // ---------------- PRODUCTS ----------------
    if (path === 'products' && method === 'GET') {
      const category = url.searchParams.get('category');
      const search = (url.searchParams.get('search') || '').trim();
      const q = {};
      if (category && category !== 'all') q.category = category;
      if (search) q.name = { $regex: search, $options: 'i' };
      const items = await db.collection('products').find(q, { projection: { _id: 0 } }).toArray();
      return json({ items });
    }
    if (path.startsWith('products/') && method === 'GET') {
      const id = path.split('/')[1];
      const item = await db.collection('products').findOne({ id }, { projection: { _id: 0 } });
      if (!item) return notFound();
      return json(item);
    }

    // ---------------- AFFILIATE REGISTER ----------------
    if (path === 'affiliate/register' && method === 'POST') {
      const body = await request.json();
      const required = ['fullName', 'email', 'phone'];
      for (const f of required) if (!body[f]) return json({ error: `Missing ${f}` }, 400);
      const existing = await db.collection('affiliates').findOne({ email: body.email });
      if (existing) return json({ error: 'Email already registered', code: existing.code }, 409);
      const code = genAffiliateCode(body.fullName);
      const doc = {
        id: uuidv4(),
        code,
        fullName: body.fullName,
        email: body.email,
        phone: body.phone,
        socialLinks: body.socialLinks || '',
        payout: body.payout || {},
        createdAt: new Date().toISOString(),
      };
      await db.collection('affiliates').insertOne(doc);
      return json({ affiliate: { ...doc, _id: undefined } });
    }

    // ---------------- AFFILIATE PROFILE + STATS ----------------
    if (path.match(/^affiliate\/[^/]+$/) && method === 'GET') {
      const code = path.split('/')[1];
      const aff = await db.collection('affiliates').findOne({ code }, { projection: { _id: 0 } });
      if (!aff) return notFound();
      const [clicks, orders, payouts] = await Promise.all([
        db.collection('clicks').countDocuments({ ref: code }),
        db.collection('orders').find({ ref: code }, { projection: { _id: 0 } }).toArray(),
        db.collection('payouts').find({ affiliateCode: code }, { projection: { _id: 0 } }).toArray(),
      ]);
      const totalCommission = orders.reduce((s, o) => s + (o.commission || 0), 0);
      const paidOut = payouts.filter((p) => p.status === 'Paid').reduce((s, p) => s + p.amount, 0);
      const pendingPayouts = payouts.filter((p) => p.status === 'Pending').reduce((s, p) => s + p.amount, 0);
      const balance = totalCommission - paidOut - pendingPayouts;
      // Build 14-day trend
      const now = new Date();
      const days = Array.from({ length: 14 }).map((_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() - (13 - i));
        return d.toISOString().slice(0, 10);
      });
      const trend = days.map((day) => {
        const commission = orders
          .filter((o) => (o.createdAt || '').slice(0, 10) === day)
          .reduce((s, o) => s + (o.commission || 0), 0);
        return { date: day.slice(5), commission };
      });
      return json({
        affiliate: aff,
        stats: {
          clicks,
          conversions: orders.length,
          totalCommission,
          balance: Math.max(0, balance),
          pending: pendingPayouts,
          paidOut,
        },
        trend,
        orders,
        payouts,
      });
    }

    // ---------------- CLICK TRACKING ----------------
    if (path === 'affiliate/track-click' && method === 'POST') {
      const body = await request.json();
      const { ref, productId } = body;
      if (!ref) return json({ ok: false });
      const aff = await db.collection('affiliates').findOne({ code: ref });
      if (!aff) return json({ ok: false, reason: 'invalid_ref' });
      await db.collection('clicks').insertOne({
        id: uuidv4(),
        ref,
        productId: productId || null,
        createdAt: new Date().toISOString(),
      });
      return json({ ok: true });
    }

    // ---------------- ORDERS / CHECKOUT ----------------
    if (path === 'orders' && method === 'POST') {
      const body = await request.json();
      const { items, customer, paymentMethod, ref } = body;
      if (!items || !items.length) return json({ error: 'Empty cart' }, 400);
      let subtotal = 0;
      let commission = 0;
      let affiliateValid = false;
      if (ref) {
        const aff = await db.collection('affiliates').findOne({ code: ref });
        if (aff) affiliateValid = true;
      }
      // Resolve prices server-side
      const resolved = [];
      for (const it of items) {
        const p = await db.collection('products').findOne({ id: it.id });
        if (!p) continue;
        const lineTotal = p.price * (it.qty || 1);
        subtotal += lineTotal;
        if (affiliateValid) commission += Math.round((lineTotal * (p.commissionPct || 10)) / 100);
        resolved.push({ id: p.id, name: p.name, price: p.price, qty: it.qty || 1 });
      }
      const order = {
        id: uuidv4(),
        orderNumber: 'SOR-' + Date.now().toString(36).toUpperCase(),
        items: resolved,
        subtotal,
        total: subtotal,
        commission: affiliateValid ? commission : 0,
        ref: affiliateValid ? ref : null,
        customer: customer || {},
        paymentMethod: paymentMethod || null,
        status: 'Pending Payment',
        createdAt: new Date().toISOString(),
      };
      await db.collection('orders').insertOne(order);
      return json({ order: { ...order, _id: undefined } });
    }

    // ---------------- PAYOUTS ----------------
    if (path === 'payouts' && method === 'POST') {
      const body = await request.json();
      const { affiliateCode, amount, method: payoutMethod, account } = body;
      if (!affiliateCode || !amount) return json({ error: 'Missing fields' }, 400);
      const aff = await db.collection('affiliates').findOne({ code: affiliateCode });
      if (!aff) return notFound();
      const doc = {
        id: uuidv4(),
        affiliateCode,
        amount: Number(amount),
        method: payoutMethod || 'BCA',
        account: account || '',
        status: 'Pending',
        createdAt: new Date().toISOString(),
      };
      await db.collection('payouts').insertOne(doc);
      return json({ payout: { ...doc, _id: undefined } });
    }

    if (path === 'payouts' && method === 'GET') {
      const code = url.searchParams.get('affiliate');
      if (!code) return json({ items: [] });
      const items = await db.collection('payouts').find({ affiliateCode: code }, { projection: { _id: 0 } }).sort({ createdAt: -1 }).toArray();
      return json({ items });
    }

    // ---------------- HEALTH ----------------
    if (path === '' && method === 'GET') return json({ ok: true, service: 'soraya.co' });

    return notFound();
  } catch (err) {
    console.error('API error:', err);
    return json({ error: err.message || 'Server error' }, 500);
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
