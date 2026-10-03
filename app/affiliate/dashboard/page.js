'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AffiliateShell from '@/components/soraya/AffiliateShell';
import MetricCard from '@/components/soraya/MetricCard';
import { getAffiliateCode, clearAffiliateCode, formatIDR } from '@/lib/soraya';
import { useRouter } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Link2, Wallet } from 'lucide-react';

export default function AffiliateDashboard() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const c = getAffiliateCode();
    if (!c) { router.push('/affiliate'); return; }
    fetch(`/api/affiliate/${c}`).then((r) => r.json()).then((d) => {
      if (d.error) { clearAffiliateCode(); router.push('/affiliate'); return; }
      setData(d);
    }).finally(() => setLoading(false));
  }, []);

  if (loading || !data) return <div className="min-h-screen bg-white p-10 text-center text-[#8A8A8A]">Memuat dashboard…</div>;

  const { affiliate, stats, trend } = data;

  return (
    <AffiliateShell affiliate={affiliate}>
      <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
        <div>
          <div className="text-xs tracking-widest uppercase text-[#8A8A8A]">Selamat datang kembali</div>
          <h1 className="text-3xl md:text-4xl font-extrabold mt-1 font-geist">{affiliate.fullName}</h1>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <MetricCard label="Total Klik" value={stats.clicks} />
        <MetricCard label="Total Order" value={stats.conversions} hint={`${stats.approvedConversions} disetujui`} />
        <MetricCard label="Komisi Diperoleh" value={formatIDR(stats.totalCommission)} />
        <MetricCard label="Saldo Dapat Ditarik" value={formatIDR(stats.available)} />
      </div>

      <div className="mt-8 border border-[#E5E5E5] p-4 md:p-6">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div className="font-bold text-[#1A1A1A]">Performa Bulanan — Klik vs Order</div>
          <div className="text-xs text-[#8A8A8A]">30 hari terakhir</div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="#EEEEEE" vertical={false} />
              <XAxis dataKey="date" stroke="#8A8A8A" fontSize={11} tickLine={false} axisLine={{ stroke: '#E5E5E5' }} />
              <YAxis stroke="#8A8A8A" fontSize={11} tickLine={false} axisLine={{ stroke: '#E5E5E5' }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#111111', border: 'none', color: '#fff' }} labelStyle={{ color: '#fff' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" name="Klik" dataKey="clicks" stroke="#8A8A8A" strokeWidth={1.5} dot={false} />
              <Line type="monotone" name="Order" dataKey="orders" stroke="#000000" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-8 grid md:grid-cols-2 gap-4">
        <Link href="/affiliate/links" className="border border-black bg-[#F5F5F5] p-5 hover:bg-[#EAEAEA] flex items-center justify-between">
          <div>
            <div className="text-lg font-bold">Buat Tracking Link</div>
            <div className="text-sm text-[#333] mt-1">Hasilkan link & QR Code untuk produk apa saja.</div>
          </div>
          <Link2 size={28} />
        </Link>
        <Link href="/affiliate/payouts" className="border border-black bg-[#F5F5F5] p-5 hover:bg-[#EAEAEA] flex items-center justify-between">
          <div>
            <div className="text-lg font-bold">Tarik Dana</div>
            <div className="text-sm text-[#333] mt-1">Cairkan saldo komisi kamu kapan saja.</div>
          </div>
          <Wallet size={28} />
        </Link>
      </div>
    </AffiliateShell>
  );
}
