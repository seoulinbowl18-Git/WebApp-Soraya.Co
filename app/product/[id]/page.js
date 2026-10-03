'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/soraya/Header';
import CartDrawer from '@/components/soraya/CartDrawer';
import ReferralTracker from '@/components/soraya/ReferralTracker';
import { formatIDR, addToCart, getRefCookie, imgUrl } from '@/lib/soraya';
import { toast } from 'sonner';
import { ChevronLeft } from 'lucide-react';

export default function ProductPage() {
  const { id } = useParams();
  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [ref, setRef] = useState(null);

  useEffect(() => {
    fetch(`/api/products/${id}`).then((r) => r.json()).then((d) => setP(d)).finally(() => setLoading(false));
    const t = setTimeout(() => setRef(getRefCookie()), 100);
    return () => clearTimeout(t);
  }, [id]);

  if (loading) return <div className="min-h-screen bg-white"><ReferralTracker /><Header onCartClick={() => setCartOpen(true)} /><div className="p-10 text-center text-[#8A8A8A]">Memuat…</div></div>;
  if (!p || p.error) return <div className="min-h-screen bg-white"><ReferralTracker /><Header onCartClick={() => setCartOpen(true)} /><div className="p-10 text-center">Produk tidak ditemukan.</div></div>;

  return (
    <div className="min-h-screen bg-white">
      <ReferralTracker />
      <Header onCartClick={() => setCartOpen(true)} />
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
        <Link href="/" className="inline-flex items-center text-sm text-[#8A8A8A] hover:text-black"><ChevronLeft size={16} /> Kembali ke toko</Link>
      </div>
      <section className="max-w-7xl mx-auto px-4 md:px-6 pb-10 grid md:grid-cols-2 gap-6 md:gap-10">
        <div className="bg-[#F5F5F5]" style={{ aspectRatio: '4 / 5' }}>
          <img src={imgUrl(p.image, 1200, 1500, 80)} alt={p.name} className="w-full h-full object-cover" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-[#8A8A8A]">{p.category.replace('-', ' ')}</div>
          <h1 className="text-2xl md:text-4xl font-extrabold mt-2 text-[#1A1A1A] font-geist">{p.name}</h1>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-2xl font-extrabold text-black font-geist">{formatIDR(p.price)}</span>
            {p.originalPrice > p.price && <span className="text-sm text-[#8A8A8A] line-through">{formatIDR(p.originalPrice)}</span>}
          </div>
          <p className="mt-5 text-sm leading-relaxed text-[#333333]">{p.description}</p>
          {ref && <div className="mt-5 text-xs bg-[#F5F5F5] border border-[#E5E5E5] p-2">Kode referral <span className="font-bold">{ref}</span> aktif — pembelian ini akan mengkredit mitra afiliasi.</div>}
          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center border border-[#E5E5E5] h-12">
              <button className="w-10 h-full text-lg" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
              <span className="w-10 text-center">{qty}</span>
              <button className="w-10 h-full text-lg" onClick={() => setQty(qty + 1)}>+</button>
            </div>
            <button
              onClick={() => { addToCart(p, qty); toast.success('Ditambahkan ke keranjang'); setCartOpen(true); }}
              className="flex-1 h-12 bg-black text-white font-semibold"
            >
              Tambah ke Keranjang — {formatIDR(p.price * qty)}
            </button>
          </div>
          <div className="mt-8 border-t border-[#EEEEEE] pt-4 text-xs text-[#8A8A8A] grid grid-cols-3 gap-3">
            <div><div className="font-semibold text-black">Gratis Ongkir</div>Order di atas Rp 300.000</div>
            <div><div className="font-semibold text-black">Mudah Tukar</div>Garansi 7 hari</div>
            <div><div className="font-semibold text-black">Pembayaran Aman</div>BCA · DANA · QRIS</div>
          </div>
        </div>
      </section>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
