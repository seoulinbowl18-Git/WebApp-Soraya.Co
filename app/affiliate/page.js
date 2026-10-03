'use client';
import Link from 'next/link';
import Header from '@/components/soraya/Header';
import { useEffect, useState } from 'react';
import { getAffiliateCode, setAffiliateCode } from '@/lib/soraya';
import { useRouter } from 'next/navigation';

export default function AffiliateLanding() {
  const router = useRouter();
  const [code, setCode] = useState(null);
  const [loginCode, setLoginCode] = useState('');
  useEffect(() => { setCode(getAffiliateCode()); }, []);

  function loginWithCode() {
    if (!loginCode.trim()) return;
    const c = loginCode.trim().toUpperCase();
    setAffiliateCode(c);
    router.push('/affiliate/dashboard');
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <section className="max-w-5xl mx-auto px-4 md:px-6 py-10 md:py-20">
        <div className="text-xs tracking-widest uppercase text-[#8A8A8A]">Program Afiliasi Soraya.Co</div>
        <h1 className="text-4xl md:text-6xl font-extrabold mt-3 text-[#1A1A1A] leading-[1.05] font-geist">
          Hasilkan uang dari setiap<br />produk yang kamu bagikan.
        </h1>
        <p className="mt-5 max-w-xl text-[#333] text-base">
          Komisi hingga 10% dari setiap penjualan. Link pelacakan khusus, QR Code, dan dashboard yang bersih — dibuat untuk kreator Instagram & TikTok.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {code ? (
            <Link href="/affiliate/dashboard" className="h-12 px-6 bg-black text-white font-semibold leading-[48px]">
              Ke Dashboard →
            </Link>
          ) : (
            <Link href="/affiliate/register" className="h-12 px-6 bg-black text-white font-semibold leading-[48px]">
              Gabung Sekarang — Gratis
            </Link>
          )}
          <Link href="/" className="h-12 px-6 border border-black font-semibold leading-[48px]">Lihat Produk</Link>
        </div>

        {!code && (
          <div className="mt-10 max-w-md border border-[#E5E5E5] p-5">
            <div className="text-xs text-[#8A8A8A] uppercase tracking-widest">Sudah jadi afiliasi?</div>
            <div className="mt-3 flex gap-2">
              <input value={loginCode} onChange={(e) => setLoginCode(e.target.value)} placeholder="Masukkan kode afiliasi" className="flex-1 h-11 border border-[#E5E5E5] px-3 text-sm" />
              <button onClick={loginWithCode} className="h-11 px-4 bg-black text-white text-sm font-semibold">Masuk</button>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6 mt-16">
          {[
            { t: 'Komisi 10%', d: 'Dapatkan komisi dari setiap penjualan terverifikasi dengan pelacakan transparan.' },
            { t: 'Link + QR Code', d: 'Buat link bermerek & QR code untuk setiap produk.' },
            { t: 'Pencairan Cepat', d: 'Tarik dana via BCA, BRI, BNI, Mandiri, DANA, GoPay, OVO, QRIS, atau ShopeePay.' },
          ].map((f) => (
            <div key={f.t} className="border border-[#E5E5E5] p-6">
              <div className="text-lg font-bold text-[#1A1A1A]">{f.t}</div>
              <div className="text-sm text-[#8A8A8A] mt-2">{f.d}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
