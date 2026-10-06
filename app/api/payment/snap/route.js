import { NextResponse } from 'next/server';

globalThis.__SORAYA_ORDERS__ = globalThis.__SORAYA_ORDERS__ || new Map();
const ORDERS = globalThis.__SORAYA_ORDERS__;

const getBase = () => {
  const isSandbox = (process.env.KOMERCE_IS_SANDBOX || 'true').toLowerCase() === 'true';
  return isSandbox
    ? 'https://api-sandbox.collaborator.komerce.id'
    : 'https://api.collaborator.komerce.id';
};

// POST /api/payment/snap  (nama legacy — sekarang generate Komerce QRIS)
// Body: { orderId }
// Response: { success, token: null, redirect_url, orderNumber, qrString, paymentId }
export async function POST(request) {
  try {
    const body = await request.json();
    const { orderId } = body;
    if (!orderId) {
      return NextResponse.json(
        { success: false, message: 'orderId wajib diisi' },
        { status: 400 }
      );
    }

    const order = ORDERS.get(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order tidak ditemukan' },
        { status: 404 }
      );
    }

    const apiKey = process.env.KOMERCE_PAYMENT_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: 'KOMERCE_PAYMENT_KEY belum di-set' },
        { status: 500 }
      );
    }

    if (order.grandTotal < 10000) {
      return NextResponse.json(
        { success: false, message: 'Minimum pembayaran QRIS Rp 10.000' },
        { status: 400 }
      );
    }

    // Normalisasi items — Komerce wajib { name, quantity, price (int > 0) }
    const normalizedItems = (order.items || []).map((it) => {
      // Support beragam field name dari client (price / amount / cost / unitPrice)
      const rawPrice = it.price ?? it.amount ?? it.cost ?? it.unitPrice ?? it.unit_price ?? 0;
      const price = Math.round(Number(rawPrice) || 0);
      const quantity = Math.max(1, Math.round(Number(it.qty ?? it.quantity ?? 1)));
      return {
        name: String(it.name || it.title || 'Produk').slice(0, 100),
        quantity,
        price,
      };
    }).filter((it) => it.price > 0 && it.quantity > 0);

    if (normalizedItems.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Items pesanan tidak valid — tidak ada item dengan price > 0. Periksa data keranjang.',
          debug: { originalItems: order.items },
        },
        { status: 400 }
      );
    }

    // Pastikan total items match grandTotal shipping-exclusive — kalau tidak match, sesuaikan item terakhir
    const itemsSum = normalizedItems.reduce((s, it) => s + it.price * it.quantity, 0);
    const expectedSubtotal = Number(order.subtotal) || itemsSum;
    const amount = Math.round(expectedSubtotal + Number(order.shippingCost || 0));

    const payload = {
      order_id: orderId,
      payment_type: 'qris',
      amount,
      customer: {
        name: order.customer?.name || 'Pelanggan',
        email: order.customer?.email || 'customer@soraya.co',
        phone: order.customer?.phone || '08000000000',
      },
      items: normalizedItems,
    };

    const resp = await fetch(`${getBase()}/user/api/v1/user/payment/create`, {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await resp.text();
    let data;
    try { data = JSON.parse(text); } catch {
      return NextResponse.json(
        { success: false, message: `Komerce balas non-JSON (HTTP ${resp.status})` },
        { status: 502 }
      );
    }

    if (!resp.ok) {
      const errMsg = (data.meta && data.meta.message) || data.message || 'Gagal membuat QRIS';
      return NextResponse.json(
        { success: false, message: errMsg, raw: data },
        { status: resp.status }
      );
    }

    const d = data.data || data;
    // Simpan payment info ke order
    order.paymentId = d.payment_id || null;
    order.paymentUrl = d.payment_url || null;
    order.qrString = d.qr_string || null;
    order.paymentExpiry = d.expired_at || null;
    ORDERS.set(orderId, order);

    return NextResponse.json({
      success: true,
      token: null, // bukan Midtrans — frontend akan pakai redirect_url
      redirect_url: d.payment_url || null,
      orderNumber: order.number || orderId,
      qrString: d.qr_string || null,
      paymentId: d.payment_id || null,
      amount: d.amount || order.grandTotal,
      expiry: d.expired_at || null,
    });
  } catch (error) {
    console.error('payment/snap error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
