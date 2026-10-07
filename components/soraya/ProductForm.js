'use client';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { X, Upload, Plus, Trash2, ImageIcon } from 'lucide-react';

const ADMIN_KEY = 'soraya-admin-2026';
const CATEGORIES = ['Blouse', 'Atasan (Top)', 'Tunik Rayon', 'Gamis Maxy', 'Midi Dress', 'Setelan', 'Pyajamas'];

// =============== Reusable upload button ===============
function ImageUploader({ value, onChange, label = 'Upload Gambar', aspect = 'aspect-[3/4]' }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  async function handleFile(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Harus file gambar'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Maks 5MB'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'x-admin-key': ADMIN_KEY },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal upload');
      onChange(data.url);
      toast.success('Gambar terupload');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative inline-block">
          <img src={value} alt="" className={`w-32 ${aspect} object-cover rounded border bg-stone-100`} />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs"
            title="Hapus gambar"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className={`w-32 ${aspect} border-2 border-dashed border-stone-300 rounded flex flex-col items-center justify-center text-xs text-stone-500 cursor-pointer hover:border-stone-500 hover:bg-stone-50 transition`}
        >
          {uploading ? (
            <span className="animate-pulse">Mengupload…</span>
          ) : (
            <>
              <ImageIcon size={24} />
              <span className="mt-1 text-center px-1">Klik / drop gambar</span>
            </>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {!value && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="h-9 px-3 bg-black text-white text-xs font-semibold rounded inline-flex items-center gap-1"
        >
          <Upload size={14} /> {label}
        </button>
      )}
    </div>
  );
}

