import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'node:crypto';
import midtransClient from 'midtrans-client';

const MONGO_URL = process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME || 'soraya_co';
const MOBILE_BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;
const ADMIN_KEY = 'soraya-admin-2026';

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;
const MIDTRANS_IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === 'true';
const KA_KEY = process.env.KIRIMINAJA_API_KEY;
const KA_BASE = process.env.KIRIMINAJA_IS_SANDBOX === 'true' ? 'https://tdev.kiriminaja.com' : 'https://client.kiriminaja.com';

let snapClient;
function getSnap() {
  if (!snapClient && MIDTRANS_SERVER_KEY) {
    snapClient = new midtransClient.Snap({ isProduction: MIDTRANS_IS_PRODUCTION, serverKey: MIDTRANS_SERVER_KEY });
  }
  return snapClient;
}

async function kaCall(path, body) {
  if (!KA_KEY) throw new Error('KIRIMINAJA_API_KEY not set');
  const r = await fetch(`${KA_BASE}${path}`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${KA_KEY}` },
    body: JSON.stringify(body || {}),
    cache: 'no-store',
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data.status === false) {
    const msg = data.text || data.message || `KiriminAja HTTP ${r.status}`;
    const err = new Error(msg);
    err.upstream = data;
    err.status = r.status;
    throw err;
  }
  return data;
}

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
      description: 'Modest wear premium dari Soraya.Co. Dibuat dari bahan pilihan untuk kenyamanan dan tampilan elegan.',
      commissionPct: 10,
      stock: 50,
      createdAt: new Date().toISOString(),
    }));
    await col.insertMany(docs);
  }
}

function json(data, status = 200) { return NextResponse.json(data, { status }); }
function notFound() { return json({ error: 'Not found' }, 404); }

function genAffiliateCode(name) {
  const base = (name || 'AFF').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'AFF';
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${base}${suffix}`;
}

function orderStatusFor(paymentMethod) {
  const instant = ['qris', 'dana', 'gopay', 'ovo', 'shopeepay'];
  if (instant.includes((paymentMethod || '').toLowerCase())) return 'approved';
  return 'pending_validation';
}

// ----- Mobile backend product normalization/proxy -----
function absolutizeImage(img) {
  if (!img) return null;
  if (/^https?:\/\//i.test(img)) return img;
  if (!MOBILE_BACKEND) return img;
  return MOBILE_BACKEND.replace(/\/$/, '') + (img.startsWith('/') ? img : '/' + img);
}
function normalizeMobileProduct(p, idx) {
  const rawImg = p.image || p.imageUrl || p.photo || p.thumbnail || (p.variants && p.variants[0] && p.variants[0].image) || PRODUCT_IMAGES[idx % PRODUCT_IMAGES.length];
  const img = absolutizeImage(rawImg);
  const originalPrice = p.originalPrice || p.original_price || p.compareAtPrice;
  // Category: support `category` (string) or `categories` (array)
  let category = 'all';
  if (Array.isArray(p.categories) && p.categories.length) category = p.categories[0];
  else if (p.category) category = p.category;
  else if (p.categorySlug) category = p.categorySlug;
  // Price
  const price = Number(p.price || 0);
  // Variants (map images absolute too)
  const variants = Array.isArray(p.variants) ? p.variants.map((v) => ({ ...v, image: absolutizeImage(v.image) })) : [];
  return {
    id: String(p.id || p._id || p.sku || uuidv4()),
    name: p.name || p.title || 'Produk',
    category,
    categories: Array.isArray(p.categories) ? p.categories : [category],
    price,
    originalPrice: originalPrice ? Number(originalPrice) : null,
    image: img,
    description: p.description || p.desc || 'Modest wear premium Soraya.Co.',
    commissionPct: p.commissionPct || p.commission_pct || 10,
    stock: p.stock != null ? Number(p.stock) : 100,
    variants,
    sizes: p.sizes || [],
    source: 'mobile',
  };
}

async function fetchMobileProducts() {
  if (!MOBILE_BACKEND) return null;
  const paths = ['/api/products', '/api/catalog/products', '/products.json', '/api/v1/products'];
  for (const p of paths) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 6000);
      const r = await fetch(MOBILE_BACKEND + p, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
      clearTimeout(t);
      if (!r.ok) continue;
      const ct = r.headers.get('content-type') || '';
      if (!ct.includes('application/json')) continue;
      const data = await r.json();
      const list = Array.isArray(data) ? data : (data.items || data.products || data.data || []);
      if (list.length) return list.map(normalizeMobileProduct);
    } catch {}
  }
  return null;
}

