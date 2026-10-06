'use client';
import { useState, useEffect, useRef } from 'react';
import DestinationSearch from '@/components/DestinationSearch';
import ShippingOptions from '@/components/ShippingOptions';
import QRCode from 'qrcode';

export default function CheckoutPage() {
  // Customer
  const [name, setName] = useState('Pelanggan Soraya');
  const [phone, setPhone] = useState('0852156666');
  const [email, setEmail] = useState('lazkids02@gmail.com');
  const [addressDetail, setAddressDetail] = useState('');

  // Shipping
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [selectedCourier, setSelectedCourier] = useState(null);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState('COD'); // 'COD' | 'QRIS'

  // Order & QRIS state
  const [order, setOrder] = useState(null);
  const [qris, setQris] = useState(null); // { qrString, qrUrl, paymentUrl, paymentId, amount, expiry }
  const [qrDataUrl, setQrDataUrl] = useState(''); // dataURL from qrcode lib
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pollRef = useRef(null);

  // Dummy produk — nanti bisa diambil dari cart/session
  const items = [
    { name: 'Soraya Blouse Linen Beige', qty: 1, price: 185000 },
  ];
  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
  const ongkir = selectedCourier
    ? Number(selectedCourier.price || selectedCourier.tariff || 0)
    : 0;
  const grandTotal = subtotal + ongkir;

  // Generate QR image dari qrString
  useEffect(() => {
    if (qris?.qrString) {
      QRCode.toDataURL(qris.qrString, { width: 320, margin: 2 })
        .then((url) => setQrDataUrl(url))
        .catch((e) => console.error('QR generate error:', e));
    } else {
      setQrDataUrl('');
    }
  }, [qris?.qrString]);

  // Polling status QRIS
  useEffect(() => {
    if (!qris?.paymentId || paymentMethod !== 'QRIS' || paymentStatus === 'PAID') {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/komerce/payment/status?paymentId=${encodeURIComponent(qris.paymentId)}`
        );
        const data = await res.json();
        if (data.success && data.status) {
          const normalized = String(data.status).toUpperCase();
          setPaymentStatus(normalized);
          if (['PAID', 'SETTLEMENT', 'SUCCESS'].includes(normalized)) {
            await fetch('/api/komerce/order', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: order.orderId,
                status: 'confirmed',
                paymentStatus: 'paid',
              }),
            });
            clearInterval(pollRef.current);
            setTimeout(() => {
              window.location.href = `/checkout/success?orderId=${order.orderId}`;
            }, 800);
          }
        }
      } catch (e) {
        console.error('Poll error:', e);
      }
    }, 4000);
    return () => clearInterval(pollRef.current);
  }, [qris?.paymentId, order?.orderId, paymentMethod, paymentStatus]);

  const canSubmit =
    name &&
    phone &&
    addressDetail &&
    selectedDestination &&
    selectedCourier &&
    !loading &&
    !order;

  const handlePlaceOrder = async () => {
    setError('');
    setLoading(true);
    try {
      // 1. Create order (store locally)
      const orderRes = await fetch('/api/komerce/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: name,
          customerPhone: phone,
          customerEmail: email,
          destinationId:
            selectedDestination.id || selectedDestination.subdistrict_id,
          addressDetail,
          courierCode: selectedCourier.code || selectedCourier.courier_code || 'jne',
          courierService:
            selectedCourier.service || selectedCourier.service_name || '',
          shippingCost: ongkir,
          paymentMethod,
          subtotal,
          items,
        }),
      });
      const orderData = await orderRes.json();
      if (!orderData.success) {
        throw new Error(orderData.message || 'Gagal membuat pesanan');
      }
      setOrder(orderData.order);

      if (paymentMethod === 'COD') {
        setTimeout(() => {
          window.location.href = `/checkout/success?orderId=${orderData.order.orderId}`;
        }, 500);
        return;
      }

      // 2. For QRIS → generate QR
      const qrRes = await fetch('/api/komerce/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderData.order.orderId,
          amount: grandTotal,
          customerName: name,
          customerEmail: email,
          customerPhone: phone,
          items,
        }),
      });
      const qrData = await qrRes.json();
      if (!qrData.success) {
        throw new Error(qrData.message || 'Gagal generate QRIS');
      }
      setQris(qrData);
      setPaymentStatus('pending');
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setOrder(null);
    setQris(null);
    setQrDataUrl('');
    setPaymentStatus(null);
    setError('');
  };

  // === Render ===
  return (
    <div className="min-h-screen bg-stone-50 py-6 px-3">
      <div className="max-w-md mx-auto bg-white border rounded-xl shadow-sm p-5 space-y-5">
        <div className="flex items-center justify-between border-b pb-3">
          <h1 className="text-base font-bold">Checkout — Soraya.Co</h1>
          <a href="/" className="text-xs text-stone-500 hover:underline">
            ← Kembali
          </a>
        </div>

        {/* ====== QRIS payment screen ====== */}
        {qris && order && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-xs text-stone-500">Order ID</p>
              <p className="text-sm font-mono font-bold">{order.orderId}</p>
              {qris.paymentId && (
                <p className="text-[10px] text-stone-400 font-mono mt-1">
                  Payment ID: {qris.paymentId}
                </p>
              )}
            </div>

            <div className="bg-stone-100 border rounded-lg p-4 text-center">
              <p className="text-xs text-stone-600 mb-2">Scan QRIS untuk membayar</p>
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QRIS"
                  className="mx-auto w-56 h-56 border bg-white rounded"
                />
              ) : qris.qrUrl ? (
                <img
                  src={qris.qrUrl}
                  alt="QRIS"
                  className="mx-auto w-56 h-56 border bg-white rounded"
                />
              ) : (
                <div className="text-xs text-stone-500">Memuat QR…</div>
              )}
              <p className="mt-3 text-xs text-stone-500">Nominal</p>
              <p className="text-xl font-bold">
                Rp {Number(qris.amount || grandTotal).toLocaleString('id-ID')}
              </p>
              {qris.paymentUrl && (
                <a
                  href={qris.paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block w-full py-2 bg-emerald-600 text-white text-xs font-bold rounded hover:bg-emerald-700"
                >
                  Buka Halaman Pembayaran →
                </a>
              )}
              {qris.expiry && (
                <p className="mt-2 text-[10px] text-stone-500">
                  Berlaku hingga: {new Date(qris.expiry).toLocaleString('id-ID')}
                </p>
              )}
            </div>

            <div className="text-center space-y-1">
              <p className="text-xs font-semibold">
                Status:{' '}
                <span
                  className={
                    ['PAID', 'SETTLEMENT', 'SUCCESS'].includes(String(paymentStatus).toUpperCase())
                      ? 'text-emerald-600'
                      : 'text-amber-600'
                  }
                >
                  {paymentStatus || 'PENDING'}
                </span>
              </p>
              <p className="text-xs text-stone-500">
                Halaman ini otomatis cek pembayaran tiap 4 detik…
              </p>
            </div>

            <button
              onClick={resetFlow}
              className="w-full py-2 text-xs text-stone-600 border border-stone-300 rounded hover:bg-stone-50"
            >
              Batalkan & Buat Ulang
            </button>
          </div>
        )}

        {/* ====== Form flow (sebelum order dibuat) ====== */}
        {!qris && !order && (
          <>
            {/* Customer */}
            <section className="space-y-2">
              <h2 className="text-xs font-bold text-stone-700">
                Data Pelanggan
              </h2>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama Lengkap"
                className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-stone-800"
              />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Nomor WhatsApp"
                className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-stone-800"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-stone-800"
              />
            </section>

            {/* Alamat */}
            <section className="space-y-2">
              <h2 className="text-xs font-bold text-stone-700">
                Alamat Pengiriman
              </h2>
              <DestinationSearch
                onSelectDestination={(dest) => setSelectedDestination(dest)}
              />
              <textarea
                value={addressDetail}
                onChange={(e) => setAddressDetail(e.target.value)}
                placeholder="Detail alamat (jalan, nomor rumah, patokan…)"
                rows={2}
                className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-stone-800"
              />
            </section>

            {/* Ongkir */}
            {selectedDestination && (
              <section>
                <ShippingOptions
                  destinationId={
                    selectedDestination.id || selectedDestination.subdistrict_id
                  }
                  weight={1000}
                  onSelectCourier={(c) => setSelectedCourier(c)}
                />
              </section>
            )}

            {/* Payment method */}
            <section className="space-y-2">
              <h2 className="text-xs font-bold text-stone-700">
                Metode Pembayaran
              </h2>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('COD')}
                  className={`py-2.5 text-xs font-bold rounded-md border ${
                    paymentMethod === 'COD'
                      ? 'border-black bg-black text-white'
                      : 'border-stone-300 bg-white text-stone-700'
                  }`}
                >
                  COD (Bayar di Tempat)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('QRIS')}
                  className={`py-2.5 text-xs font-bold rounded-md border ${
                    paymentMethod === 'QRIS'
                      ? 'border-black bg-black text-white'
                      : 'border-stone-300 bg-white text-stone-700'
                  }`}
                >
                  QRIS (Komerce)
                </button>
              </div>
            </section>

            {/* Ringkasan */}
            <section className="border-t pt-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span>Ongkos Kirim:</span>
                <span>Rp {ongkir.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between font-bold text-sm border-t pt-2 mt-2">
                <span>Total:</span>
                <span>Rp {grandTotal.toLocaleString('id-ID')}</span>
              </div>
            </section>

            {error && (
              <div className="text-xs bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded">
                {error}
              </div>
            )}

            <button
              onClick={handlePlaceOrder}
              disabled={!canSubmit}
              className="w-full py-3 bg-black text-white text-xs font-bold rounded-md disabled:bg-stone-300"
            >
              {loading
                ? 'Memproses…'
                : paymentMethod === 'QRIS'
                ? `Bayar QRIS Rp ${grandTotal.toLocaleString('id-ID')}`
                : `Buat Pesanan COD`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