// =============== Main form ===============
export default function ProductForm({ initial, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: '', price: '', originalPrice: '', category: 'Blouse',
    image: '', description: '', sku: '', commissionPct: 10, stock: 10,
    weight: 300, dimensions: { length: 20, width: 15, height: 5 },
    sizes: ['All Size'], variants: [],
  });
  const [saving, setSaving] = useState(false);
  const [sizeInput, setSizeInput] = useState('');

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name || '',
        price: initial.price || '',
        originalPrice: initial.originalPrice || '',
        category: initial.category || 'Blouse',
        image: initial.image || '',
        description: initial.description || '',
        sku: initial.sku || '',
        commissionPct: initial.commissionPct ?? 10,
        stock: initial.stock ?? 10,
        weight: initial.weight ?? 300,
        dimensions: initial.dimensions || { length: 20, width: 15, height: 5 },
        sizes: Array.isArray(initial.sizes) && initial.sizes.length ? initial.sizes : ['All Size'],
        variants: Array.isArray(initial.variants) ? initial.variants : [],
      });
    }
  }, [initial]);

  function addSize() {
    const s = sizeInput.trim();
    if (!s) return;
    if (form.sizes.includes(s)) { toast.error('Ukuran sudah ada'); return; }
    setForm({ ...form, sizes: [...form.sizes, s] });
    setSizeInput('');
  }
  function removeSize(s) {
    setForm({ ...form, sizes: form.sizes.filter((x) => x !== s) });
  }
  function addVariant() {
    setForm({ ...form, variants: [...form.variants, { sku: '', name: '', image: '', stock: 10 }] });
  }
  function updateVariant(i, patch) {
    setForm({ ...form, variants: form.variants.map((v, idx) => (idx === i ? { ...v, ...patch } : v)) });
  }
  function removeVariant(i) {
    setForm({ ...form, variants: form.variants.filter((_, idx) => idx !== i) });
  }

  async function submit() {
    if (!form.name || !form.price) { toast.error('Nama & harga wajib'); return; }
    if (!form.image) { toast.error('Mohon upload gambar utama'); return; }
    setSaving(true);
    try {
      const url = initial ? `/api/admin/products/${initial.id}` : '/api/admin/products';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          originalPrice: Number(form.originalPrice) || Math.round(Number(form.price) * 1.3),
          stock: Number(form.stock),
          weight: Number(form.weight),
          commissionPct: Number(form.commissionPct),
          dimensions: {
            length: Number(form.dimensions.length) || 0,
            width: Number(form.dimensions.width) || 0,
            height: Number(form.dimensions.height) || 0,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal simpan');
      toast.success(initial ? 'Produk diupdate' : 'Produk ditambahkan');
      onSaved?.(data.product);
      onClose?.();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start md:items-center justify-center p-0 md:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-none md:rounded-lg shadow-2xl my-0 md:my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white z-10 rounded-t-lg">
          <h2 className="text-lg font-extrabold">{initial ? 'Edit Produk' : 'Produk Baru'}</h2>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center hover:bg-stone-100 rounded">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-5 space-y-6">
          {/* Dasar */}
          <section>
            <div className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">Informasi Dasar</div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs text-stone-600">Nama Produk *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full h-11 border border-stone-300 px-3 text-sm rounded mt-1" placeholder="Soraya Blouse Linen" />
              </div>
              <div>
                <label className="text-xs text-stone-600">Kategori</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full h-11 border border-stone-300 px-3 text-sm rounded mt-1 bg-white">
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-stone-600">SKU / Kode</label>
                <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="w-full h-11 border border-stone-300 px-3 text-sm rounded mt-1" placeholder="SRY-001" />
              </div>
              <div>
                <label className="text-xs text-stone-600">Harga Jual (Rp) *</label>
                <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full h-11 border border-stone-300 px-3 text-sm rounded mt-1" placeholder="185000" />
              </div>
              <div>
                <label className="text-xs text-stone-600">Harga Coret (opsional)</label>
                <input type="number" value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: e.target.value })} className="w-full h-11 border border-stone-300 px-3 text-sm rounded mt-1" placeholder="245000" />
              </div>
              <div>
                <label className="text-xs text-stone-600">Stok Total</label>
                <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="w-full h-11 border border-stone-300 px-3 text-sm rounded mt-1" />
              </div>
              <div>
                <label className="text-xs text-stone-600">Komisi Afiliasi (%)</label>
                <input type="number" min={0} max={50} value={form.commissionPct} onChange={(e) => setForm({ ...form, commissionPct: e.target.value })} className="w-full h-11 border border-stone-300 px-3 text-sm rounded mt-1" />
              </div>
            </div>
          </section>

          {/* Gambar utama */}
          <section>
            <div className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">Gambar Utama *</div>
            <ImageUploader value={form.image} onChange={(url) => setForm({ ...form, image: url })} label="Upload Foto Produk" />
          </section>

          {/* Deskripsi */}
          <section>
            <div className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">Deskripsi Produk</div>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              placeholder="Deskripsi detail produk, bahan, model, fit, dsb"
              className="w-full border border-stone-300 px-3 py-2 text-sm rounded"
            />
          </section>

          {/* Ukuran */}
          <section>
            <div className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">Ukuran Tersedia</div>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.sizes.map((s) => (
                <span key={s} className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white text-xs font-semibold rounded">
                  {s}
                  <button type="button" onClick={() => removeSize(s)} className="ml-1 hover:bg-white/20 rounded"><X size={12} /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={sizeInput}
                onChange={(e) => setSizeInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSize())}
                placeholder="S / M / L / XL / All Size…"
                className="flex-1 h-10 border border-stone-300 px-3 text-sm rounded"
              />
              <button type="button" onClick={addSize} className="h-10 px-4 bg-stone-800 text-white text-xs font-semibold rounded inline-flex items-center gap-1">
                <Plus size={14} /> Tambah
              </button>
            </div>
          </section>

          {/* Berat & Dimensi */}
          <section>
            <div className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">Berat & Dimensi (untuk kurir)</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-stone-600">Berat (gram)</label>
                <input type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} className="w-full h-10 border border-stone-300 px-3 text-sm rounded mt-1" placeholder="300" />
              </div>
              <div>
                <label className="text-xs text-stone-600">P (cm)</label>
                <input type="number" value={form.dimensions.length} onChange={(e) => setForm({ ...form, dimensions: { ...form.dimensions, length: e.target.value } })} className="w-full h-10 border border-stone-300 px-3 text-sm rounded mt-1" />
              </div>
              <div>
                <label className="text-xs text-stone-600">L (cm)</label>
                <input type="number" value={form.dimensions.width} onChange={(e) => setForm({ ...form, dimensions: { ...form.dimensions, width: e.target.value } })} className="w-full h-10 border border-stone-300 px-3 text-sm rounded mt-1" />
              </div>
              <div>
                <label className="text-xs text-stone-600">T (cm)</label>
                <input type="number" value={form.dimensions.height} onChange={(e) => setForm({ ...form, dimensions: { ...form.dimensions, height: e.target.value } })} className="w-full h-10 border border-stone-300 px-3 text-sm rounded mt-1" />
              </div>
            </div>
          </section>

          {/* Varian */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold uppercase tracking-wider text-stone-500">Varian / Warna / Motif</div>
              <button type="button" onClick={addVariant} className="h-9 px-3 bg-stone-800 text-white text-xs font-semibold rounded inline-flex items-center gap-1">
                <Plus size={14} /> Tambah Varian
              </button>
            </div>
            {form.variants.length === 0 ? (
              <div className="text-xs text-stone-500 italic">Belum ada varian. Produk tanpa varian langsung pakai gambar utama.</div>
            ) : (
              <div className="space-y-3">
                {form.variants.map((v, i) => (
                  <div key={i} className="border border-stone-200 rounded p-3 flex gap-3 items-start bg-stone-50">
                    <div className="shrink-0">
                      <ImageUploader value={v.image} onChange={(url) => updateVariant(i, { image: url })} label="Foto Varian" aspect="aspect-square" />
                    </div>
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-stone-500 uppercase">Nama Varian</label>
                        <input value={v.name} onChange={(e) => updateVariant(i, { name: e.target.value })} placeholder="MIKA GREY" className="w-full h-9 border border-stone-300 px-2 text-xs rounded mt-1" />
                      </div>
                      <div>
                        <label className="text-[10px] text-stone-500 uppercase">SKU</label>
                        <input value={v.sku} onChange={(e) => updateVariant(i, { sku: e.target.value })} placeholder="TRM-004-1" className="w-full h-9 border border-stone-300 px-2 text-xs rounded mt-1" />
                      </div>
                      <div>
                        <label className="text-[10px] text-stone-500 uppercase">Stok</label>
                        <input type="number" value={v.stock} onChange={(e) => updateVariant(i, { stock: Number(e.target.value) })} className="w-full h-9 border border-stone-300 px-2 text-xs rounded mt-1" />
                      </div>
                    </div>
                    <button type="button" onClick={() => removeVariant(i)} className="w-9 h-9 text-red-600 hover:bg-red-50 rounded flex items-center justify-center">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t bg-stone-50 flex items-center justify-end gap-3 rounded-b-lg sticky bottom-0">
          <button type="button" onClick={onClose} className="h-11 px-5 border border-stone-300 text-sm font-semibold rounded">Batal</button>
          <button type="button" onClick={submit} disabled={saving} className="h-11 px-6 bg-black text-white text-sm font-bold rounded disabled:bg-stone-400">
            {saving ? 'Menyimpan…' : (initial ? 'Simpan Perubahan' : 'Tambah Produk')}
          </button>
        </div>
      </div>
    </div>
  );
}
