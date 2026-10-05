'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/soraya/Header';
import CategoryPills from '@/components/soraya/CategoryPills';
import ProductCard from '@/components/soraya/ProductCard';
import CartDrawer from '@/components/soraya/CartDrawer';
import ReferralTracker from '@/components/soraya/ReferralTracker';
import { getRefCookie } from '@/lib/soraya';
import Link from 'next/link';

function HomePageContent() {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [refBanner, setRefBanner] = useState(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Read ref after ReferralTracker has stored it
    const t = setTimeout(() => setRefBanner(getRefCookie()), 50);
    return () => clearTimeout(t);
  }, [searchParams]);

 useEffect(() => {
  setLoading(true);
  fetch('/api/products')
    .then((r) => r.json())
    .then((d) => {
      // Menangani jika API mengembalikan Array langsung atau Object { items: [...] }
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
  }, [category, search]);

  return (
    <div className="min-h-screen bg-white">
      <ReferralTracker />
      <Header onSearch={setSearch} searchValue={search} onCartClick={() => setCartOpen(true)} />

      {/* --- BANNER HERO --- */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-4">
        <div className="relative w-full overflow-hidden rounded-2xl mb-6 bg-black text-white shadow-lg">
          <div className="relative h-64 sm:h-80 md:h-96 w-full">
            <img
              src="https://i.ibb.co.com/TBp8HxGq/IMG-6406.jpg
"
              alt="Hero Promo Soraya.Co"
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-6 sm:p-10">
              <span className="inline-block bg-rose-600 text-white text-xs font-semibold px-3 py-1 rounded-full w-fit mb-3 uppercase tracking-wider">
                Promo Spesial
              </span>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-2">
                Koleksi Modest Wear Terbaru
              </h1>
              <p className="text-sm sm:text-base text-gray-200 max-w-xl mb-4">
                Dapatkan potongan harga menarik dan promo gratis ongkir ke seluruh Indonesia.
              </p>
              <div>
                <a
                  href="#produk"
                  className="inline-block bg-white text-black font-bold px-6 py-2.5 rounded-full text-sm hover:bg-gray-100 transition-all shadow-md"
                >
                  Belanja Sekarang →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CategoryPills value={category} onChange={setCategory} />

      {refBanner && (
        <div className="bg-[#111111] text-white text-xs text-center py-2 px-4">
          Berbelanja dengan kode referral <span className="font-bold">{refBanner}</span> — pembelian kamu mendukung mitra afiliasi.
        </div>
      )}

      <section id="produk" className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight font-geist">Outfit. Daily. Nyaman.</h1>
            <p className="text-sm text-[#8A8A8A] mt-1">Koleksi baru setiap minggu. Gratis ongkir ke seluruh Indonesia.</p>
          </div>
          <Link href="/affiliate" className="hidden md:inline-block text-sm font-semibold border border-black px-4 h-10 leading-10">
            Gabung Afiliasi →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-[#F5F5F5]" style={{ aspectRatio: '4 / 5' }} />
                <div className="h-4 bg-[#F5F5F5] mt-3 w-3/4" />
                <div className="h-4 bg-[#F5F5F5] mt-2 w-1/3" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center text-[#8A8A8A]">Produk tidak ditemukan.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        )}
      </section>

      <footer className="border-t border-[#EEEEEE] mt-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 text-sm text-[#8A8A8A] flex flex-col md:flex-row justify-between gap-3">
          <div>© {new Date().getFullYear()} Soraya.Co — Modest wear untuk setiap hari.</div>
          <div className="flex gap-6">
            <Link href="/affiliate" className="hover:text-black">Afiliasi</Link>
            <a className="hover:text-black" href="#">Tentang</a>
            <a className="hover:text-black" href="#">Kontak</a>
          </div>
        </div>
      </footer>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
      <HomePageContent />
    </Suspense>
  );
}
