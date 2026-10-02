'use client';
import Link from 'next/link';
import Header from '@/components/soraya/Header';
import { useEffect, useState } from 'react';
import { getAffiliateCode } from '@/lib/soraya';
import { useRouter } from 'next/navigation';

export default function AffiliateLanding() {
  const router = useRouter();
  const [code, setCode] = useState(null);
  const [loginCode, setLoginCode] = useState('');
  useEffect(() => { setCode(getAffiliateCode()); }, []);

  function loginWithCode() {
    if (!loginCode.trim()) return;
    const c = loginCode.trim().toUpperCase();
    localStorage.setItem('soraya_affiliate_code', c);
    router.push('/affiliate/dashboard');
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <section className="max-w-5xl mx-auto px-4 md:px-6 py-10 md:py-20">
        <div className="text-xs tracking-widest uppercase text-[#8A8A8A]">Soraya.Co Affiliate Program</div>
        <h1 className="text-4xl md:text-6xl font-black mt-3 text-[#1A1A1A] leading-[1.05]">
          Earn with every piece<br />you share.
        </h1>
        <p className="mt-5 max-w-xl text-[#333] text-base">
          Up to 10% commission on every sale. Custom tracking links, QR codes, and clean dashboards built for Instagram & TikTok creators.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {code ? (
            <Link href="/affiliate/dashboard" className="h-12 px-6 bg-black text-white font-semibold leading-[48px]">
              Go to Dashboard →
            </Link>
          ) : (
            <Link href="/affiliate/register" className="h-12 px-6 bg-black text-white font-semibold leading-[48px]">
              Join Now — It&apos;s Free
            </Link>
          )}
          <Link href="/" className="h-12 px-6 border border-black font-semibold leading-[48px]">Browse Products</Link>
        </div>

        {!code && (
          <div className="mt-10 max-w-md border border-[#E5E5E5] p-5">
            <div className="text-xs text-[#8A8A8A] uppercase tracking-widest">Already an affiliate?</div>
            <div className="mt-3 flex gap-2">
              <input value={loginCode} onChange={(e) => setLoginCode(e.target.value)} placeholder="Enter affiliate code" className="flex-1 h-11 border border-[#E5E5E5] px-3 text-sm" />
              <button onClick={loginWithCode} className="h-11 px-4 bg-black text-white text-sm font-semibold">Sign In</button>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6 mt-16">
          {[
            { t: '10% Commission', d: 'Earn on every verified sale with transparent tracking.' },
            { t: 'QR + Short Links', d: 'Generate branded links & QR codes for every product.' },
            { t: 'Instant Payouts', d: 'Withdraw via BCA, BRI, BNI, Mandiri, DANA, or GoPay.' },
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
