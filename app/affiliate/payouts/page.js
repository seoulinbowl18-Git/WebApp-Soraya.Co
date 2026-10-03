'use client';
import { useEffect, useState } from 'react';
import AffiliateShell from '@/components/soraya/AffiliateShell';
import MetricCard from '@/components/soraya/MetricCard';
import { getAffiliateCode, formatIDR, PAYOUT_METHODS, MIN_PAYOUT_IDR, PAYOUT_STATUS, formatDateID } from '@/lib/soraya';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function AffiliatePayouts() {
  const router = useRouter();
  const [code, setCode] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ amount: '', method: 'bca', account: '' });
  const [submitting, setSubmitting] = useState(false);

  async function load(c) {
    const r = await fetch(`/api/affiliate/${c}`);
    const d = await r.json();
    setData(d);
    setLoading(false);
  }

  useEffect(() => {
    const c = getAffiliateCode();
    if (!c) { router.push('/affiliate'); return; }
    setCode(c);
    load(c);
  }, []);

  async function request() {
    const amt = Number(form.amount);
    if (!amt || amt < MIN_PAYOUT_IDR) { toast.error(`Minimal penarikan ${formatIDR(MIN_PAYOUT_IDR)}`); return; }
    if (amt > (data?.stats?.available || 0)) { toast.error('Jumlah melebihi saldo tersedia'); return; }
    if (!form.account) { toast.error('Nomor rekening wajib diisi'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ affiliateCode: code, amount: amt, method: form.method.toUpperCase(), account: form.account }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Gagal');
      toast.success('Permintaan pencairan dibuat');
      setForm({ amount: '', method: 'bca', account: '' });
      await load(code);
    } catch (e) { toast.error(e.message); } finally { setSubmitting(false); }
  }

  if (loading || !data) return <div className="p-10 text-center text-[#8A8A8A]">Memuat…</div>;

  const { stats, payouts, affiliate } = data;

  return (
    <AffiliateShell affiliate={affiliate}>
      <h1 className="text-3xl md:text-4xl font-extrabold font-geist">Dompet & Pencairan</h1>
      <p className="text-sm text-[#8A8A8A] mt-2">Kelola saldo komisi dan ajukan pencairan.</p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mt-6">
        <MetricCard label="Saldo Tersedia" value={formatIDR(stats.available)} />
        <MetricCard label="Saldo Pending" value={formatIDR(stats.pending)} hint="Menunggu validasi order" />
        <MetricCard label="Total Dicairkan" value={formatIDR(stats.paidOut)} />
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-8">
        <div className="border border-[#E5E5E5] p-5">
          <div className="font-bold text-lg">Ajukan Penarikan</div>
          <div className="text-xs text-[#8A8A8A] mt-1">Minimum: {formatIDR(MIN_PAYOUT_IDR)}</div>
          <div className="space-y-3 mt-4">
            <input type="number" placeholder="Jumlah (IDR)" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full h-11 border border-[#E5E5E5] px-3 text-sm" />
            <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} className="w-full h-11 border border-[#E5E5E5] px-3 text-sm bg-white">
              {PAYOUT_METHODS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input placeholder="Nomor rekening / nomor HP" value={form.account} onChange={(e) => setForm({ ...form, account: e.target.value })} className="w-full h-11 border border-[#E5E5E5] px-3 text-sm" />
            <button disabled={submitting} onClick={request} className="w-full h-12 bg-black text-white font-semibold disabled:opacity-40">{submitting ? 'Memproses…' : 'Ajukan Pencairan'}</button>
          </div>
        </div>

        <div className="border border-[#E5E5E5]">
          <div className="px-5 py-4 border-b border-[#EEEEEE] font-bold">Riwayat Pencairan</div>
          {payouts.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#8A8A8A]">Belum ada pencairan.</div>
          ) : (
            <div className="divide-y divide-[#EEEEEE]">
              {payouts.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((p) => {
                const st = PAYOUT_STATUS[p.status] || PAYOUT_STATUS.Pending;
                return (
                  <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold">{formatIDR(p.amount)}</div>
                      <div className="text-xs text-[#8A8A8A]">{p.method} · {formatDateID(p.createdAt)}</div>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-1" style={{ background: st.bg, color: st.fg, border: st.bg === '#F5F5F5' ? '1px solid #E5E5E5' : 'none' }}>{st.label.toUpperCase()}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AffiliateShell>
  );
}
