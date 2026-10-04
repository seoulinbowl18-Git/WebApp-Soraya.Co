'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/soraya/Header';
import CartDrawer from '@/components/soraya/CartDrawer';
import ReferralTracker from '@/components/soraya/ReferralTracker';
import { formatIDR, addToCart, getRefCookie, imgUrl } from '@/lib/soraya';
import { toast } from 'sonner';
import { ChevronLeft, Check } from 'lucide-react';

export default function ProductPage() {
  const { id } = useParams();
  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [ref, setRef] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);

  useEffect(() => {
    fetch(`/api/products/${id}`).then((r) => r.json()).then((d) => {
      setP(d);
      if (d && Array.isArray(d.variants) && d.variants.length) setSelectedVariant(d.variants[0]);
      if (d && Array.isArray(d.sizes) && d.sizes.length) setSelectedSize(d.sizes[0]);
    }).finally(() => setLoading(false));
    const t = setTimeout(() => setRef(getRefCookie()), 100);
    return () => clearTimeout(t);
  }, [id]);

  const displayImage = useMemo(() => {
    if (selectedVariant?.image) return imgUrl(selectedVariant.image, 1200, 1500, 80);
    return imgUrl(p?.image, 1200, 1500, 80);
  }, [p, selectedVariant]);

  const hasDiscount = p && p.originalPrice && p.originalPrice > p.price;
  const discountPct = hasDiscount ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;

  const outOfStock = selectedVariant ? Number(selectedVariant.stock || 0) <= 0 : false;

  function handleAdd() {
    if (!p) return;
    const variantLabel = selectedVariant ? ` — ${selectedVariant.name}` : '';
    const sizeLabel = selectedSize && selectedSize !== 'One Size' ? ` (${selectedSize})` : '';
    const productForCart = {
      ...p,
      id: `${p.id}${selectedVariant ? `::${selectedVariant.sku || selectedVariant.name}` : ''}${selectedSize ? `::${selectedSize}` : ''}`,
      name: `${p.name}${variantLabel}${sizeLabel}`,
      image: selectedVariant?.image || p.image,
    };
    addToCart(productForCart, qty);
    toast.success('Ditambahkan ke keranjang');
    setCartOpen(true);
  }

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
        <div>
          <div className="relative bg-[#F5F5F5]" style={{ aspectRatio: '4 / 5' }}>
            <img src={displayImage} alt={p.name} className="w-full h-full object-cover" />
            {hasDiscount && (
              <div className="absolute top-3 left-3 bg-[#D32F2F] text-white text-sm font-extrabold px-3 py-1.5 font-geist">
                -{discountPct}%
              </div>
            )}
          </div>

          {/* Variant thumbnails strip (desktop) */}
          {p.variants && p.variants.length > 0 && (
            <div className="mt-3 grid grid-cols-6 gap-2">
              {p.variants.map((v) => {
                const active = selectedVariant?.sku === v.sku || selectedVariant?.name === v.name;
                return (
                  <button
                    key={v.sku || v.name}
                    onClick={() => setSelectedVariant(v)}
                    className={`relative aspect-[4/5] bg-[#F5F5F5] overflow-hidden ${active ? 'ring-2 ring-black ring-offset-2' : 'opacity-80 hover:opacity-100'}`}
                    aria-label={v.name}
                  >
                    <img src={imgUrl(v.image, 200, 250, 60)} alt={v.name} className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <div className="text-xs uppercase tracking-widest text-[#8A8A8A]">{(p.category || '').replace('-', ' ')}</div>
          <h1 className="text-2xl md:text-4xl font-extrabold mt-2 text-[#1A1A1A] font-geist">{p.name}</h1>
          <div className="mt-4 flex items-baseline gap-3 flex-wrap">
            <span className="text-2xl font-extrabold text-black font-geist">{formatIDR(p.price)}</span>
            {hasDiscount && (
              <>
                <span className="text-sm text-[#8A8A8A] line-through">{formatIDR(p.originalPrice)}</span>
                <span className="text-xs font-bold text-[#D32F2F] bg-[#D32F2F]/10 border border-[#D32F2F] px-2 py-0.5">HEMAT {formatIDR(p.originalPrice - p.price)}</span>
              </>
            )}
          </div>

          <p className="mt-5 text-sm leading-relaxed text-[#333333] whitespace-pre-line">{p.description}</p>

          {ref && <div className="mt-5 text-xs bg-[#F5F5F5] border border-[#E5E5E5] p-2">Kode referral <span className="font-bold">{ref}</span> aktif — pembelian ini akan mengkredit mitra afiliasi.</div>}

          {/* Variant selector list */}
          {p.variants && p.variants.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-widest text-[#8A8A8A]">Warna / Motif</div>
                {selectedVariant && <div className="text-xs font-bold text-[#1A1A1A]">{selectedVariant.name}</div>}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {p.variants.map((v) => {
                  const active = selectedVariant?.sku === v.sku || selectedVariant?.name === v.name;
                  const soldOut = Number(v.stock || 0) <= 0;
                  return (
                    <button
                      key={v.sku || v.name}
                      disabled={soldOut}
                      onClick={() => setSelectedVariant(v)}
                      className={`h-10 px-3 text-xs font-semibold border flex items-center gap-2 ${active ? 'bg-black text-white border-black' : 'bg-white text-[#333] border-[#E5E5E5] hover:border-black'} ${soldOut ? 'opacity-40 line-through' : ''}`}
                    >
                      {active && <Check size={12} />}
                      {v.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Size selector */}
          {p.sizes && p.sizes.length > 0 && (
            <div className="mt-5">
              <div className="text-xs uppercase tracking-widest text-[#8A8A8A]">Ukuran</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {p.sizes.map((s) => {
                  const active = selectedSize === s;
                  return (
                    <button key={s} onClick={() => setSelectedSize(s)} className={`h-10 min-w-[48px] px-3 text-xs font-semibold border ${active ? 'bg-black text-white border-black' : 'bg-white text-[#333] border-[#E5E5E5] hover:border-black'}`}>
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center border border-[#E5E5E5] h-12">
              <button className="w-10 h-full text-lg" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
              <span className="w-10 text-center">{qty}</span>
              <button className="w-10 h-full text-lg" onClick={() => setQty(qty + 1)}>+</button>
            </div>
            <button
              disabled={outOfStock}
              onClick={handleAdd}
              className="flex-1 h-12 bg-black text-white font-semibold disabled:bg-[#8A8A8A]"
            >
              {outOfStock ? 'Stok Habis' : `Tambah ke Keranjang — ${formatIDR(p.price * qty)}`}
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
