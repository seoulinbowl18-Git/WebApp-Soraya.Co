'use client';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/soraya/Header';
import CartDrawer from '@/components/soraya/CartDrawer';
import { formatIDR, addToCart, setRefCookie, getRefCookie } from '@/lib/soraya';
import { toast } from 'sonner';
import { ChevronLeft } from 'lucide-react';

export default function ProductPage() {
  const { id } = useParams();
  const sp = useSearchParams();
  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    const r = sp.get('ref');
    if (r) {
      setRefCookie(r);
      fetch('/api/affiliate/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref: r, productId: id }),
      }).catch(() => {});
    }
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((d) => setP(d))
      .finally(() => setLoading(false));
  }, [id, sp]);

  if (loading) return <div className="min-h-screen bg-white"><Header onCartClick={() => setCartOpen(true)} /><div className="p-10 text-center text-[#8A8A8A]">Loading…</div></div>;
  if (!p || p.error) return <div className="min-h-screen bg-white"><Header onCartClick={() => setCartOpen(true)} /><div className="p-10 text-center">Product not found.</div></div>;

  const ref = getRefCookie();
  return (
    <div className="min-h-screen bg-white">
      <Header onCartClick={() => setCartOpen(true)} />
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
        <Link href="/" className="inline-flex items-center text-sm text-[#8A8A8A] hover:text-black"><ChevronLeft size={16} /> Back to shop</Link>
      </div>
      <section className="max-w-7xl mx-auto px-4 md:px-6 pb-10 grid md:grid-cols-2 gap-6 md:gap-10">
        <div className="bg-[#F5F5F5]" style={{ aspectRatio: '4 / 5' }}>
          <img src={`${p.image}?auto=format&fit=crop&w=1200&h=1500&q=80`} alt={p.name} className="w-full h-full object-cover" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-[#8A8A8A]">{p.category.replace('-', ' ')}</div>
          <h1 className="text-2xl md:text-4xl font-black mt-2 text-[#1A1A1A]">{p.name}</h1>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-2xl font-black text-black">{formatIDR(p.price)}</span>
            {p.originalPrice > p.price && <span className="text-sm text-[#8A8A8A] line-through">{formatIDR(p.originalPrice)}</span>}
          </div>
          <p className="mt-5 text-sm leading-relaxed text-[#333333]">{p.description}</p>
          {ref && <div className="mt-5 text-xs bg-[#F5F5F5] border border-[#E5E5E5] p-2">Referral <span className="font-bold">{ref}</span> active — purchase credits your affiliate partner.</div>}
          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center border border-[#E5E5E5] h-12">
              <button className="w-10 h-full text-lg" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
              <span className="w-10 text-center">{qty}</span>
              <button className="w-10 h-full text-lg" onClick={() => setQty(qty + 1)}>+</button>
            </div>
            <button
              onClick={() => { addToCart(p, qty); toast.success('Added to cart'); setCartOpen(true); }}
              className="flex-1 h-12 bg-black text-white font-semibold"
            >
              Add to Cart — {formatIDR(p.price * qty)}
            </button>
          </div>
          <div className="mt-8 border-t border-[#EEEEEE] pt-4 text-xs text-[#8A8A8A] grid grid-cols-3 gap-3">
            <div><div className="font-semibold text-black">Free Shipping</div>Orders over Rp 300.000</div>
            <div><div className="font-semibold text-black">Easy Returns</div>7-day exchange policy</div>
            <div><div className="font-semibold text-black">Secure Payment</div>BCA · DANA · QRIS</div>
          </div>
        </div>
      </section>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