async function createOrder(db, body) {
  const { items, customer, paymentMethod, ref, affiliate_code, shipping } = body;
  const refCode = ref || affiliate_code || null;
  if (!items || !items.length) return { error: 'Keranjang kosong', status: 400 };
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
    // handle "id::variant::size" composite
    if (!p && typeof it.id === 'string' && it.id.includes('::')) {
      const base = it.id.split('::')[0];
      p = await db.collection('products').findOne({ id: base });
    }
    if (!p && it.name && it.price) p = { id: it.id, name: it.name, price: it.price, image: it.image, commissionPct: 10 };
    if (!p) continue;
    const unitPrice = Number(it.price || p.price);
    const lineTotal = unitPrice * (it.qty || 1);
    subtotal += lineTotal;
    if (affiliateValid) commission += Math.round((lineTotal * (p.commissionPct || 10)) / 100);
    resolved.push({ id: String(it.id), name: it.name || p.name, price: unitPrice, qty: it.qty || 1, image: it.image || p.image });
  }
  const shippingCost = shipping?.price ? Number(shipping.price) : 0;
  const total = subtotal + shippingCost;
  const order = {
    id: uuidv4(),
    orderNumber: 'SOR-' + Date.now().toString(36).toUpperCase(),
    items: resolved,
    subtotal,
    shipping: shipping || null,
    shippingCost,
    total,
    commission: affiliateValid ? commission : 0,
    ref: affiliateValid ? refCode : null,
    customer: customer || {},
    paymentMethod: paymentMethod || null,
    paymentStatus: 'pending',
    status: 'pending_validation',
    createdAt: new Date().toISOString(),
  };
  await db.collection('orders').insertOne(order);
  return { order: { ...order, _id: undefined } };
}

function genOtp() { return String(Math.floor(100000 + Math.random() * 900000)); }
function genToken() { return uuidv4().replace(/-/g, ''); }

