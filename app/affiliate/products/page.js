'use client';
import { useEffect, useState } from 'react';
import Header from '@/components/soraya/Header';
import { SubNav } from '@/app/affiliate/dashboard/page';
import { getAffiliateCode, formatIDR } from '@/lib/soraya';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function AffiliateProducts() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [code, setCode] = useState(null);

  useEffect(() => {
    const c = getAffiliateCode();
    if (!c) { router.push('/affiliate'); return; }
    setCode(c);
    fetch('/api/products').then((r) => r.json()).then((d) => setProducts(d.items || []));
  }, []);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  function copyLink(id) {
    const link = `${origin}/product/${id}?ref=${code}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copied');
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        <h1 className="text-3xl md:text-4xl font-black">Commission Catalog</h1>
        <SubNav active="products" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mt-6">
          {products.map((p) => {
            const pct = p.commissionPct || 10;
            const payout = Math.round((p.price * pct) / 100);
            return (
              <div key={p.id} className="border border-[#E5E5E5]">
                <div className="relative bg-[#F5F5F5]" style={{ aspectRatio: '4 / 5' }}>
                  <img src={`${p.image}?auto=format&fit=crop&w=500&h=625&q=65`} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="p-3">
                  <div className="text-sm font-medium line-clamp-2 min-h-[2.5rem]">{p.name}</div>
                  <div className="text-xs text-[#8A8A8A] mt-1">{formatIDR(p.price)}</div>
                  <div className="mt-2 text-xs font-bold">{pct}% Commission · {formatIDR(payout)} / sale</div>
                  <button onClick={() => copyLink(p.id)} className="mt-3 w-full h-10 bg-black text-white text-sm font-semibold">Copy My Link</button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
