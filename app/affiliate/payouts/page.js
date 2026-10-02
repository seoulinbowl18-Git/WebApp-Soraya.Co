'use client';
import { useEffect, useState } from 'react';
import Header from '@/components/soraya/Header';
import { SubNav } from '@/app/affiliate/dashboard/page';
import { getAffiliateCode, formatIDR, PAYOUT_METHODS, MIN_PAYOUT_IDR } from '@/lib/soraya';
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
    if (!amt || amt < MIN_PAYOUT_IDR) { toast.error(`Minimum withdrawal is ${formatIDR(MIN_PAYOUT_IDR)}`); return; }
    if (amt > (data?.stats?.balance || 0)) { toast.error('Amount exceeds available balance'); return; }
    if (!form.account) { toast.error('Account number required'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ affiliateCode: code, amount: amt, method: form.method.toUpperCase(), account: form.account }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed');
      toast.success('Payout requested');
      setForm({ amount: '', method: 'bca', account: '' });
      await load(code);
    } catch (e) { toast.error(e.message); } finally { setSubmitting(false); }
  }

  if (loading) return <div className="min-h-screen bg-white"><Header /><div className="p-10 text-center text-[#8A8A8A]">Loading…</div></div>;

  const { stats, payouts } = data;

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        <h1 className="text-3xl md:text-4xl font-black">Payouts</h1>
        <SubNav active="payouts" />

        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <Metric label="Available" value={formatIDR(stats.balance)} />
          <Metric label="Pending Withdrawal" value={formatIDR(stats.pending)} />
          <Metric label="Paid Out" value={formatIDR(stats.paidOut)} />
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <div className="border border-[#E5E5E5] p-5">
            <div className="font-bold text-lg">Request Withdrawal</div>
            <div className="text-xs text-[#8A8A8A] mt-1">Minimum: {formatIDR(MIN_PAYOUT_IDR)}</div>
            <div className="space-y-3 mt-4">
              <input type="number" placeholder="Amount (IDR)" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full h-11 border border-[#E5E5E5] px-3 text-sm" />
              <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} className="w-full h-11 border border-[#E5E5E5] px-3 text-sm bg-white">
                {PAYOUT_METHODS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input placeholder="Account number / phone" value={form.account} onChange={(e) => setForm({ ...form, account: e.target.value })} className="w-full h-11 border border-[#E5E5E5] px-3 text-sm" />
              <button disabled={submitting} onClick={request} className="w-full h-12 bg-black text-white font-semibold disabled:opacity-40">{submitting ? 'Submitting…' : 'Request Payout'}</button>
            </div>
          </div>

          <div className="border border-[#E5E5E5]">
            <div className="px-5 py-4 border-b border-[#EEEEEE] font-bold">Payout History</div>
            {payouts.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#8A8A8A]">No payouts yet.</div>
            ) : (
              <div className="divide-y divide-[#EEEEEE]">
                {payouts.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).map((p) => (
                  <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold">{formatIDR(p.amount)}</div>
                      <div className="text-xs text-[#8A8A8A]">{p.method} · {new Date(p.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
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

function StatusBadge({ status }) {
  const map = {
    Paid: { bg: '#2E7D32', fg: '#fff' },
    Pending: { bg: '#F5F5F5', fg: '#333' },
    Rejected: { bg: '#D32F2F', fg: '#fff' },
  };
  const s = map[status] || map.Pending;
  return <span className="text-[11px] font-bold px-2 py-1" style={{ background: s.bg, color: s.fg }}>{status.toUpperCase()}</span>;
}
