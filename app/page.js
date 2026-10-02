'use client';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/soraya/Header';
import CategoryPills from '@/components/soraya/CategoryPills';
import ProductCard from '@/components/soraya/ProductCard';
import CartDrawer from '@/components/soraya/CartDrawer';
import { setRefCookie, getRefCookie } from '@/lib/soraya';
import Link from 'next/link';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [refBanner, setRefBanner] = useState(null);
  const searchParams = useSearchParams();

  // Capture ?ref= and persist 30d
  useEffect(() => {
    const r = searchParams.get('ref');
    if (r) {
      setRefCookie(r);
      setRefBanner(r);
      fetch('/api/affiliate/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref: r }),
      }).catch(() => {});
    } else {
      setRefBanner(getRefCookie());
    }
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category && category !== 'all') params.set('category', category);
    if (search) params.set('search', search);
    fetch('/api/products?' + params.toString())
      .then((r) => r.json())
      .then((d) => setProducts(d.items || []))
      .finally(() => setLoading(false));
  }, [category, search]);

  return (
    <div className="min-h-screen bg-white">
      <Header onSearch={setSearch} searchValue={search} onCartClick={() => setCartOpen(true)} />
      <CategoryPills value={category} onChange={setCategory} />

      {refBanner && (
        <div className="bg-[#111111] text-white text-xs text-center py-2 px-4">
          Shopping with referral <span className="font-bold">{refBanner}</span> — your purchase supports an affiliate partner.
        </div>
      )}

      <section className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight">Modest. Minimal. Soraya.</h1>
            <p className="text-sm text-[#8A8A8A] mt-1">New arrivals every week. Free shipping across Indonesia.</p>
          </div>
          <Link href="/affiliate" className="hidden md:inline-block text-sm font-semibold border border-black px-4 h-10 leading-10">
            Become an Affiliate →
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
          <div className="py-20 text-center text-[#8A8A8A]">No products found.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        )}
      </section>

      <footer className="border-t border-[#EEEEEE] mt-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 text-sm text-[#8A8A8A] flex flex-col md:flex-row justify-between gap-3">
          <div>© {new Date().getFullYear()} Soraya.Co — Modest wear for every day.</div>
          <div className="flex gap-6">
            <Link href="/affiliate" className="hover:text-black">Affiliate</Link>
            <a className="hover:text-black" href="#">About</a>
            <a className="hover:text-black" href="#">Contact</a>
          </div>
        </div>
      </footer>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
