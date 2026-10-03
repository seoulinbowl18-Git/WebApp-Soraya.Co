import midtransClient from 'midtrans-client';

function firstRealKey(...values) {
  for (const v of values) {
    const key = (v || '').trim().replace(/^["']|["']$/g, '');
    if (key && !key.startsWith('process.env')) return key;
  }
  return '';
}

export function getMidtransServerKey() {
  return firstRealKey(process.env.MIDTRANS_SERVER_KEY_2, process.env.MIDTRANS_SERVER_KEY);
}

export function getMidtransClientKey() {
  return firstRealKey(process.env.MIDTRANS_CLIENT_KEY_2, process.env.MIDTRANS_CLIENT_KEY, process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY);
}

export function isMidtransProduction() {
  return process.env.MIDTRANS_IS_PRODUCTION === 'true';
}

export function getSnapScriptUrl() {
  return isMidtransProduction()
    ? 'https://app.midtrans.com/snap/snap.js'
    : 'https://app.sandbox.midtrans.com/snap/snap.js';
}

let snapClient;
let snapClientKey;
export function getSnapClient() {
  const serverKey = getMidtransServerKey();
  if (!serverKey) return null;
  if (!snapClient || snapClientKey !== serverKey) {
    snapClient = new midtransClient.Snap({
      isProduction: isMidtransProduction(),
      serverKey,
      clientKey: getMidtransClientKey(),
    });
    snapClientKey = serverKey;
  }
  return snapClient;
}

export function describeMidtransError(e) {
  const apiMessages = e?.ApiResponse?.error_messages;
  if (Array.isArray(apiMessages) && apiMessages.length) return apiMessages.join(', ');
  return e?.message || 'Gagal membuat transaksi Midtrans';
}

const MAX_QTY_PER_ITEM = 20;
const MAX_TOTAL_QTY = 100;

export function sanitizeLineItems(items) {
  if (!Array.isArray(items) || items.length === 0) return { error: 'Keranjang kosong' };
  const lines = [];
  let totalQty = 0;
  for (const it of items) {
    const qty = Number(it?.qty ?? 1);
    const price = Number(it?.price);
    if (!Number.isInteger(qty) || qty <= 0 || qty > MAX_QTY_PER_ITEM) return { error: `Jumlah item tidak valid untuk ${it?.name || 'produk'}` };
    if (!Number.isFinite(price) || price <= 0) return { error: `Harga tidak valid untuk ${it?.name || 'produk'}` };
    totalQty += qty;
    lines.push({
      id: String(it.id ?? `ITEM-${lines.length + 1}`).slice(0, 50),
      name: String(it.name || 'Produk Soraya').slice(0, 50),
      price: Math.round(price),
      quantity: qty,
      image: it.image || null,
    });
  }
  if (totalQty > MAX_TOTAL_QTY) return { error: 'Jumlah total item melebihi batas' };
  return { lines };
}
