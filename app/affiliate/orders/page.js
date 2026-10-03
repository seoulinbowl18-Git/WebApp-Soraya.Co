'use client';
import { useEffect, useState } from 'react';
import AffiliateShell from '@/components/soraya/AffiliateShell';
import { getAffiliateCode, formatIDR, formatDateID, ORDER_STATUS } from '@/lib/soraya';
import { useRouter } from 'next/navigation';

export default function AffiliateOrders() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const c = getAffiliateCode();
    if (!c) { router.push('/affiliate'); return; }
    fetch(`/api/affiliate/${c}`).then((r) => r.json()).then((d) => setData(d)).finally(() => setLoading(false));
  }, []);

  if (loading || !data) return <div className="p-10 text-center text-[#8A8A8A]">Memuat…</div>;

  const { affiliate, orders } = data;
  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  return (
    <AffiliateShell affiliate={affiliate}>
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold font-geist">Laporan Pesanan</h1>
          <p className="text-sm text-[#8A8A8A] mt-2">Semua transaksi yang berhasil dari link afiliasi kamu.</p>
        </div>
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto no-scrollbar">
        {[
          { k: 'all', label: 'Semua' },
          { k: 'pending_validation', label: 'Menunggu Validasi' },
          { k: 'approved', label: 'Disetujui' },
          { k: 'cancelled', label: 'Dibatalkan' },
        ].map((t) => (
          <button key={t.k} onClick={() => setFilter(t.k)} className={`shrink-0 h-9 px-4 text-sm font-medium ${filter === t.k ? 'bg-black text-white' : 'bg-[#F5F5F5] text-[#333] hover:bg-[#EAEAEA]'}`} style={{ borderRadius: 999 }}>{t.label}</button>
        ))}
      </div>

      {/* Table (desktop) */}
      <div className="mt-5 border border-[#E5E5E5] hidden md:block">
        <table className="w-full text-sm">
          <thead className="bg-[#F5F5F5] text-[#333] text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Tanggal</th>
              <th className="text-left px-4 py-3 font-semibold">Order ID</th>
              <th className="text-left px-4 py-3 font-semibold">Produk</th>
              <th className="text-right px-4 py-3 font-semibold">Nilai</th>
              <th className="text-right px-4 py-3 font-semibold">Komisi</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center text-[#8A8A8A] py-10">Belum ada pesanan.</td></tr>
            ) : (
              filtered.map((o) => {
                const st = ORDER_STATUS[o.status] || ORDER_STATUS.pending_validation;
                return (
                  <tr key={o.id} className="border-t border-[#EEEEEE]">
                    <td className="px-4 py-3 whitespace-nowrap text-[#333]">{formatDateID(o.createdAt)}</td>
                    <td className="px-4 py-3 font-mono text-xs">{o.orderNumber}</td>
                    <td className="px-4 py-3">
                      <div className="line-clamp-1">{o.items.map((i) => i.name).join(', ')}</div>
                      <div className="text-xs text-[#8A8A8A]">{o.items.reduce((s, i) => s + i.qty, 0)} item</div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{formatIDR(o.total)}</td>
                    <td className="px-4 py-3 text-right font-bold text-[#1A1A1A]">{formatIDR(o.commission)}</td>
                    <td className="px-4 py-3"><span className="text-[11px] font-bold px-2 py-1" style={{ background: st.bg, color: st.fg, border: st.bg === '#F5F5F5' ? '1px solid #E5E5E5' : 'none' }}>{st.label.toUpperCase()}</span></td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile list */}
      <div className="mt-5 md:hidden divide-y divide-[#EEEEEE] border border-[#E5E5E5]">
        {filtered.length === 0 ? <div className="py-10 text-center text-[#8A8A8A] text-sm">Belum ada pesanan.</div> : filtered.map((o) => {
          const st = ORDER_STATUS[o.status] || ORDER_STATUS.pending_validation;
          return (
            <div key={o.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="font-mono text-xs text-[#333]">{o.orderNumber}</div>
                <span className="text-[10px] font-bold px-2 py-1" style={{ background: st.bg, color: st.fg, border: st.bg === '#F5F5F5' ? '1px solid #E5E5E5' : 'none' }}>{st.label.toUpperCase()}</span>
              </div>
              <div className="text-sm mt-1 line-clamp-2">{o.items.map((i) => i.name).join(', ')}</div>
              <div className="flex items-end justify-between mt-2">
                <div className="text-xs text-[#8A8A8A]">{formatDateID(o.createdAt)} · {formatIDR(o.total)}</div>
                <div className="font-bold">+ {formatIDR(o.commission)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AffiliateShell>
  );
}
