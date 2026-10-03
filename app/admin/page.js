'use client';
import { useEffect, useState } from 'react';
import Header from '@/components/soraya/Header';
import { formatIDR, formatDateID } from '@/lib/soraya';
import { toast } from 'sonner';

const ADMIN_KEY = 'soraya-admin-2026'; // simple MVP admin password

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [key, setKey] = useState('');
  const [tab, setTab] = useState('affiliates');
  const [data, setData] = useState({ affiliates: [], payouts: [], products: [], orders: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('soraya_admin') === '1') setAuthed(true);
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [a, p, pr, o] = await Promise.all([
        fetch('/api/admin/affiliates', { headers: { 'x-admin-key': ADMIN_KEY } }).then((r) => r.json()),
        fetch('/api/admin/payouts', { headers: { 'x-admin-key': ADMIN_KEY } }).then((r) => r.json()),
        fetch('/api/products').then((r) => r.json()),
        fetch('/api/admin/orders', { headers: { 'x-admin-key': ADMIN_KEY } }).then((r) => r.json()),
      ]);
      setData({ affiliates: a.items || [], payouts: p.items || [], products: pr.items || [], orders: o.items || [] });
    } finally { setLoading(false); }
  }

  useEffect(() => { if (authed) load(); }, [authed]);

  function unlock() {
    if (key === ADMIN_KEY) { sessionStorage.setItem('soraya_admin', '1'); setAuthed(true); } else toast.error('Kunci admin salah');
  }

  async function activateAffiliate(code) {
    await fetch(`/api/affiliate/${code}/activate`, { method: 'POST', headers: { 'x-admin-key': ADMIN_KEY } });
    toast.success(`Afiliasi ${code} diaktifkan`);
    load();
  }
  async function setPayoutStatus(id, status) {
    await fetch(`/api/admin/payouts/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY }, body: JSON.stringify({ status }) });
    toast.success(`Payout ${status}`);
    load();
  }
  async function setOrderStatus(id, status) {
    await fetch(`/api/admin/orders/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY }, body: JSON.stringify({ status }) });
    toast.success('Order diupdate');
    load();
  }
  async function setCommission(id, pct) {
    await fetch(`/api/admin/products/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY }, body: JSON.stringify({ commissionPct: Number(pct) }) });
    toast.success('Komisi diupdate');
    load();
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-sm mx-auto px-4 py-16">
          <h1 className="text-2xl font-extrabold font-geist">Admin Panel</h1>
          <p className="text-sm text-[#8A8A8A] mt-2">Masuk ke panel admin Soraya.Co.</p>
          <input value={key} onChange={(e) => setKey(e.target.value)} type="password" placeholder="Kunci admin" className="mt-4 w-full h-11 border border-[#E5E5E5] px-3 text-sm" />
          <button onClick={unlock} className="mt-3 w-full h-12 bg-black text-white font-semibold">Masuk</button>
          <div className="mt-3 text-xs text-[#8A8A8A]">Dev key: <span className="font-mono">{ADMIN_KEY}</span></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-6">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <h1 className="text-3xl md:text-4xl font-extrabold font-geist">Admin Panel</h1>
          <button onClick={() => { sessionStorage.removeItem('soraya_admin'); setAuthed(false); }} className="h-9 px-4 border border-[#E5E5E5] text-sm">Keluar</button>
        </div>
        <div className="mt-6 flex gap-2 overflow-x-auto no-scrollbar">
          {[
            { k: 'affiliates', label: `Afiliator (${data.affiliates.length})` },
            { k: 'payouts', label: `Payout (${data.payouts.filter(p => p.status === 'Pending').length} pending)` },
            { k: 'orders', label: `Order (${data.orders.length})` },
            { k: 'products', label: `Komisi Produk (${data.products.length})` },
          ].map((t) => (
            <button key={t.k} onClick={() => setTab(t.k)} className={`shrink-0 h-10 px-4 text-sm font-semibold ${tab === t.k ? 'bg-black text-white' : 'bg-[#F5F5F5] text-[#333]'}`} style={{ borderRadius: 999 }}>{t.label}</button>
          ))}
        </div>

        {loading && <div className="py-6 text-sm text-[#8A8A8A]">Memuat…</div>}

        {tab === 'affiliates' && (
          <div className="mt-5 border border-[#E5E5E5] overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-[#F5F5F5] text-xs uppercase"><tr>
                <th className="text-left px-3 py-3">Nama</th><th className="text-left px-3 py-3">Kontak</th><th className="text-left px-3 py-3">Kode</th><th className="text-left px-3 py-3">Status</th><th className="text-right px-3 py-3">Aksi</th>
              </tr></thead>
              <tbody>
                {data.affiliates.map((a) => (
                  <tr key={a.code} className="border-t border-[#EEEEEE]">
                    <td className="px-3 py-3">{a.fullName}</td>
                    <td className="px-3 py-3 text-[#333]"><div>{a.email}</div><div className="text-xs text-[#8A8A8A]">{a.phone}</div></td>
                    <td className="px-3 py-3 font-mono">{a.code}</td>
                    <td className="px-3 py-3"><span className={`text-[11px] font-bold px-2 py-1 ${a.status === 'active' ? 'bg-[#2E7D32] text-white' : 'bg-[#F5F5F5] border border-[#E5E5E5]'}`}>{(a.status || 'pending').toUpperCase()}</span></td>
                    <td className="px-3 py-3 text-right">{a.status !== 'active' && <button onClick={() => activateAffiliate(a.code)} className="h-9 px-3 bg-black text-white text-xs font-semibold">Aktivasi</button>}</td>
                  </tr>
                ))}
                {data.affiliates.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-[#8A8A8A]">Belum ada pendaftar.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'payouts' && (
          <div className="mt-5 border border-[#E5E5E5] overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-[#F5F5F5] text-xs uppercase"><tr>
                <th className="text-left px-3 py-3">Tanggal</th><th className="text-left px-3 py-3">Afiliator</th><th className="text-right px-3 py-3">Jumlah</th><th className="text-left px-3 py-3">Tujuan</th><th className="text-left px-3 py-3">Status</th><th className="text-right px-3 py-3">Aksi</th>
              </tr></thead>
              <tbody>
                {data.payouts.map((p) => (
                  <tr key={p.id} className="border-t border-[#EEEEEE]">
                    <td className="px-3 py-3">{formatDateID(p.createdAt)}</td>
                    <td className="px-3 py-3 font-mono">{p.affiliateCode}</td>
                    <td className="px-3 py-3 text-right font-bold">{formatIDR(p.amount)}</td>
                    <td className="px-3 py-3">{p.method} · {p.account}</td>
                    <td className="px-3 py-3"><span className={`text-[11px] font-bold px-2 py-1 ${p.status === 'Paid' ? 'bg-[#2E7D32] text-white' : p.status === 'Rejected' || p.status === 'Failed' ? 'bg-[#D32F2F] text-white' : 'bg-[#F5F5F5] border border-[#E5E5E5]'}`}>{p.status.toUpperCase()}</span></td>
                    <td className="px-3 py-3 text-right">
                      {p.status === 'Pending' && (
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => setPayoutStatus(p.id, 'Paid')} className="h-8 px-3 bg-[#2E7D32] text-white text-xs font-semibold">Setujui</button>
                          <button onClick={() => setPayoutStatus(p.id, 'Rejected')} className="h-8 px-3 bg-[#D32F2F] text-white text-xs font-semibold">Tolak</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {data.payouts.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-[#8A8A8A]">Belum ada pencairan.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'orders' && (
          <div className="mt-5 border border-[#E5E5E5] overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead className="bg-[#F5F5F5] text-xs uppercase"><tr>
                <th className="text-left px-3 py-3">Tanggal</th><th className="text-left px-3 py-3">Order</th><th className="text-left px-3 py-3">Ref</th><th className="text-right px-3 py-3">Total</th><th className="text-right px-3 py-3">Komisi</th><th className="text-left px-3 py-3">Status</th><th className="text-right px-3 py-3">Aksi</th>
              </tr></thead>
              <tbody>
                {data.orders.map((o) => (
                  <tr key={o.id} className="border-t border-[#EEEEEE]">
                    <td className="px-3 py-3">{formatDateID(o.createdAt)}</td>
                    <td className="px-3 py-3 font-mono text-xs">{o.orderNumber}</td>
                    <td className="px-3 py-3 font-mono text-xs">{o.ref || '-'}</td>
                    <td className="px-3 py-3 text-right">{formatIDR(o.total)}</td>
                    <td className="px-3 py-3 text-right font-bold">{formatIDR(o.commission)}</td>
                    <td className="px-3 py-3"><span className={`text-[10px] font-bold px-2 py-1 ${o.status === 'approved' ? 'bg-[#2E7D32] text-white' : o.status === 'cancelled' ? 'bg-[#D32F2F] text-white' : 'bg-[#F5F5F5] border border-[#E5E5E5]'}`}>{(o.status || '').toUpperCase()}</span></td>
                    <td className="px-3 py-3 text-right">
                      {o.status !== 'approved' && <button onClick={() => setOrderStatus(o.id, 'approved')} className="h-7 px-2 bg-[#2E7D32] text-white text-[11px] font-semibold mr-1">Setujui</button>}
                      {o.status !== 'cancelled' && <button onClick={() => setOrderStatus(o.id, 'cancelled')} className="h-7 px-2 bg-[#D32F2F] text-white text-[11px] font-semibold">Batal</button>}
                    </td>
                  </tr>
                ))}
                {data.orders.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-[#8A8A8A]">Belum ada order.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'products' && (
          <div className="mt-5 border border-[#E5E5E5] overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-[#F5F5F5] text-xs uppercase"><tr>
                <th className="text-left px-3 py-3">Produk</th><th className="text-right px-3 py-3">Harga</th><th className="text-right px-3 py-3">Komisi (%)</th><th className="text-right px-3 py-3">Payout / sale</th>
              </tr></thead>
              <tbody>
                {data.products.map((p) => (
                  <tr key={p.id} className="border-t border-[#EEEEEE]">
                    <td className="px-3 py-3 flex items-center gap-3"><img src={`${p.image}?w=80&h=100&fit=crop&q=50`} className="w-10 h-12 object-cover bg-[#F5F5F5]" alt="" /><div className="text-sm">{p.name}</div></td>
                    <td className="px-3 py-3 text-right">{formatIDR(p.price)}</td>
                    <td className="px-3 py-3 text-right">
                      <input type="number" defaultValue={p.commissionPct || 10} min={0} max={50} onBlur={(e) => setCommission(p.id, e.target.value)} className="w-16 h-9 border border-[#E5E5E5] px-2 text-right text-sm" />
                    </td>
                    <td className="px-3 py-3 text-right font-bold">{formatIDR(Math.round(p.price * (p.commissionPct || 10) / 100))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
