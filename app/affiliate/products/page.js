'use client';
import { useEffect, useState } from 'react';
import AffiliateShell from '@/components/soraya/AffiliateShell';
import { getAffiliateCode, formatIDR, imgUrl } from '@/lib/soraya';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Copy } from 'lucide-react';

export default function AffiliateProducts() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [affiliate, setAffiliate] = useState(null);
  const [code, setCode] = useState(null);

  useEffect(() => {
    const c = getAffiliateCode();
    if (!c) { router.push('/affiliate'); return; }
    setCode(c);
    fetch(`/api/affiliate/${c}`).then((r) => r.json()).then((d) => setAffiliate(d.affiliate));
    fetch('/api/products').then((r) => r.json()).then((d) => setProducts(d.items || []));
  }, []);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  function copyLink(id) {
    const link = `${origin}/product/${id}?ref=${code}`;
    navigator.clipboard.writeText(link);
    toast.success('Link disalin');
  }

  return (
    <AffiliateShell affiliate={affiliate}>
      <h1 className="text-3xl md:text-4xl font-extrabold font-geist">Katalog Komisi</h1>
      <p className="text-sm text-[#8A8A8A] mt-2">Semua produk Soraya.Co dengan rincian komisi per penjualan.</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mt-6">
        {products.map((p) => {
          const pct = p.commissionPct || 10;
          const payout = Math.round((p.price * pct) / 100);
          return (
            <div key={p.id} className="border border-[#E5E5E5]">
              <div className="relative bg-[#F5F5F5]" style={{ aspectRatio: '4 / 5' }}>
                <img src={imgUrl(p.image, 500, 625, 65)} alt="" className="w-full h-full object-cover" />
                <div className="absolute top-2 left-2 bg-black text-white text-[10px] font-bold px-2 py-1">{pct}% KOMISI</div>
              </div>
              <div className="p-3">
                <div className="text-sm font-medium line-clamp-2 min-h-[2.5rem]">{p.name}</div>
                <div className="text-xs text-[#8A8A8A] mt-1">{formatIDR(p.price)}</div>
                <div className="mt-2 text-xs font-bold text-[#1A1A1A] bg-[#F5F5F5] border border-black inline-block px-2 py-1">{formatIDR(payout)} / sale</div>
                <button onClick={() => copyLink(p.id)} className="mt-3 w-full h-10 bg-black text-white text-sm font-semibold inline-flex items-center justify-center gap-2"><Copy size={14}/> Dapatkan Link</button>
              </div>
            </div>
          );
        })}
      </div>
    </AffiliateShell>
  );
}
