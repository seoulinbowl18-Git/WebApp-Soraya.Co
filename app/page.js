'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/soraya/Header';
import CategoryPills from '@/components/soraya/CategoryPills';
import ProductCard from '@/components/soraya/ProductCard';
import CartDrawer from '@/components/soraya/CartDrawer';
import ReferralTracker from '@/components/soraya/ReferralTracker';

function MainContent() {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState('Semua');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);

  const searchParams = useSearchParams();

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setCategory(cat);
  }, [searchParams]);

  useEffect(() => {
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
  }, []);

  const filtered = products.filter((p) => {
    const matchCat = category === 'Semua' || p.category === category;
    const matchSearch =
      !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-white">
      <ReferralTracker />
      <Header onSearch={setSearch} searchValue={search} onCartClick={() => setCartOpen(true)} />

      {/* --- BANNER HERO --- */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-4">
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

      {/* --- PILIHAN KATEGORI --- */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <CategoryPills activeCategory={category} onSelectCategory={setCategory} />
      </div>

      {/* --- GRID PRODUK --- */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 pb-16">
        {loading ? (
          <div className="text-center py-16 text-stone-500">Memuat produk...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-stone-500">Produk tidak ditemukan.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
            {filtered.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        )}
      </main>

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

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

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <MainContent />
    </Suspense>
  );
}
