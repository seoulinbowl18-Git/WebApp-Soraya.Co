'use client';
import Link from 'next/link';
import { formatIDR, addToCart, imgUrl } from '@/lib/soraya';
import { toast } from 'sonner';

export default function ProductCard({ p }) {
  const img = imgUrl(p.image, 600, 750, 70);
  const hasDiscount = p.originalPrice && p.originalPrice > p.price;
  const discountPct = hasDiscount ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;
  return (
    <div className="group">
      <Link href={`/product/${p.id}`} className="block">
        <div className="relative overflow-hidden bg-[#F5F5F5]" style={{ aspectRatio: '4 / 5' }}>
          <img src={img} alt={p.name} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform" />
          {hasDiscount && (
            <div className="absolute top-2 left-2 bg-[#D32F2F] text-white text-xs font-extrabold px-2.5 py-1 font-geist tracking-tight">
              -{discountPct}%
            </div>
          )}
          {p.variants && p.variants.length > 1 && (
            <div className="absolute bottom-2 left-2 bg-white/95 text-[#1A1A1A] text-[10px] font-bold px-2 py-1 border border-[#E5E5E5]">
              {p.variants.length} VARIAN
            </div>
          )}
        </div>
      </Link>
      <div className="mt-3">
        <Link href={`/product/${p.id}`}>
          <h3 className="text-sm font-medium text-[#1A1A1A] line-clamp-2 min-h-[2.5rem]">{p.name}</h3>
        </Link>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-sm font-bold text-black">{formatIDR(p.price)}</span>
          {hasDiscount && (
            <span className="text-xs text-[#8A8A8A] line-through">{formatIDR(p.originalPrice)}</span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            addToCart(p, 1);
            toast.success('Ditambahkan ke keranjang');
          }}
          className="mt-3 w-full h-10 bg-black text-white text-sm font-semibold hover:bg-[#111111] transition-colors"
        >
          + Keranjang
        </button>
      </div>
    </div>
  );
}
