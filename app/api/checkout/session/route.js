import { NextResponse } from 'next/server';

// In-memory store (shared with /api/komerce/order via globalThis)
globalThis.__SORAYA_ORDERS__ = globalThis.__SORAYA_ORDERS__ || new Map();
const ORDERS = globalThis.__SORAYA_ORDERS__;

// POST /api/checkout/session
// Body: { items: [{id,qty,name,price,image}], customer: {name,phone,email,address,destination}, shipping: {service, service_name, price}, affiliate_code? }
// Response: { success, order: { id, number, grandTotal } }
export async function POST(request) {
  try {
    const body = await request.json();
    const { items = [], customer = {}, shipping = {}, affiliate_code } = body;

    if (!customer.name || !customer.phone || !customer.address) {
      return NextResponse.json(
        { success: false, message: 'Data pelanggan belum lengkap (nama, nomor, alamat)' },
        { status: 400 }
      );
    }
    if (!customer.destination?.id) {
      return NextResponse.json(
        { success: false, message: 'Destinasi (kota/kecamatan) wajib dipilih' },
        { status: 400 }
      );
    }
    if (!items.length) {
      return NextResponse.json(
        { success: false, message: 'Keranjang kosong' },
        { status: 400 }
      );
    }

    const subtotal = items.reduce((s, it) => s + Number(it.price || 0) * Number(it.qty || 1), 0);
    const shippingCost = Number(shipping.price || 0);
    const grandTotal = Math.round(subtotal + shippingCost);

    const now = Date.now();
    const orderId = `SRY-${now}-${Math.floor(Math.random() * 9000) + 1000}`;
    const orderNumber = `SRY${String(now).slice(-6)}${Math.floor(Math.random() * 90) + 10}`;

    const order = {
      id: orderId,
      number: orderNumber,
      createdAt: new Date().toISOString(),
      status: 'awaiting_payment',
      paymentStatus: 'pending',
      paymentMethod: 'QRIS',
      customer,
      shipping,
      items,
      subtotal,
      shippingCost,
      grandTotal,
      affiliateCode: affiliate_code || null,
    };

    ORDERS.set(orderId, order);

    return NextResponse.json({
      success: true,
      order: { id: orderId, number: orderNumber, grandTotal, subtotal, shippingCost },
    });
  } catch (error) {
    console.error('checkout/session error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}

// GET /api/checkout/session?orderId=xxx (opsional, debug)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('orderId');
  if (!orderId) {
    const all = Array.from(ORDERS.values()).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    return NextResponse.json({ success: true, orders: all, total: all.length });
  }
  const order = ORDERS.get(orderId);
  if (!order) {
    return NextResponse.json({ success: false, message: 'Order tidak ditemukan' }, { status: 404 });
  }
  return NextResponse.json({ success: true, order });
}
