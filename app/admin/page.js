'use client';
import { useEffect, useState } from 'react';
import Header from '@/components/soraya/Header';
import { formatIDR, formatDateID } from '@/lib/soraya';
import { toast } from 'sonner';

const ADMIN_KEY = 'soraya-admin-2026';

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [key, setKey] = useState('');
  const [tab, setTab] = useState('affiliates');
  const [data, setData] = useState({ affiliates: [], payouts: [], products: [], orders: [], banners: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('soraya_admin') === '1') setAuthed(true);
  }, []);

  async function load() {
    setLoading(true);
    try {
      const h = { headers: { 'x-admin-key': ADMIN_KEY } };
      const [a, p, pr, o, b] = await Promise.all([
        fetch('/api/admin/affiliates', h).then((r) => r.json()),
        fetch('/api/admin/payouts', h).then((r) => r.json()),
        fetch('/api/admin/products', h).then((r) => r.json()),
        fetch('/api/admin/orders', h).then((r) => r.json()),
        fetch('/api/admin/banners', h).then((r) => r.json()),
      ]);
      setData({
        affiliates: a.items || [],
        payouts: p.items || [],
        products: pr.items || [],
        orders: o.items || [],
        banners: b.items || [],
      });
    } catch (e) {
      toast.error('Gagal memuat data: ' + e.message);
    } finally { setLoading(false); }
  }

  useEffect(() => { if (authed) load(); }, [authed]);

  function unlock() {
    if (key === ADMIN_KEY) { sessionStorage.setItem('soraya_admin', '1'); setAuthed(true); }
    else toast.error('Kunci admin salah');
  }

  async function activateAffiliate(code) {
    await fetch(`/api/affiliate/${code}/activate`, { method: 'POST', headers: { 'x-admin-key': ADMIN_KEY } });
    toast.success(`Afiliasi ${code} diaktifkan`);
    load();
  }
  async function setPayoutStatus(id, status) {
    await fetch(`/api/admin/payouts/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY }, body: JSON.stringify({ status }) });
    toast.success(`Payout ${status}`); load();
  }
  async function setOrderStatus(id, status) {
    await fetch(`/api/admin/orders/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY }, body: JSON.stringify({ status }) });
    toast.success('Order diupdate'); load();
  }
  async function patchProduct(id, patch) {
    const res = await fetch(`/api/admin/products/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY }, body: JSON.stringify(patch) });
    const d = await res.json();
    if (!res.ok) toast.error(d.error || 'Gagal update'); else toast.success('Produk diupdate');
    load();
  }
  async function deleteProduct(id) {
    if (!confirm('Hapus produk ini?')) return;
    await fetch(`/api/admin/products/${id}`, { method: 'DELETE', headers: { 'x-admin-key': ADMIN_KEY } });
    toast.success('Produk dihapus'); load();
  }
  async function createProduct(payload) {
    const res = await fetch('/api/admin/products', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY }, body: JSON.stringify(payload) });
    const d = await res.json();
    if (!res.ok) { toast.error(d.error || 'Gagal buat produk'); return false; }
    toast.success('Produk ditambahkan'); load(); return true;
  }
  async function saveBanners(items) {
    const res = await fetch('/api/admin/banners', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY }, body: JSON.stringify({ items }) });
    const d = await res.json();
    if (!res.ok) toast.error(d.error || 'Gagal simpan'); else toast.success('Banner tersimpan');
    load();
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-sm mx-auto px-4 py-16">
          <h1 className="text-2xl font-extrabold">Admin Panel</h1>
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
          <h1 className="text-3xl md:text-4xl font-extrabold">Admin Panel</h1>
          <button onClick={() => { sessionStorage.removeItem('soraya_admin'); setAuthed(false); }} className="h-9 px-4 border border-[#E5E5E5] text-sm">Keluar</button>
        </div>
        <div className="mt-6 flex gap-2 overflow-x-auto no-scrollbar">
          {[
            { k: 'affiliates', label: `Afiliator (${data.affiliates.length})` },
            { k: 'payouts', label: `Payout (${data.payouts.filter(p => p.status === 'Pending').length} pending)` },
            { k: 'orders', label: `Order (${data.orders.length})` },
            { k: 'catalog', label: `Katalog (${data.products.length})` },
            { k: 'banners', label: `Banner (${data.banners.length})` },
          ].map((t) => (
            <button key={t.k} onClick={() => setTab(t.k)} className={`shrink-0 h-10 px-4 text-sm font-semibold ${tab === t.k ? 'bg-black text-white' : 'bg-[#F5F5F5] text-[#333]'}`} style={{ borderRadius: 999 }}>{t.label}</button>
          ))}
        </div>

        {loading && <div className="py-6 text-sm text-[#8A8A8A]">Memuat…</div>}

        {tab === 'affiliates' && <AffiliatesTab data={data.affiliates} onActivate={activateAffiliate} />}
        {tab === 'payouts' && <PayoutsTab data={data.payouts} onStatus={setPayoutStatus} />}
        {tab === 'orders' && <OrdersTab data={data.orders} onStatus={setOrderStatus} />}
        {tab === 'catalog' && <CatalogTab data={data.products} onPatch={patchProduct} onDelete={deleteProduct} onCreate={createProduct} />}
        {tab === 'banners' && <BannersTab data={data.banners} onSave={saveBanners} />}
      </section>
    </div>
  );
}

/* ======================= TAB COMPONENTS ======================= */

function AffiliatesTab({ data, onActivate }) {
  return (
    <div className="mt-5 border border-[#E5E5E5] overflow-x-auto">
      <table className="w-full text-sm min-w-[700px]">
        <thead className="bg-[#F5F5F5] text-xs uppercase"><tr>
          <th className="text-left px-3 py-3">Nama</th><th className="text-left px-3 py-3">Kontak</th><th className="text-left px-3 py-3">Kode</th><th className="text-left px-3 py-3">Status</th><th className="text-right px-3 py-3">Aksi</th>
        </tr></thead>
        <tbody>
          {data.map((a) => (
            <tr key={a.code} className="border-t border-[#EEEEEE]">
              <td className="px-3 py-3">{a.fullName}</td>
              <td className="px-3 py-3 text-[#333]"><div>{a.email}</div><div className="text-xs text-[#8A8A8A]">{a.phone}</div></td>
              <td className="px-3 py-3 font-mono">{a.code}</td>
              <td className="px-3 py-3"><span className={`text-[11px] font-bold px-2 py-1 ${a.status === 'active' ? 'bg-emerald-700 text-white' : 'bg-[#F5F5F5] border'}`}>{(a.status || 'pending').toUpperCase()}</span></td>
              <td className="px-3 py-3 text-right">{a.status !== 'active' && <button onClick={() => onActivate(a.code)} className="h-9 px-3 bg-black text-white text-xs font-semibold">Aktivasi</button>}</td>
            </tr>
          ))}
          {data.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-[#8A8A8A]">Belum ada pendaftar.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function PayoutsTab({ data, onStatus }) {
  return (
    <div className="mt-5 border border-[#E5E5E5] overflow-x-auto">
      <table className="w-full text-sm min-w-[700px]">
        <thead className="bg-[#F5F5F5] text-xs uppercase"><tr>
          <th className="text-left px-3 py-3">Tanggal</th><th className="text-left px-3 py-3">Afiliator</th><th className="text-right px-3 py-3">Jumlah</th><th className="text-left px-3 py-3">Tujuan</th><th className="text-left px-3 py-3">Status</th><th className="text-right px-3 py-3">Aksi</th>
        </tr></thead>
        <tbody>
          {data.map((p) => (
            <tr key={p.id} className="border-t border-[#EEEEEE]">
              <td className="px-3 py-3">{formatDateID(p.createdAt)}</td>
              <td className="px-3 py-3 font-mono">{p.affiliateCode}</td>
              <td className="px-3 py-3 text-right font-bold">{formatIDR(p.amount)}</td>
              <td className="px-3 py-3">{p.method} · {p.account}</td>
              <td className="px-3 py-3"><span className={`text-[11px] font-bold px-2 py-1 ${p.status === 'Paid' ? 'bg-emerald-700 text-white' : p.status === 'Rejected' ? 'bg-red-600 text-white' : 'bg-[#F5F5F5] border'}`}>{p.status.toUpperCase()}</span></td>
              <td className="px-3 py-3 text-right">
                {p.status === 'Pending' && (
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => onStatus(p.id, 'Paid')} className="h-8 px-3 bg-emerald-700 text-white text-xs font-semibold">Setujui</button>
                    <button onClick={() => onStatus(p.id, 'Rejected')} className="h-8 px-3 bg-red-600 text-white text-xs font-semibold">Tolak</button>
                  </div>
                )}
              </td>
            </tr>
          ))}
          {data.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-[#8A8A8A]">Belum ada pencairan.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function OrdersTab({ data, onStatus }) {
  return (
    <div className="mt-5 border border-[#E5E5E5] overflow-x-auto">
      <table className="w-full text-sm min-w-[800px]">
        <thead className="bg-[#F5F5F5] text-xs uppercase"><tr>
          <th className="text-left px-3 py-3">Tanggal</th><th className="text-left px-3 py-3">Order</th><th className="text-left px-3 py-3">Ref</th><th className="text-right px-3 py-3">Total</th><th className="text-right px-3 py-3">Komisi (10%)</th><th className="text-left px-3 py-3">Status</th><th className="text-right px-3 py-3">Aksi</th>
        </tr></thead>
        <tbody>
          {data.map((o) => (
            <tr key={o.id} className="border-t border-[#EEEEEE]">
              <td className="px-3 py-3">{formatDateID(o.createdAt)}</td>
              <td className="px-3 py-3 font-mono text-xs">{o.orderNumber}</td>
              <td className="px-3 py-3 font-mono text-xs">{o.ref || '-'}</td>
              <td className="px-3 py-3 text-right">{formatIDR(o.total)}</td>
              <td className="px-3 py-3 text-right font-bold">{formatIDR(o.commission || Math.round(o.total * 0.1))}</td>
              <td className="px-3 py-3"><span className={`text-[10px] font-bold px-2 py-1 ${o.status === 'approved' ? 'bg-emerald-700 text-white' : o.status === 'cancelled' ? 'bg-red-600 text-white' : 'bg-[#F5F5F5] border'}`}>{(o.status || '').toUpperCase()}</span></td>
              <td className="px-3 py-3 text-right">
                {o.status !== 'approved' && <button onClick={() => onStatus(o.id, 'approved')} className="h-7 px-2 bg-emerald-700 text-white text-[11px] font-semibold mr-1">Setujui</button>}
                {o.status !== 'cancelled' && <button onClick={() => onStatus(o.id, 'cancelled')} className="h-7 px-2 bg-red-600 text-white text-[11px] font-semibold">Batal</button>}
              </td>
            </tr>
          ))}
          {data.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-[#8A8A8A]">Belum ada order.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function CatalogTab({ data, onPatch, onDelete, onCreate }) {
  const [adding, setAdding] = useState(false);
  const [newProd, setNewProd] = useState({ name: '', price: '', category: 'Blouse', image: '', description: '', stock: 10, commissionPct: 10 });

  async function submitNew() {
    if (!newProd.name || !newProd.price) { toast.error('Nama & harga wajib'); return; }
    const ok = await onCreate(newProd);
    if (ok) {
      setNewProd({ name: '', price: '', category: 'Blouse', image: '', description: '', stock: 10, commissionPct: 10 });
      setAdding(false);
    }
  }

  return (
    <div className="mt-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#555]">Edit harga, stok, gambar, atau komisi langsung di tabel. Perubahan tersimpan saat kolom di-blur.</p>
        <button onClick={() => setAdding(!adding)} className="h-10 px-4 bg-black text-white text-sm font-semibold">
          {adding ? 'Batal' : '+ Tambah Produk'}
        </button>
      </div>

      {adding && (
        <div className="border border-dashed border-stone-400 p-4 bg-stone-50 space-y-3">
          <div className="font-bold text-sm">Produk Baru</div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <input placeholder="Nama produk*" value={newProd.name} onChange={(e) => setNewProd({ ...newProd, name: e.target.value })} className="h-10 border border-stone-300 px-3" />
            <input placeholder="Harga (Rp)*" type="number" value={newProd.price} onChange={(e) => setNewProd({ ...newProd, price: e.target.value })} className="h-10 border border-stone-300 px-3" />
            <select value={newProd.category} onChange={(e) => setNewProd({ ...newProd, category: e.target.value })} className="h-10 border border-stone-300 px-3">
              {['Blouse', 'Atasan (Top)', 'Tunik Rayon', 'Gamis Maxy', 'Midi Dress', 'Setelan', 'Pyajamas'].map((c) => <option key={c}>{c}</option>)}
            </select>
            <input placeholder="Stok" type="number" value={newProd.stock} onChange={(e) => setNewProd({ ...newProd, stock: e.target.value })} className="h-10 border border-stone-300 px-3" />
            <input placeholder="URL Gambar" value={newProd.image} onChange={(e) => setNewProd({ ...newProd, image: e.target.value })} className="h-10 border border-stone-300 px-3 col-span-2" />
            <input placeholder="Deskripsi singkat" value={newProd.description} onChange={(e) => setNewProd({ ...newProd, description: e.target.value })} className="h-10 border border-stone-300 px-3 col-span-2" />
            <input placeholder="Komisi (%)" type="number" min={0} max={50} value={newProd.commissionPct} onChange={(e) => setNewProd({ ...newProd, commissionPct: e.target.value })} className="h-10 border border-stone-300 px-3" />
          </div>
          <button onClick={submitNew} className="h-10 px-5 bg-black text-white text-sm font-semibold">Simpan</button>
        </div>
      )}

      <div className="border border-[#E5E5E5] overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-[#F5F5F5] text-xs uppercase"><tr>
            <th className="text-left px-3 py-3">Produk</th>
            <th className="text-right px-3 py-3">Harga</th>
            <th className="text-right px-3 py-3">Stok</th>
            <th className="text-left px-3 py-3">Gambar URL</th>
            <th className="text-right px-3 py-3">Komisi %</th>
            <th className="text-right px-3 py-3">Payout / sale</th>
            <th className="px-3 py-3"></th>
          </tr></thead>
          <tbody>
            {data.map((p) => (
              <tr key={p.id} className="border-t border-[#EEEEEE]">
                <td className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    <img src={p.image} className="w-10 h-12 object-cover bg-[#F5F5F5]" alt="" />
                    <input defaultValue={p.name} onBlur={(e) => e.target.value !== p.name && onPatch(p.id, { name: e.target.value })} className="w-56 h-9 border border-stone-200 px-2 text-sm" />
                  </div>
                </td>
                <td className="px-3 py-3 text-right">
                  <input type="number" defaultValue={p.price} onBlur={(e) => Number(e.target.value) !== p.price && onPatch(p.id, { price: Number(e.target.value) })} className="w-24 h-9 border border-stone-200 px-2 text-right text-sm" />
                </td>
                <td className="px-3 py-3 text-right">
                  <input type="number" defaultValue={p.stock} onBlur={(e) => Number(e.target.value) !== p.stock && onPatch(p.id, { stock: Number(e.target.value) })} className="w-16 h-9 border border-stone-200 px-2 text-right text-sm" />
                </td>
                <td className="px-3 py-3">
                  <input defaultValue={p.image} onBlur={(e) => e.target.value !== p.image && onPatch(p.id, { image: e.target.value })} placeholder="https://…" className="w-full min-w-[200px] h-9 border border-stone-200 px-2 text-xs font-mono" />
                </td>
                <td className="px-3 py-3 text-right">
                  <input type="number" defaultValue={p.commissionPct ?? 10} min={0} max={50} onBlur={(e) => onPatch(p.id, { commissionPct: Number(e.target.value) })} className="w-14 h-9 border border-stone-200 px-2 text-right text-sm" />
                </td>
                <td className="px-3 py-3 text-right font-bold">{formatIDR(Math.round(p.price * (p.commissionPct ?? 10) / 100))}</td>
                <td className="px-3 py-3 text-right">
                  <button onClick={() => onDelete(p.id)} className="h-8 px-2 text-red-600 hover:bg-red-50 text-xs font-semibold">Hapus</button>
                </td>
              </tr>
            ))}
            {data.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-[#8A8A8A]">Belum ada produk.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BannersTab({ data, onSave }) {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const padded = Array.from({ length: 5 }, (_, i) => data[i] || { id: `b${i + 1}`, image: '', title: '', subtitle: '', cta: 'Belanja Sekarang', href: '/', active: true });
    setItems(padded);
  }, [data]);

  function update(i, patch) {
    setItems(items.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  }

  return (
    <div className="mt-5 space-y-4">
      <p className="text-sm text-[#555]">Edit sampai 5 banner slide yang tampil di homepage (atas kategori). Isi URL gambar (gunakan hosting mana saja), judul, subtitle, dan tombol CTA. Centang <b>Aktif</b> untuk tampil.</p>
      {items.map((b, i) => (
        <div key={b.id} className="border border-stone-200 p-4 rounded bg-white space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-bold text-sm">Banner {i + 1}</div>
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={b.active} onChange={(e) => update(i, { active: e.target.checked })} />
              Aktif
            </label>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-stone-500">URL Gambar</label>
              <input value={b.image} onChange={(e) => update(i, { image: e.target.value })} placeholder="https://…" className="w-full h-10 border border-stone-300 px-3 text-sm font-mono" />
              {b.image && <img src={b.image} alt="" className="mt-2 w-full h-28 object-cover rounded border" />}
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-stone-500">Subtitle (atas)</label>
                <input value={b.subtitle} onChange={(e) => update(i, { subtitle: e.target.value })} placeholder="Diskon hingga 30%" className="w-full h-10 border border-stone-300 px-3 text-sm" />
              </div>
              <div>
                <label className="text-xs text-stone-500">Judul</label>
                <input value={b.title} onChange={(e) => update(i, { title: e.target.value })} placeholder="Koleksi Blouse Premium" className="w-full h-10 border border-stone-300 px-3 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-stone-500">Teks Tombol</label>
                  <input value={b.cta} onChange={(e) => update(i, { cta: e.target.value })} className="w-full h-10 border border-stone-300 px-3 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-stone-500">Link (href)</label>
                  <input value={b.href} onChange={(e) => update(i, { href: e.target.value })} placeholder="/?cat=Blouse" className="w-full h-10 border border-stone-300 px-3 text-sm" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
      <button onClick={() => onSave(items)} className="h-11 px-6 bg-black text-white text-sm font-bold">Simpan Semua Banner</button>
    </div>
  );
}
