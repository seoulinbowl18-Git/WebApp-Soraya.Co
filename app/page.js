'use client';

import { useState, useEffect } from 'react';

export default function Page() {
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState('Semua');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    setLoading(true);
    fetch('/api/products')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) {
          setProducts(d);
        } else if (d && Array.isArray(d.items)) {
          setProducts(d.items);
        } else if (d && Array.isArray(d.products)) {
          setProducts(d.products);
        } else {
          setProducts([]);
        }
      })
      .catch((err) => {
        console.error('Fetch error:', err);
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, [mounted]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 text-stone-500">
        Memuat Soraya.Co...
      </div>
    );
  }

  const categories = ['Semua', 'Atasan (Top)', 'Blouse', 'Tunik Rayon', 'Gamis Maxy', 'Midi Dress', 'Setelan', 'Pyajamas'];

  const filtered = (products || []).filter((p) => {
    if (!p) return false;
    const matchCat = category === 'Semua' || p.category === category;
    const matchSearch =
      !search ||
      (p.name && p.name.toLowerCase().includes(search.toLowerCase())) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-white text-stone-800 font-sans">
      {/* HEADER */}
      <header className="border-b border-stone-200 sticky top-0 bg-white/90 backdrop-blur z-10 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <a href="/" className="text-xl font-serif font-bold text-stone-900">
            Soraya.Co
          </a>
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Cari produk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-stone-100 px-4 py-2 rounded-full text-sm outline-none focus:ring-2 focus:ring-stone-300"
            />
          </div>
          <a href="/affiliate" className="text-sm font-medium hover:underline">
            Afiliasi
          </a>
        </div>
      </header>

      {/* HERO BANNER */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6">
        <div className="bg-stone-100 rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-serif text-stone-900 mb-2">
              Modest. Minimal. Soraya.
            </h1>
            <p className="text-stone-600 text-sm md:text-base">
              Koleksi baru setiap minggu. Gratis ongkir ke seluruh Indonesia.
            </p>
          </div>
          <a
            href="/affiliate"
            className="px-6 py-3 bg-stone-900 text-white rounded-full text-sm font-medium hover:bg-stone-800 transition whitespace-nowrap"
          >
            Gabung Afiliasi &rarr;
          </a>
        </div>
      </div>

      {/* CATEGORY PILLS */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 flex gap-2 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-full text-xs md:text-sm font-medium whitespace-nowrap transition ${
              category === cat
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* PRODUCT GRID */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 pb-16">
        {loading ? (
          <div className="text-center py-16 text-stone-500">Memuat produk...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-stone-500">Produk tidak ditemukan.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
            {filtered.map((prod) => (
              <a
                key={prod.id || prod._id || Math.random()}
                href={`/product/${prod.id || prod._id || '1'}`}
                className="group border border-stone-100 rounded-xl overflow-hidden hover:shadow-lg transition bg-white block"
              >
                <div className="aspect-[3/4] bg-stone-100 overflow-hidden relative">
                  <img
                    src={prod.image || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800'}
                    alt={prod.name || 'Produk'}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-sm text-stone-900 line-clamp-1">
                    {prod.name}
                  </h3>
                  <p className="text-xs text-stone-500 mt-1">{prod.category}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-semibold text-sm text-stone-900">
                      Rp {Number(prod.price || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-stone-200 py-8 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between text-xs text-stone-500 gap-4">
          <p>&copy; {new Date().getFullYear()} Soraya.Co &mdash; Modest wear untuk setiap hari.</p>
          <div className="flex gap-4">
            <a href="/affiliate" className="hover:underline">Afiliasi</a>
            <a href="#" className="hover:underline">Tentang</a>
            <a href="#" className="hover:underline">Kontak</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
