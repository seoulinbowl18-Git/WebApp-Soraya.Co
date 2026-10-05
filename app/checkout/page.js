'use client';
import { useState } from 'react';
import DestinationSearch from '@/components/DestinationSearch';
import ShippingOptions from '@/components/ShippingOptions';

export default function CheckoutPage() {
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [selectedCourier, setSelectedCourier] = useState(null);
  const [loading, setLoading] = useState(false);

  const subtotal = 185000; // Contoh harga produk
  const ongkir = selectedCourier ? (selectedCourier.price || selectedCourier.tariff || 0) : 0;
  const grandTotal = subtotal + ongkir;

  const handleCreateOrder = async () => {
    if (!selectedDestination || !selectedCourier) return;

    setLoading(true);
    try {
      const response = await fetch('/api/komerce/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: 'Pelanggan Soraya',
          customerPhone: '0852156666',
          destinationId: selectedDestination.id || selectedDestination.subdistrict_id,
          addressDetail: 'Alamat Pelanggan',
          courierCode: selectedCourier.code || 'jne',
          shippingCost: ongkir,
          paymentMethod: 'COD',
          items: [
            {
              name: 'Soraya Blouse Linen Beige',
              qty: 1,
              price: subtotal
            }
          ]
        })
      });

      if (response.ok) {
        window.location.href = '/checkout/success';
      }
    } catch (err) {
      console.error('Gagal membuat pesanan:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-6 p-4 bg-white border rounded-lg space-y-4">
      <h1 className="text-base font-bold border-b pb-2">Checkout & Pengiriman</h1>

      {/* 1. Pencarian Kecamatan Komerce */}
      <div>
        <label className="block text-xs font-semibold mb-1">Kecamatan / Kota Tujuan</label>
        <DestinationSearch onSelectDestination={(dest) => setSelectedDestination(dest)} />
      </div>

      {/* 2. Pilihan Kurir & Ongkir Komerce */}
      {selectedDestination && (
        <ShippingOptions 
          destinationId={selectedDestination.id || selectedDestination.subdistrict_id} 
          weight={1000} 
          onSelectCourier={(courier) => setSelectedCourier(courier)} 
        />
      )}

      {/* 3. Ringkasan Biaya */}
      <div className="border-t pt-3 space-y-1 text-xs">
        <div className="flex justify-between">
          <span>Subtotal Produk:</span>
          <span>Rp {subtotal.toLocaleString('id-ID')}</span>
        </div>
        <div className="flex justify-between">
          <span>Ongkos Kirim:</span>
          <span>Rp {ongkir.toLocaleString('id-ID')}</span>
        </div>
        <div className="flex justify-between font-bold text-sm border-t pt-2 mt-2">
          <span>Total Bayar (COD):</span>
          <span>Rp {grandTotal.toLocaleString('id-ID')}</span>
        </div>
      </div>

      <button 
        onClick={handleCreateOrder}
        disabled={!selectedCourier || loading}
        className="w-full py-3 bg-black text-white text-xs font-bold rounded-md disabled:bg-gray-300"
      >
        {loading ? 'Memproses Pesanan...' : 'Buat Pesanan Komerce (COD)'}
      </button>
    </div>
  );
}
