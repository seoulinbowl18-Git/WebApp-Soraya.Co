'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

export default function BannerCarousel() {
  const [banners, setBanners] = useState([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    fetch('/api/banners')
      .then((r) => r.json())
      .then((d) => setBanners(d.items || []))
      .finally(() => setLoading(false));
  }, []);

  // Auto-rotate every 5s
  useEffect(() => {
    if (banners.length < 2) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setIdx((i) => (i + 1) % banners.length), 5000);
    return () => clearInterval(timerRef.current);
  }, [banners.length]);

  if (loading) {
    return <div className="h-44 md:h-64 bg-stone-100 animate-pulse rounded-xl mx-3 md:mx-6 mt-4" />;
  }
  if (banners.length === 0) return null;

  const b = banners[idx];

  return (
    <div className="relative mx-3 md:mx-6 mt-4 rounded-xl overflow-hidden h-44 md:h-72 bg-stone-100 shadow-sm">
      {/* Image */}
      <img
        src={b.image}
        alt={b.title}
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
      {/* Content */}
      <div className="relative h-full flex flex-col justify-center px-5 md:px-10 text-white max-w-md">
        {b.subtitle && (
          <p className="text-[11px] md:text-xs uppercase tracking-widest font-semibold text-stone-200 drop-shadow">
            {b.subtitle}
          </p>
        )}
        <h2 className="text-xl md:text-3xl font-extrabold leading-tight mt-1 drop-shadow">
          {b.title}
        </h2>
        {b.cta && b.href && (
          <Link
            href={b.href}
            className="mt-3 inline-block w-fit px-5 py-2.5 bg-white text-black text-xs md:text-sm font-bold rounded-md hover:bg-stone-100 transition shadow"
          >
            {b.cta} →
          </Link>
        )}
      </div>

      {/* Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`Slide ${i + 1}`}
              className={`transition-all duration-300 h-1.5 rounded-full ${
                i === idx ? 'w-6 bg-white' : 'w-1.5 bg-white/60'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
