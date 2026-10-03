import midtransClient from 'midtrans-client';

export const MIDTRANS_MERCHANT_ID = 'M424453976';
export const FALLBACK_MIDTRANS_SERVER_KEY = 'Mid-server-7ZmwJndFCDL-LZsI0cqbqBGa';
export const FALLBACK_MIDTRANS_CLIENT_KEY = 'Mid-client-g11HgXOquCT1FAVp';
export const FALLBACK_MIDTRANS_IS_PRODUCTION = false;

export function isMidtransProduction() {
  const flag = (process.env.MIDTRANS_IS_PRODUCTION || '').trim().toLowerCase();
  return flag ? flag === 'true' : FALLBACK_MIDTRANS_IS_PRODUCTION;
}

// Empty values and unresolved placeholders are skipped in favor of the fallback.
// Newer Midtrans sandbox accounts issue keys without the "SB-" prefix, so both forms are accepted.
function firstValidKey(kind, values, fallback) {
  const pattern = new RegExp(`^(SB-)?Mid-${kind}-`);
  for (const v of values) {
    const key = (v || '').trim().replace(/^["']|["']$/g, '');
    if (pattern.test(key)) return key;
  }
  return fallback;
}

export function getMidtransServerKey() {
  return firstValidKey('server', [process.env.MIDTRANS_SERVER_KEY_2, process.env.MIDTRANS_SERVER_KEY], FALLBACK_MIDTRANS_SERVER_KEY);
}

export function getMidtransClientKey() {
  return firstValidKey(
    'client',
    [process.env.MIDTRANS_CLIENT_KEY_2, process.env.MIDTRANS_CLIENT_KEY, process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY],
    FALLBACK_MIDTRANS_CLIENT_KEY,
  );
}

export function getMidtransAuthHeader(serverKey = getMidtransServerKey()) {
  return 'Basic ' + Buffer.from(`${serverKey}:`).toString('base64');
}

export function getSnapApiUrl() {
  return isMidtransProduction()
    ? 'https://app.midtrans.com/snap/v1/transactions'
    : 'https://app.sandbox.midtrans.com/snap/v1/transactions';
}

export async function createSnapTransaction(parameter) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  let res;
  try {
    res = await fetch(getSnapApiUrl(), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: getMidtransAuthHeader(),
      },
      body: JSON.stringify(parameter),
      cache: 'no-store',
      signal: ctrl.signal,
    });
  } catch (e) {
    const err = new Error(e?.name === 'AbortError' ? 'Midtrans timeout' : 'Tidak bisa menghubungi Midtrans: ' + (e?.message || 'network error'));
    err.httpStatusCode = 504;
    throw err;
  } finally {
    clearTimeout(timer);
  }
  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { error_messages: [text.slice(0, 200) || `HTTP ${res.status}`] }; }
  if (!res.ok || !data.token) {
    const err = new Error(`Midtrans HTTP ${res.status}`);
    err.httpStatusCode = res.status;
    err.ApiResponse = data;
    throw err;
  }
  return data;
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
