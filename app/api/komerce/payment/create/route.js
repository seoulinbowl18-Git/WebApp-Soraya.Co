import { NextResponse } from 'next/server';

// Base URL helper
const getKomerceBaseUrl = () => {
  const isSandbox = (process.env.KOMERCE_IS_SANDBOX || 'true').toLowerCase() === 'true';
  return isSandbox
    ? 'https://api-sandbox.collaborator.komerce.id'
    : 'https://api.collaborator.komerce.id';
};

// POST /api/komerce/payment/create
// Body: { orderId, amount, customerName, customerEmail, customerPhone, items: [{name, qty, price}] }
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      orderId,
      amount,
      customerName,
      customerEmail,
      customerPhone,
      items = [],
    } = body;

    if (!orderId || !amount) {
      return NextResponse.json(
        { success: false, message: 'orderId dan amount wajib diisi' },
        { status: 400 }
      );
    }

    if (amount < 10000) {
      return NextResponse.json(
        { success: false, message: 'Minimum amount QRIS adalah Rp 10.000' },
        { status: 400 }
      );
    }

    const apiKey = process.env.KOMERCE_PAYMENT_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: 'KOMERCE_PAYMENT_KEY belum di-set di environment' },
        { status: 500 }
      );
    }

    const baseUrl = getKomerceBaseUrl();
    const endpoint = `${baseUrl}/user/api/v1/user/payment/create`;

    // Normalisasi items — Komerce wajib { name, quantity, price (int > 0) }
    const normalizedItems = (items || []).map((it) => {
      const rawPrice = it.price ?? it.amount ?? it.cost ?? it.unitPrice ?? it.unit_price ?? 0;
      const rawQty = it.qty ?? it.quantity ?? 1;
      return {
        name: String(it.name || it.title || 'Produk').slice(0, 100),
        quantity: Math.max(1, Math.round(Number(rawQty) || 1)),
        price: Math.round(Number(rawPrice) || 0),
      };
    }).filter((it) => it.price > 0);

    if (normalizedItems.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Items tidak valid — tidak ada item dengan price > 0',
          debug: { originalItems: items },
        },
        { status: 400 }
      );
    }

    const payload = {
      order_id: orderId,
      payment_type: 'qris',
      amount: Math.round(amount),
      customer: {
        name: customerName || 'Pelanggan',
        email: customerEmail || 'customer@soraya.co',
        phone: customerPhone || '08000000000',
      },
      items: normalizedItems,
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      const errMsg =
        (result.meta && result.meta.message) ||
        result.message ||
        result.error ||
        'Gagal membuat QRIS';
      return NextResponse.json(
        {
          success: false,
          message: errMsg,
          raw: result,
        },
        { status: response.status }
      );
    }

    // Normalize response. Komerce returns { meta, data } with payment_id, payment_url, qr_string, status, expired_at
    const data = result.data || result;
    return NextResponse.json({
      success: true,
      orderId: data.order_id || orderId,
      qrString: data.qr_string || data.qris_string || null,
      qrUrl: data.qr_url || data.qris_image_url || null,
      paymentUrl: data.payment_url || null,
      amount: data.amount || amount,
      expiry: data.expired_at || data.expiry || null,
      paymentId: data.payment_id || data.transaction_id || null,
      externalId: data.external_id || null,
      status: data.status || 'PENDING',
      raw: result,
    });
  } catch (error) {
    console.error('Komerce Payment Create Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
