'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/soraya/Header';
import { getAffiliateCode, clearAffiliateCode, formatIDR } from '@/lib/soraya';
import { useRouter } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AffiliateDashboard() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState(null);

  useEffect(() => {
    const c = getAffiliateCode();
    if (!c) { router.push('/affiliate'); return; }
    setCode(c);
    fetch(`/api/affiliate/${c}`)
      .then((r) => r.json())
      .then((d) => { if (d.error) { clearAffiliateCode(); router.push('/affiliate'); return; } setData(d); })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return <div className="min-h-screen bg-white"><Header /><div className="p-10 text-center text-[#8A8A8A]">Loading dashboard…</div></div>;
  }

  const { affiliate, stats, trend } = data;

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs tracking-widest uppercase text-[#8A8A8A]">Welcome back</div>
            <h1 className="text-3xl md:text-4xl font-black mt-1">{affiliate.fullName}</h1>
            <div className="text-sm mt-1">Code: <span className="font-bold tracking-widest">{affiliate.code}</span></div>
          </div>
          <button onClick={() => { clearAffiliateCode(); router.push('/affiliate'); }} className="h-10 px-4 border border-[#E5E5E5] text-sm font-semibold">Sign out</button>
        </div>

        <SubNav active="dashboard" />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-6">
          <Metric label="Total Clicks" value={stats.clicks} />
          <Metric label="Conversions" value={stats.conversions} />
          <Metric label="Commission Balance" value={formatIDR(stats.balance)} />
          <Metric label="Pending Balance" value={formatIDR(stats.pending)} />
        </div>

        <div className="mt-8 border border-[#E5E5E5] p-4 md:p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="font-bold text-[#1A1A1A]">Earnings — Last 14 days</div>
            <div className="text-xs text-[#8A8A8A]">Total earned to date: <span className="font-bold text-black">{formatIDR(stats.totalCommission)}</span></div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="#EEEEEE" vertical={false} />
                <XAxis dataKey="date" stroke="#8A8A8A" fontSize={11} tickLine={false} axisLine={{ stroke: '#E5E5E5' }} />
                <YAxis stroke="#8A8A8A" fontSize={11} tickLine={false} axisLine={{ stroke: '#E5E5E5' }} />
                <Tooltip contentStyle={{ background: '#111111', border: 'none', color: '#fff' }} labelStyle={{ color: '#fff' }} formatter={(v) => formatIDR(v)} />
                <Line type="monotone" dataKey="commission" stroke="#000000" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-8 grid md:grid-cols-2 gap-4">
          <Link href="/affiliate/links" className="border border-[#E5E5E5] p-5 hover:bg-[#F5F5F5]">
            <div className="text-lg font-bold">Generate Link + QR →</div>
            <div className="text-sm text-[#8A8A8A] mt-1">Create a tracked link for any product.</div>
          </Link>
          <Link href="/affiliate/payouts" className="border border-[#E5E5E5] p-5 hover:bg-[#F5F5F5]">
            <div className="text-lg font-bold">Request Payout →</div>
            <div className="text-sm text-[#8A8A8A] mt-1">Withdraw your commission balance.</div>
          </Link>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="border border-[#E5E5E5] p-4">
      <div className="text-xs text-[#8A8A8A] uppercase tracking-widest">{label}</div>
      <div className="text-xl md:text-2xl font-black mt-2 text-[#1A1A1A]">{value}</div>
    </div>
  );
}

export function SubNav({ active }) {
  const tabs = [
    { k: 'dashboard', label: 'Overview', href: '/affiliate/dashboard' },
    { k: 'links', label: 'Links & QR', href: '/affiliate/links' },
    { k: 'products', label: 'Commission Catalog', href: '/affiliate/products' },
    { k: 'payouts', label: 'Payouts', href: '/affiliate/payouts' },
  ];
  return (
    <div className="mt-6 border-b border-[#EEEEEE] flex gap-6 overflow-x-auto">
      {tabs.map((t) => (
        <Link key={t.k} href={t.href} className={`py-3 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px ${active === t.k ? 'border-black text-black' : 'border-transparent text-[#8A8A8A] hover:text-black'}`}>
          {t.label}
        </Link>
      ))}
    </div>
  );
}
