'use client';

import { useState, useEffect } from 'react';

export default function DestinationSearch({ onSelectDestination }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/komerce/destination?keyword=${encodeURIComponent(query)}`);
        const data = await res.json();
        
        if (data && Array.isArray(data.data)) {
          setResults(data.data);
        } else if (Array.isArray(data)) {
          setResults(data);
        } else {
          setResults([]);
        }
      } catch (err) {
        console.error('Error fetching destinations:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (item) => {
    setSelected(item);
    setQuery(`${item.subdistrict_name || item.label || item.name}, ${item.city_name || ''}`);
    setIsOpen(false);
    if (onSelectDestination) {
      onSelectDestination(item);
    }
  };

  return (
    <div className="relative w-full max-w-md">
      <label className="block text-xs font-semibold text-stone-600 mb-1">
        Kecamatan / Kota Tujuan
      </label>
      
      <input
        type="text"
        placeholder="Ketik minimal 3 huruf (misal: Banjarsari)"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setSelected(null);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        className="w-full bg-stone-50 border border-stone-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-stone-800 transition"
      />

      {loading && (
        <div className="absolute right-3 top-8 text-xs text-stone-400 animate-pulse">
          Mencari...
        </div>
      )}

      {isOpen && results.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border border-stone-200 rounded-lg shadow-lg max-h-60 overflow-y-auto text-sm">
          {results.map((item, idx) => (
            <li
              key={item.id || idx}
              onClick={() => handleSelect(item)}
              className="px-4 py-2.5 hover:bg-stone-100 cursor-pointer border-b border-stone-50 last:border-none"
            >
              <div className="font-medium text-stone-800">
                {item.subdistrict_name || item.name || item.label}
              </div>
              <div className="text-xs text-stone-500">
                {item.city_name ? `${item.city_name}, ${item.province_name || ''}` : item.zip_code}
              </div>
            </li>
          ))}
        </ul>
      )}

      {isOpen && !loading && query.length >= 3 && results.length === 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-stone-200 rounded-lg p-3 text-xs text-stone-500 text-center shadow-lg">
          Kecamatan tidak ditemukan.
        </div>
      )}

      {selected && (
        <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800">
          ✓ Destinasi Terpilih (ID: <strong>{selected.id || selected.destination_id}</strong>)
        </div>
      )}
    </div>
  );
}
