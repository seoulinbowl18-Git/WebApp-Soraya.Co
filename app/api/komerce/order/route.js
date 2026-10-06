import { NextResponse } from 'next/server';

// In-memory order store (sementara, untuk testing dummy)
// Pada produksi, akan diganti ke MongoDB
globalThis.__SORAYA_ORDERS__ = globalThis.__SORAYA_ORDERS__ || new Map();
const ORDERS = globalThis.__SORAYA_ORDERS__;

// POST /api/komerce/order
// Body: { customerName, customerPhone, customerEmail, destinationId, addressDetail,
//         courierCode, courierService, shippingCost, paymentMethod, subtotal, items }
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      customerName,
      customerPhone,
      customerEmail,
      destinationId,
      addressDetail,
      courierCode,
      courierService,
      shippingCost = 0,
      paymentMethod = 'COD',
      subtotal = 0,
      items = [],
    } = body;

    // Validasi minimal
    if (!customerName || !customerPhone || !destinationId || !items.length) {
      return NextResponse.json(
        { success: false, message: 'Data pesanan tidak lengkap' },
        { status: 400 }
      );
    }

    // Generate order ID
    const orderId = `SRY-${Date.now()}-${Math.floor(Math.random() * 9000) + 1000}`;
    const grandTotal = Math.round(Number(subtotal) + Number(shippingCost));

    const order = {
      orderId,
      createdAt: new Date().toISOString(),
      status: paymentMethod === 'COD' ? 'confirmed' : 'awaiting_payment',
      paymentMethod,
      paymentStatus: paymentMethod === 'COD' ? 'cod' : 'pending',
      customer: {
        name: customerName,
        phone: customerPhone,
        email: customerEmail || null,
      },
      shipping: {
        destinationId,
        addressDetail: addressDetail || '',
        courierCode: courierCode || '',
        courierService: courierService || '',
        cost: Number(shippingCost),
      },
      items,
      subtotal: Number(subtotal),
      shippingCost: Number(shippingCost),
      grandTotal,
    };

    ORDERS.set(orderId, order);

    return NextResponse.json({
      success: true,
      message: 'Pesanan berhasil dibuat',
      order,
    });
  } catch (error) {
    console.error('Order Create Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}

// GET /api/komerce/order?orderId=xxx (atau tanpa param = list semua)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (orderId) {
      const order = ORDERS.get(orderId);
      if (!order) {
        return NextResponse.json(
          { success: false, message: 'Pesanan tidak ditemukan' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, order });
    }

    // List all (buat admin dummy)
    const all = Array.from(ORDERS.values()).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    return NextResponse.json({ success: true, orders: all, total: all.length });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}

// PATCH /api/komerce/order (update status, dipakai setelah QRIS paid)
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { orderId, status, paymentStatus } = body;

    const order = ORDERS.get(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Pesanan tidak ditemukan' },
        { status: 404 }
      );
    }

    if (status) order.status = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    order.updatedAt = new Date().toISOString();

    ORDERS.set(orderId, order);

    return NextResponse.json({ success: true, order });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