async function handler(request, ctx) {
  const db = await getDb();
  await ensureSeed(db);
  const params = await ctx.params;
  const path = (params?.path || []).join('/');
  const method = request.method;
  const url = new URL(request.url);
  const adminKey = request.headers.get('x-admin-key');
  const isAdmin = adminKey === ADMIN_KEY;

  try {
    // ---------------- PRODUCTS (hybrid: mobile first, fallback local) ----------------
    if (path === 'products' && method === 'GET') {
      const category = url.searchParams.get('category');
      const search = (url.searchParams.get('search') || '').trim();

      let items = null;
      const mobile = await fetchMobileProducts();
      if (mobile && mobile.length) items = mobile;

      if (!items) {
        const q = {};
        if (category && category !== 'all') q.category = category;
        if (search) q.name = { $regex: search, $options: 'i' };
        items = await db.collection('products').find(q, { projection: { _id: 0 } }).toArray();
        return json({ items, source: 'local' });
      }

      if (category && category !== 'all') items = items.filter((p) => (p.categories || [p.category]).includes(category));
      if (search) items = items.filter((p) => (p.name || '').toLowerCase().includes(search.toLowerCase()));
      return json({ items, source: 'mobile' });
    }
    if (path.startsWith('products/') && method === 'GET') {
      const id = path.split('/')[1];
      const mobile = await fetchMobileProducts();
      if (mobile) {
        const found = mobile.find((p) => String(p.id) === String(id));
        if (found) return json(found);
      }
      const item = await db.collection('products').findOne({ id }, { projection: { _id: 0 } });
      if (!item) return notFound();
      return json(item);
    }

    // ---------------- AUTH (Mock OTP) ----------------
    if (path === 'auth/login' && method === 'POST') {
      const body = await request.json();
      const identifier = (body.identifier || '').trim();
      const mode = body.mode || 'phone';
      if (!identifier) return json({ error: 'Identifier wajib' }, 400);
      const otp = genOtp();
      await db.collection('otps').insertOne({ identifier, otp, mode, createdAt: new Date().toISOString(), used: false });
      // In production, send via WhatsApp or Email gateway. For MVP, return devOtp.
      return json({ ok: true, devOtp: otp, message: 'OTP generated (dev mode)' });
    }

    if (path === 'auth/verify-otp' && method === 'POST') {
      const body = await request.json();
      const identifier = (body.identifier || '').trim();
      const otp = (body.otp || '').trim();
      if (!identifier || !otp) return json({ error: 'Field wajib' }, 400);
      const rec = await db.collection('otps').find({ identifier, used: false }).sort({ createdAt: -1 }).limit(1).toArray();
      if (!rec.length || rec[0].otp !== otp) return json({ error: 'Kode OTP salah' }, 400);
      await db.collection('otps').updateOne({ _id: rec[0]._id }, { $set: { used: true } });
      let user = await db.collection('users').findOne({ identifier });
      if (!user) {
        user = { id: uuidv4(), identifier, mode: body.mode || 'phone', name: null, createdAt: new Date().toISOString() };
        await db.collection('users').insertOne(user);
      }
      const token = genToken();
      await db.collection('sessions').insertOne({ token, userId: user.id, createdAt: new Date().toISOString() });
      // Attach affiliate code if any affiliate matches this identifier
      const aff = await db.collection('affiliates').findOne({ $or: [{ email: identifier }, { phone: identifier }] });
      return json({ token, user: { id: user.id, identifier: user.identifier, name: user.name, affiliateCode: aff?.code || null } });
    }

    if (path === 'auth/me' && method === 'GET') {
      const auth = request.headers.get('authorization') || '';
      const token = auth.replace(/^Bearer\s+/i, '');
      if (!token) return json({ error: 'No token' }, 401);
      const sess = await db.collection('sessions').findOne({ token });
      if (!sess) return json({ error: 'Invalid token' }, 401);
      const user = await db.collection('users').findOne({ id: sess.userId }, { projection: { _id: 0 } });
      if (!user) return json({ error: 'User not found' }, 404);
      const aff = await db.collection('affiliates').findOne({ $or: [{ email: user.identifier }, { phone: user.identifier }] });
      return json({ user: { ...user, affiliateCode: aff?.code || null } });
    }

    // ---------------- AFFILIATE REGISTER ----------------
    if (path === 'affiliate/register' && method === 'POST') {
      const body = await request.json();
      const required = ['fullName', 'email', 'phone'];
      for (const f of required) if (!body[f]) return json({ error: `Field ${f} wajib diisi` }, 400);
      const existing = await db.collection('affiliates').findOne({ email: body.email });
      if (existing) return json({ error: 'Email sudah terdaftar', code: existing.code }, 409);
      const code = genAffiliateCode(body.fullName);
      const doc = {
        id: uuidv4(), code, fullName: body.fullName, email: body.email, phone: body.phone,
        socialLinks: body.socialLinks || '',
        payout: body.payout || {},
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      await db.collection('affiliates').insertOne(doc);
      return json({ affiliate: { ...doc, _id: undefined } });
    }

    // ---------------- AFFILIATE ACTIVATE ----------------
    if (path.match(/^affiliate\/[^/]+\/activate$/) && method === 'POST') {
      if (!isAdmin) return json({ error: 'Unauthorized' }, 401);
      const code = path.split('/')[1];
      await db.collection('affiliates').updateOne({ code }, { $set: { status: 'active' } });
      return json({ ok: true });
    }

    // ---------------- AFFILIATE PROFILE + STATS ----------------
    if (path.match(/^affiliate\/[^/]+$/) && method === 'GET') {
      const code = path.split('/')[1];
      const aff = await db.collection('affiliates').findOne({ code }, { projection: { _id: 0 } });
      if (!aff) return notFound();
      const [clicks, orders, payouts] = await Promise.all([
        db.collection('clicks').countDocuments({ ref: code }),
        db.collection('orders').find({ ref: code }, { projection: { _id: 0 } }).sort({ createdAt: -1 }).toArray(),
        db.collection('payouts').find({ affiliateCode: code }, { projection: { _id: 0 } }).toArray(),
      ]);
      const approvedCommission = orders.filter((o) => o.status === 'approved').reduce((s, o) => s + (o.commission || 0), 0);
      const pendingCommission = orders.filter((o) => o.status === 'pending_validation').reduce((s, o) => s + (o.commission || 0), 0);
      const paidOut = payouts.filter((p) => p.status === 'Paid').reduce((s, p) => s + p.amount, 0);
      const pendingPayouts = payouts.filter((p) => p.status === 'Pending').reduce((s, p) => s + p.amount, 0);
      const available = Math.max(0, approvedCommission - paidOut - pendingPayouts);
      const totalCommission = approvedCommission + pendingCommission;
      const now = new Date();
      const days = Array.from({ length: 30 }).map((_, i) => { const d = new Date(now); d.setDate(now.getDate() - (29 - i)); return d.toISOString().slice(0, 10); });
      const clickDocs = await db.collection('clicks').find({ ref: code }, { projection: { _id: 0 } }).toArray();
      const trend = days.map((day) => ({
        date: day.slice(5),
        clicks: clickDocs.filter((c) => (c.createdAt || '').slice(0, 10) === day).length,
        orders: orders.filter((o) => (o.createdAt || '').slice(0, 10) === day).length,
        commission: orders.filter((o) => (o.createdAt || '').slice(0, 10) === day).reduce((s, o) => s + (o.commission || 0), 0),
      }));
      return json({
        affiliate: aff,
        stats: {
          clicks, conversions: orders.length,
          approvedConversions: orders.filter((o) => o.status === 'approved').length,
          totalCommission, available, pending: pendingCommission, pendingPayouts, paidOut,
        },
        trend, orders, payouts,
      });
    }

    // ---------------- CLICK TRACKING ----------------
    if (path === 'affiliate/track-click' && method === 'POST') {
      const body = await request.json();
      const { ref, productId } = body;
      if (!ref) return json({ ok: false });
      const aff = await db.collection('affiliates').findOne({ code: ref });
      if (!aff) return json({ ok: false, reason: 'invalid_ref' });
      await db.collection('clicks').insertOne({ id: uuidv4(), ref, productId: productId || null, createdAt: new Date().toISOString() });
      return json({ ok: true });
    }

    // ---------------- ORDERS / CHECKOUT ----------------
    if ((path === 'orders' || path === 'checkout/session') && method === 'POST') {
      const body = await request.json();
      const result = await createOrder(db, body);
      if (result.error) return json({ error: result.error }, result.status || 400);
      return json(result);
    }

    // ---------------- PAYOUTS ----------------
    if (path === 'payouts' && method === 'POST') {
      const body = await request.json();
      const { affiliateCode, amount, method: payoutMethod, account } = body;
      if (!affiliateCode || !amount) return json({ error: 'Field wajib diisi' }, 400);
      const aff = await db.collection('affiliates').findOne({ code: affiliateCode });
      if (!aff) return notFound();
      const doc = { id: uuidv4(), affiliateCode, amount: Number(amount), method: payoutMethod || 'BCA', account: account || '', status: 'Pending', createdAt: new Date().toISOString() };
      await db.collection('payouts').insertOne(doc);
      return json({ payout: { ...doc, _id: undefined } });
    }
    if (path === 'payouts' && method === 'GET') {
      const code = url.searchParams.get('affiliate');
      if (!code) return json({ items: [] });
      const items = await db.collection('payouts').find({ affiliateCode: code }, { projection: { _id: 0 } }).sort({ createdAt: -1 }).toArray();
      return json({ items });
    }

    // ---------------- ADMIN ----------------
    if (path.startsWith('admin/') && !isAdmin) return json({ error: 'Unauthorized' }, 401);

    if (path === 'admin/affiliates' && method === 'GET') {
      const items = await db.collection('affiliates').find({}, { projection: { _id: 0 } }).sort({ createdAt: -1 }).toArray();
      return json({ items });
    }
    if (path === 'admin/payouts' && method === 'GET') {
      const items = await db.collection('payouts').find({}, { projection: { _id: 0 } }).sort({ createdAt: -1 }).toArray();
      return json({ items });
    }
    if (path.match(/^admin\/payouts\/[^/]+$/) && method === 'POST') {
      const id = path.split('/')[2];
      const body = await request.json();
      await db.collection('payouts').updateOne({ id }, { $set: { status: body.status, updatedAt: new Date().toISOString() } });
      return json({ ok: true });
    }
    if (path === 'admin/orders' && method === 'GET') {
      const items = await db.collection('orders').find({}, { projection: { _id: 0 } }).sort({ createdAt: -1 }).limit(200).toArray();
      return json({ items });
    }
    if (path.match(/^admin\/orders\/[^/]+$/) && method === 'POST') {
      const id = path.split('/')[2];
      const body = await request.json();
      await db.collection('orders').updateOne({ id }, { $set: { status: body.status, updatedAt: new Date().toISOString() } });
      return json({ ok: true });
    }
    if (path.match(/^admin\/products\/[^/]+$/) && method === 'POST') {
      const id = path.split('/')[2];
      const body = await request.json();
      const patch = {};
      if (body.commissionPct != null) patch.commissionPct = Number(body.commissionPct);
      if (body.price != null) patch.price = Number(body.price);
      await db.collection('products').updateOne({ id }, { $set: patch });
      return json({ ok: true });
    }

    // ---------------- SHIPPING (KiriminAja) ----------------
    if (path === 'shipping/destinations' && method === 'GET') {
      const search = (url.searchParams.get('search') || '').trim();
      if (search.length < 3) return json({ items: [] });
      try {
        const data = await kaCall('/api/mitra/v2/get_address_by_name', { search });
        return json({ items: data.data || [] });
      } catch (e) {
        return json({ error: e.message, upstream: e.upstream || null }, 502);
      }
    }
    if (path === 'shipping/rates' && method === 'POST') {
      const body = await request.json();
      const destination = Number(body.destinationDistrictId);
      const weight = Math.max(100, Number(body.weight || 1000));
      const itemValue = Number(body.itemValue || 0);
      const origin = Number(body.originDistrictId || process.env.KIRIMINAJA_ORIGIN_DISTRICT_ID || 0);
      if (!destination || !origin) return json({ error: 'Origin & destination district id wajib' }, 400);
      try {
        const data = await kaCall('/api/mitra/v6.1/shipping_price', {
          origin, destination, weight,
          length: 1, width: 1, height: 1,
          item_value: itemValue, insurance: 0, courier: [],
        });
        const options = (data.results || data.data || []).map((x) => ({
          service: x.service, service_name: x.service_name || x.service, service_type: x.service_type || null,
          estimated_days: x.etd || x.estimated_days || null, price: Number(x.cost || x.price || 0),
        })).filter((x) => x.price > 0);
        return json({ options });
      } catch (e) {
        return json({ error: e.message, upstream: e.upstream || null }, 502);
      }
    }

    // ---------------- PAYMENT (Midtrans Snap) ----------------
    if (path === 'payment/snap' && method === 'POST') {
      const body = await request.json();
      const snap = getSnap();
      if (!snap) return json({ error: 'MIDTRANS_SERVER_KEY not configured' }, 500);
      const order = await db.collection('orders').findOne({ id: body.orderId });
      if (!order) return notFound();
      const customerName = (order.customer?.name || 'Soraya Customer').split(' ');
      const parameter = {
        transaction_details: { order_id: order.orderNumber, gross_amount: Math.round(order.total) },
        item_details: [
          ...order.items.map((it) => ({ id: String(it.id).slice(0, 50), name: String(it.name).slice(0, 50), price: Math.round(it.price), quantity: it.qty })),
          ...(order.shipping ? [{ id: 'SHIP', name: `Ongkir ${order.shipping.service_name || order.shipping.service}`.slice(0, 50), price: Math.round(order.shipping.price || 0), quantity: 1 }] : []),
        ],
        customer_details: {
          first_name: customerName[0] || 'Soraya',
          last_name: customerName.slice(1).join(' ') || 'Customer',
          email: order.customer?.email || 'buyer@soraya.co',
          phone: order.customer?.phone || '08000000000',
        },
        enabled_payments: ['other_qris', 'bank_transfer', 'gopay', 'ovo', 'shopeepay', 'dana'],
      };
      try {
        const tx = await snap.createTransaction(parameter);
        await db.collection('orders').updateOne({ id: order.id }, { $set: { midtransToken: tx.token, midtransRedirect: tx.redirect_url, paymentStatus: 'pending', updatedAt: new Date().toISOString() } });
        return json({ token: tx.token, redirect_url: tx.redirect_url, orderNumber: order.orderNumber, clientKey: process.env.MIDTRANS_CLIENT_KEY });
      } catch (e) {
        console.error('Midtrans error:', e.ApiResponse || e.message);
        return json({ error: 'Midtrans: ' + (e.message || 'failed'), upstream: e.ApiResponse || null }, 502);
      }
    }

    if (path === 'payment/notification' && method === 'POST') {
      const n = await request.json();
      if (!MIDTRANS_SERVER_KEY) return json({ error: 'no key' }, 500);
      const expected = crypto.createHash('sha512')
        .update(`${n.order_id}${n.status_code}${n.gross_amount}${MIDTRANS_SERVER_KEY}`)
        .digest('hex');
      if (expected !== n.signature_key) return json({ error: 'invalid signature' }, 401);
      let status = 'pending';
      if (n.transaction_status === 'settlement') status = 'paid';
      else if (n.transaction_status === 'capture') status = n.fraud_status === 'accept' ? 'paid' : 'pending';
      else if (n.transaction_status === 'cancel' || n.transaction_status === 'deny' || n.transaction_status === 'expire' || n.transaction_status === 'failure') status = 'failed';
      const order = await db.collection('orders').findOne({ orderNumber: n.order_id });
      if (!order) return json({ ok: false }, 404);
      const newOrderStatus = status === 'paid' ? 'approved' : (status === 'failed' ? 'cancelled' : order.status);
      // never downgrade from paid
      const patch = { paymentStatus: order.paymentStatus === 'paid' ? 'paid' : status, transactionStatus: n.transaction_status, paymentType: n.payment_type || null, midtransTransactionId: n.transaction_id || null, status: newOrderStatus, updatedAt: new Date().toISOString() };
      await db.collection('orders').updateOne({ orderNumber: n.order_id }, { $set: patch });
      return json({ received: true });
    }

    // ---------------- HEALTH ----------------
    if (path === '' && method === 'GET') return json({ ok: true, service: 'soraya.co', mobileBackend: MOBILE_BACKEND || null });

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
