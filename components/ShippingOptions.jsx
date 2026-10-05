'use client';
import { useState, useEffect } from 'react';

export default function ShippingOptions({ destinationId, weight = 1000, onSelectCourier }) {
  const [couriers, setCouriers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!destinationId) return;

    const fetchOngkir = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/komerce/shipping-cost', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ destination: destinationId, weight: weight })
        });
        const result = await res.json();
        setCouriers(result.data || result.results || []);
      } catch (err) {
        console.error("Gagal mengambil tarif ongkir:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOngkir();
  }, [destinationId, weight]);

  if (loading) return <p className="text-xs text-gray-500 my-2">Sedang menghitung ongkos kirim...</p>;
  if (!destinationId) return null;

  return (
    <div className="mt-4">
      <label className="block text-xs font-semibold mb-2">Pilih Jasa Pengiriman:</label>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {couriers.map((item, idx) => (
          <div
            key={idx}
            onClick={() => {
              setSelected(idx);
              onSelectCourier(item);
            }}
            className={`p-3 border rounded-lg cursor-pointer flex justify-between items-center text-xs ${
              selected === idx ? 'border-black bg-gray-50' : 'border-gray-200'
            }`}
          >
            <div>
              <p className="font-bold uppercase">{item.code || item.courier_name} - {item.service || item.service_name}</p>
              <p className="text-gray-500">Estimasi: {item.etd || item.etd_days || '1-3'} hari</p>
            </div>
            <p className="font-bold text-sm">Rp {(item.price || item.tariff || 0).toLocaleString('id-ID')}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
