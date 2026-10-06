import { NextResponse } from 'next/server';

const getKomerceBaseUrl = () => {
  const isSandbox = (process.env.KOMERCE_IS_SANDBOX || 'true').toLowerCase() === 'true';
  return isSandbox
    ? 'https://api-sandbox.collaborator.komerce.id'
    : 'https://api.collaborator.komerce.id';
};

// GET /api/komerce/payment/status?orderId=xxx
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: 'orderId wajib diisi' },
        { status: 400 }
      );
    }

    const apiKey = process.env.KOMERCE_PAYMENT_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: 'KOMERCE_PAYMENT_KEY belum di-set' },
        { status: 500 }
      );
    }

    const baseUrl = getKomerceBaseUrl();
    const endpoint = `${baseUrl}/user/api/v1/user/payment/status/${encodeURIComponent(orderId)}`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: result.message || result.error || 'Gagal cek status',
          raw: result,
        },
        { status: response.status }
      );
    }

    const data = result.data || result;
    return NextResponse.json({
      success: true,
      orderId: data.order_id || orderId,
      status: data.status || data.payment_status || 'pending',
      amount: data.amount || null,
      paidAt: data.paid_at || null,
      raw: result,
    });
  } catch (error) {
    console.error('Komerce Payment Status Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
