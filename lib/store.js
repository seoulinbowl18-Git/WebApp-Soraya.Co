// Shared in-memory store (globalThis so routes share state across hot-reloads)
import { CATALOG as INITIAL_CATALOG } from './catalog';

function init() {
  if (!globalThis.__SORAYA_STORE__) {
    globalThis.__SORAYA_STORE__ = {
      // Produk — mutable copy katalog awal; admin bisa edit/add/delete
      catalog: INITIAL_CATALOG.map((p) => ({ ...p, commissionPct: p.commissionPct ?? 10 })),

      // Afiliasi
      affiliates: new Map(), // key: code → affiliate
      clicks: [],            // { code, productId?, ts }
      orders: new Map(),     // shared dengan /api/checkout/session (reuse __SORAYA_ORDERS__)
      payouts: [],           // { id, affiliateCode, amount, method, account, status, createdAt }

      // Banners — 5 slides default
      banners: [
        { id: 'b1', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1600&auto=format&fit=crop&q=70', title: 'Koleksi Blouse Premium', subtitle: 'Diskon hingga 30%', cta: 'Belanja Sekarang', href: '/?cat=Blouse', active: true },
        { id: 'b2', image: 'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?w=1600&auto=format&fit=crop&q=70', title: 'Gamis Maxy Terbaru', subtitle: 'Elegan untuk sehari-hari', cta: 'Lihat Koleksi', href: '/?cat=Gamis+Maxy', active: true },
        { id: 'b3', image: 'https://images.unsplash.com/photo-1551803091-e20673f15770?w=1600&auto=format&fit=crop&q=70', title: 'Tunik Rayon Nyaman', subtitle: 'Bahan jatuh & ringan', cta: 'Pilih Tunik', href: '/?cat=Tunik+Rayon', active: true },
        { id: 'b4', image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=1600&auto=format&fit=crop&q=70', title: 'Midi Dress Modis', subtitle: 'Potongan feminin & modern', cta: 'Belanja Midi', href: '/?cat=Midi+Dress', active: true },
        { id: 'b5', image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1600&auto=format&fit=crop&q=70', title: 'Setelan Rayon', subtitle: 'Nyaman & stylish', cta: 'Shop Set', href: '/?cat=Setelan', active: true },
      ],
    };
  }
  // Pastikan orders map adalah map yang sama dengan /api/checkout/session
  globalThis.__SORAYA_ORDERS__ = globalThis.__SORAYA_ORDERS__ || new Map();
  globalThis.__SORAYA_STORE__.orders = globalThis.__SORAYA_ORDERS__;
  return globalThis.__SORAYA_STORE__;
}

export const store = init();

// Helpers
export function genCode(prefix = 'SRY') {
  return `${prefix}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

export function newAffiliateCode() {
  let code;
  do {
    code = genCode('AFI');
  } while (store.affiliates.has(code));
  return code;
}

export function newId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 9000) + 1000}`;
}

// Komisi helper (default 10%, atau override per produk)
export function commissionFor(product, amount) {
  const pct = product?.commissionPct ?? 10;
  return Math.round((Number(amount) || 0) * pct / 100);
}

// Admin auth guard
export function checkAdmin(request) {
  const key = request.headers.get('x-admin-key');
  return key === (process.env.ADMIN_KEY || 'soraya-admin-2026');
}

// Stats helper untuk dashboard afiliasi
export function computeAffiliateStats(code) {
  const clicks = store.clicks.filter((c) => c.code === code).length;
  const orders = Array.from(store.orders.values()).filter((o) => o.affiliateCode === code || o.ref === code);
  const approvedOrders = orders.filter((o) => (o.affiliateStatus || o.status) === 'approved');

  const totalCommission = approvedOrders.reduce((s, o) => s + Number(o.commission || 0), 0);
  const paidPayouts = store.payouts.filter((p) => p.affiliateCode === code && p.status === 'Paid').reduce((s, p) => s + p.amount, 0);
  const pendingPayouts = store.payouts.filter((p) => p.affiliateCode === code && p.status === 'Pending').reduce((s, p) => s + p.amount, 0);
  const available = Math.max(0, totalCommission - paidPayouts - pendingPayouts);

  // 30-hari trend (klik & order)
  const trend = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const date = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    const cl = store.clicks.filter((c) => c.code === code && c.ts.slice(0, 10) === key).length;
    const or = orders.filter((o) => (o.createdAt || '').slice(0, 10) === key).length;
    trend.push({ date, clicks: cl, orders: or });
  }

  return {
    clicks,
    conversions: orders.length,
    approvedConversions: approvedOrders.length,
    totalCommission,
    available,
    pendingPayouts,
    paidPayouts,
    trend,
  };
}
