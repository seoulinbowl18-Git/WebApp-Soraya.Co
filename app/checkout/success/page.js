'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function SuccessContent() {
  const params = useSearchParams();
  const orderId = params.get('orderId');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return setLoading(false);
    fetch(`/api/komerce/order?orderId=${orderId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setOrder(d.order);
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4 py-10">
      <div className="max-w-md w-full bg-white border rounded-xl p-6 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl">
          ✓
        </div>
        <h1 className="text-lg font-bold">Pesanan Berhasil!</h1>
        {loading ? (
          <p className="text-sm text-stone-500">Memuat detail…</p>
        ) : order ? (
          <div className="text-left bg-stone-50 border rounded-lg p-4 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-stone-500">Order ID:</span>
              <span className="font-mono font-bold">{order.orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Pembayaran:</span>
              <span className="font-bold">{order.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Status:</span>
              <span className="font-bold uppercase text-emerald-700">
                {order.paymentStatus}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Kurir:</span>
              <span>
                {(order.shipping?.courierCode || '').toUpperCase()}{' '}
                {order.shipping?.courierService || ''}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2 mt-2 font-bold">
              <span>Total:</span>
              <span>Rp {Number(order.grandTotal).toLocaleString('id-ID')}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-red-600">Pesanan tidak ditemukan.</p>
        )}
        <a
          href="/"
          className="inline-block w-full py-2.5 bg-black text-white text-xs font-bold rounded-md"
        >
          Lanjut Belanja
        </a>
      </div>
    </div>
  );
}

export default function CheckoutSuccess() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm">Memuat…</div>}>
      <SuccessContent />
    </Suspense>
  );
}
