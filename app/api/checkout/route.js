import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import {
  createSnapTransaction,
  getMidtransServerKey,
  getMidtransClientKey,
  describeMidtransError,
  sanitizeLineItems,
  FALLBACK_MIDTRANS_SERVER_KEY,
  FALLBACK_MIDTRANS_CLIENT_KEY,
} from '@/lib/midtrans';

const SERVER_KEY = getMidtransServerKey() || FALLBACK_MIDTRANS_SERVER_KEY;
const CLIENT_KEY = getMidtransClientKey() || FALLBACK_MIDTRANS_CLIENT_KEY;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function fail(message, status = 400, extra = {}) {
  return NextResponse.json({ success: false, message, ...extra }, { status });
}

let mongoClient;
async function saveOrderBestEffort(order) {
  if (!process.env.MONGO_URL) return false;
  try {
    if (!mongoClient) {
      mongoClient = new MongoClient(process.env.MONGO_URL, { serverSelectionTimeoutMS: 4000 });
    }
    await mongoClient.connect();
    await mongoClient.db(process.env.DB_NAME || 'soraya_co').collection('orders').insertOne({ ...order });
    return true;
  } catch (e) {
    console.error('Checkout: gagal simpan order ke MongoDB:', e?.message || e);
    return false;
  }
}

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return fail('Body request harus JSON yang valid');
    }

    if (!SERVER_KEY) return fail('Midtrans server key belum dikonfigurasi', 500);

    const { lines, error } = sanitizeLineItems(body.items);
    if (error) return fail(error);

    const shipping = body.shipping || null;
    const shippingCost = Math.max(0, Math.round(Number(shipping?.price) || 0));
    const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);
    const total = subtotal + shippingCost;

    const customer = body.customer || {};
    const nameParts = String(customer.name || 'Soraya Customer').trim().split(/\s+/);
    const orderNumber = 'SOR-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();

    const parameter = {
      transaction_details: { order_id: orderNumber, gross_amount: total },
      item_details: [
        ...lines.map(({ id, name, price, quantity }) => ({ id, name, price, quantity })),
        ...(shippingCost > 0
          ? [{ id: 'SHIP', name: `Ongkir ${shipping.service_name || shipping.service || ''}`.trim().slice(0, 50), price: shippingCost, quantity: 1 }]
          : []),
      ],
      customer_details: {
        first_name: nameParts[0] || 'Soraya',
        last_name: nameParts.slice(1).join(' ') || 'Customer',
        email: customer.email || 'buyer@soraya.co',
        phone: customer.phone || '08000000000',
        shipping_address: customer.address
          ? { first_name: nameParts[0] || 'Soraya', phone: customer.phone || '', address: String(customer.address).slice(0, 200) }
          : undefined,
      },
    };

    let tx;
    try {
      tx = await createSnapTransaction(parameter);
    } catch (e) {
      console.error('Midtrans Snap error:', e?.httpStatusCode, e?.ApiResponse || e?.message);
      const upstreamStatus = Number(e?.httpStatusCode) || 0;
      return fail('Midtrans: ' + describeMidtransError(e), upstreamStatus >= 400 && upstreamStatus < 500 ? 400 : 500, {
        upstream: e?.ApiResponse || null,
      });
    }

    if (!tx?.token) return fail('Midtrans tidak mengembalikan snap token', 500);

    const order = {
      id: uuidv4(),
      orderNumber,
      items: lines.map(({ id, name, price, quantity, image }) => ({ id, name, price, qty: quantity, image })),
      subtotal,
      shipping,
      shippingCost,
      total,
      ref: body.affiliate_code || body.ref || null,
      customer,
      paymentStatus: 'pending',
      status: 'pending_validation',
      midtransToken: tx.token,
      midtransRedirect: tx.redirect_url,
      createdAt: new Date().toISOString(),
    };
    const saved = await saveOrderBestEffort(order);

    return NextResponse.json({
      success: true,
      snapToken: tx.token,
      redirectUrl: tx.redirect_url,
      orderId: order.id,
      orderNumber,
      total,
      clientKey: CLIENT_KEY,
      orderSaved: saved,
    });
  } catch (e) {
    console.error('Checkout fatal error:', e?.message || e);
    return fail(e?.message || 'Terjadi kesalahan server saat checkout', 500);
  }
}
