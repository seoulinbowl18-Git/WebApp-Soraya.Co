'use client';
import { useEffect, useRef, useState } from 'react';
import { X, Minus, Plus, Trash2, ChevronLeft, Search, Truck, CreditCard } from 'lucide-react';
import { getCart, updateCartQty, removeFromCart, formatIDR, getRefCookie, clearCart, imgUrl } from '@/lib/soraya';
import { getAuth } from '@/lib/auth';
import { toast } from 'sonner';
import LoginModal from './LoginModal';

export default function CartDrawer({ open, onClose }) {
  const [cart, setCart] = useState([]);
  const [step, setStep] = useState('cart'); // cart | address | pay
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' });
  const [addrQuery, setAddrQuery] = useState('');
  const [addrResults, setAddrResults] = useState([]);
  const [addrLoading, setAddrLoading] = useState(false);
  const [destination, setDestination] = useState(null); // { id, text }
  const [rates, setRates] = useState([]);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [ref, setRef] = useState(null);
  const [auth, setAuthState] = useState(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [addrError, setAddrError] = useState('');
  const [addrNotice, setAddrNotice] = useState('');
  const [ratesError, setRatesError] = useState('');
  const [ratesNotice, setRatesNotice] = useState('');
  const searchTimer = useRef(null);

  useEffect(() => {
    const update = () => { setCart(getCart()); setAuthState(getAuth()); };
    update();
    setRef(getRefCookie());
    window.addEventListener('soraya:cart', update);
    window.addEventListener('soraya:auth', update);
    return () => { window.removeEventListener('soraya:cart', update); window.removeEventListener('soraya:auth', update); };
  }, [open]);

  useEffect(() => {
    if (auth?.user?.identifier && !form.phone && !form.email) {
      setForm((f) => ({
        ...f,
        phone: auth.user.mode === 'phone' ? auth.user.identifier : f.phone,
        email: auth.user.mode === 'email' ? auth.user.identifier : f.email,
        name: auth.user.name || f.name,
      }));
    }
  }, [auth]);

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const shippingCost = selectedShipping?.price || 0;
  const total = subtotal + shippingCost;

  function startCheckout() {
    if (!auth) { setLoginOpen(true); return; }
    setStep('address');
  }

  // Safe fetch helper that never throws on non-JSON responses
  async function safeFetch(url, init) {
    try {
      const r = await fetch(url, init);
      const ct = r.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        const text = await r.text().catch(() => '');
        return { ok: false, data: { success: false, message: `Server mengembalikan ${ct || 'response'} (HTTP ${r.status}). ${text.slice(0, 100)}` } };
      }
      const data = await r.json().catch(() => ({ success: false, message: 'Response tidak valid' }));
      return { ok: r.ok, data };
    } catch (e) {
      return { ok: false, data: { success: false, message: 'Koneksi gagal: ' + (e.message || 'network') } };
    }
  }

  // Debounced destination search
  useEffect(() => {
    if (step !== 'address') return;
    setAddrError('');
    if (addrQuery.trim().length < 3) { setAddrResults([]); return; }
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setAddrLoading(true);
      const { ok, data } = await safeFetch('/api/shipping/search-location?search=' + encodeURIComponent(addrQuery.trim()));
      setAddrLoading(false);
      if (!ok || data.success === false) {
        setAddrResults([]);
        setAddrError(data.message || 'Tidak bisa memuat daftar area');
        return;
      }
      setAddrResults(data.items || []);
      if (!data.items || data.items.length === 0) setAddrError('Area tidak ditemukan. Coba kata kunci lain.');
    }, 350);
  }, [addrQuery, step]);

  async function pickDestination(dest) {
    setDestination(dest);
    setAddrResults([]);
    setAddrQuery(dest.text);
    setRates([]); setSelectedShipping(null); setRatesError('');
    setRatesLoading(true);
    const { ok, data } = await safeFetch('/api/shipping/calculate-cost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destinationDistrictId: dest.id, weight: Math.max(500, cart.reduce((s, i) => s + 500 * i.qty, 0)), itemValue: subtotal }),
    });
    setRatesLoading(false);
    if (!ok || data.success === false) {
      setRatesError(data.message || 'Gagal menghitung ongkir');
      return;
    }
    setRates(data.options || []);
    if (!data.options || data.options.length === 0) setRatesError('Belum ada kurir yang mendukung area ini.');
  }

  async function proceedToPay() {
    if (!form.name || !form.phone || !form.address) { toast.error('Mohon isi nama, nomor WhatsApp, dan alamat lengkap'); return; }
    if (!destination) { toast.error('Pilih kota/kecamatan tujuan'); return; }
    if (!selectedShipping) { toast.error('Pilih kurir pengiriman'); return; }
    setSubmitting(true);
    // 1) Create order
    const orderRes = await safeFetch('/api/checkout/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}) },
      body: JSON.stringify({
        items: cart.map((c) => ({ id: c.id, qty: c.qty, name: c.name, price: c.price, image: c.image })),
        customer: { name: form.name, phone: form.phone, email: form.email, address: form.address, destination },
        shipping: selectedShipping,
        affiliate_code: ref || undefined,
      }),
    });
    if (!orderRes.ok || orderRes.data.success === false) {
      setSubmitting(false);
      toast.error(orderRes.data.message || orderRes.data.error || 'Gagal buat pesanan');
      return;
    }
    const orderData = orderRes.data;

    // 2) Get Midtrans Snap token
    const payRes = await safeFetch('/api/payment/snap', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: orderData.order.id }),
    });
    setSubmitting(false);
    if (!payRes.ok || payRes.data.success === false) {
      toast.error(payRes.data.message || payRes.data.error || 'Gagal buat transaksi Midtrans');
      return;
    }
    const payData = payRes.data;

    // 3) Open Midtrans Snap popup
    if (typeof window === 'undefined' || !window.snap) {
      toast.message('Membuka halaman pembayaran…');
      window.open(payData.redirect_url, '_blank');
      clearCart(); onClose(); setStep('cart');
      return;
    }
    window.snap.pay(payData.token, {
      onSuccess: () => { toast.success(`Pembayaran berhasil — ${payData.orderNumber}`); clearCart(); onClose(); setStep('cart'); },
      onPending: () => { toast.message(`Menunggu pembayaran — ${payData.orderNumber}`); clearCart(); onClose(); setStep('cart'); },
      onError: () => toast.error('Pembayaran gagal'),
      onClose: () => toast.message('Popup pembayaran ditutup. Order tersimpan sebagai pending.'),
    });
  }

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex">
        <div className="flex-1 bg-black/40" onClick={onClose} />
        <aside className="w-full max-w-md bg-white h-full flex flex-col border-l border-[#E5E5E5]">
          <div className="h-14 flex items-center justify-between px-4 border-b border-[#EEEEEE]">
            <div className="flex items-center gap-2">
              {step !== 'cart' && <button onClick={() => setStep('cart')} className="w-8 h-8 flex items-center justify-center hover:bg-[#F5F5F5]"><ChevronLeft size={18} /></button>}
              <h2 className="font-bold text-[#1A1A1A]">
                {step === 'cart' ? `Keranjang (${cart.length})` : step === 'address' ? 'Alamat & Pengiriman' : 'Pembayaran'}
              </h2>
            </div>
            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center hover:bg-[#F5F5F5]"><X size={18} /></button>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-1 px-4 py-2 border-b border-[#EEEEEE]">
            {['cart', 'address', 'pay'].map((s, i) => {
              const active = step === s;
              const done = ['cart', 'address', 'pay'].indexOf(step) > i;
              return (
                <div key={s} className="flex-1 flex items-center gap-1">
                  <div className={`h-1 flex-1 ${active || done ? 'bg-black' : 'bg-[#EEEEEE]'}`} />
                </div>
              );
            })}
          </div>

          {step === 'cart' && (
            <div className="flex-1 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="p-8 text-center text-[#8A8A8A] text-sm">Keranjang kamu kosong.</div>
              ) : cart.map((item) => (
                <div key={item.id} className="flex gap-3 p-4 border-b border-[#EEEEEE]">
                  <img src={imgUrl(item.image, 200, 250, 60)} alt="" className="w-16 h-20 object-cover bg-[#F5F5F5]" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium line-clamp-2 text-[#1A1A1A]">{item.name}</div>
                    <div className="text-sm font-bold mt-1">{formatIDR(item.price)}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => updateCartQty(item.id, item.qty - 1)} className="w-7 h-7 border border-[#E5E5E5] flex items-center justify-center"><Minus size={12} /></button>
                      <span className="text-sm w-6 text-center">{item.qty}</span>
                      <button onClick={() => updateCartQty(item.id, item.qty + 1)} className="w-7 h-7 border border-[#E5E5E5] flex items-center justify-center"><Plus size={12} /></button>
                      <button onClick={() => removeFromCart(item.id)} className="ml-auto text-[#D32F2F]"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 'address' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <input className="w-full h-11 border border-[#E5E5E5] px-3 text-sm" placeholder="Nama lengkap" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input className="w-full h-11 border border-[#E5E5E5] px-3 text-sm" placeholder="Nomor WhatsApp" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <input className="w-full h-11 border border-[#E5E5E5] px-3 text-sm" type="email" placeholder="Email (untuk invoice)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <textarea className="w-full border border-[#E5E5E5] p-3 text-sm" rows={3} placeholder="Alamat lengkap (jalan, RT/RW, patokan)" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />

              <div className="border-t border-[#EEEEEE] pt-3">
                <div className="text-xs font-semibold text-[#333] mb-1.5">Kota / Kecamatan tujuan</div>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A8A]" />
                  <input className="w-full h-11 border border-[#E5E5E5] pl-9 pr-3 text-sm" placeholder="Ketik min. 3 huruf (contoh: Menteng)" value={addrQuery} onChange={(e) => { setAddrQuery(e.target.value); setDestination(null); setRates([]); setSelectedShipping(null); }} />
                </div>
                {addrLoading && <div className="text-xs text-[#8A8A8A] mt-2">Mencari…</div>}
                {!addrLoading && addrError && (
                  <div className="mt-2 text-xs bg-[#F5F5F5] border border-[#D32F2F] text-[#D32F2F] p-2.5">
                    {addrError}
                  </div>
                )}
                {addrResults.length > 0 && (
                  <div className="mt-2 border border-[#E5E5E5] max-h-56 overflow-y-auto divide-y divide-[#EEEEEE]">
                    {addrResults.map((a) => (
                      <button key={a.id} onClick={() => pickDestination(a)} className="w-full text-left px-3 py-2 text-sm hover:bg-[#F5F5F5]">{a.text}</button>
                    ))}
                  </div>
                )}
              </div>

              {destination && (
                <div className="border-t border-[#EEEEEE] pt-3">
                  <div className="text-xs font-semibold text-[#333] mb-1.5 flex items-center gap-2"><Truck size={14} /> Pilih kurir</div>
                  {ratesLoading && <div className="text-xs text-[#8A8A8A]">Menghitung ongkir…</div>}
                  {!ratesLoading && ratesError && (
                    <div className="mb-2 text-xs bg-[#F5F5F5] border border-[#D32F2F] text-[#D32F2F] p-2.5">
                      {ratesError}
                    </div>
                  )}
                  <div className="space-y-2">
                    {rates.map((r, idx) => {
                      const active = selectedShipping?.service === r.service && selectedShipping?.service_name === r.service_name;
                      return (
                        <button key={`${r.service}-${idx}`} onClick={() => setSelectedShipping(r)} className={`w-full text-left p-3 border ${active ? 'border-black bg-[#F5F5F5]' : 'border-[#E5E5E5]'}`}>
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-semibold uppercase">{r.service}</div>
                            <div className="text-sm font-bold">{formatIDR(r.price)}</div>
                          </div>
                          <div className="text-xs text-[#8A8A8A] mt-0.5">{r.service_name}{r.estimated_days ? ` · ${r.estimated_days} hari` : ''}</div>
                        </button>
                      );
                    })}
                    {!ratesLoading && !ratesError && rates.length === 0 && destination && (
                      <div className="text-xs text-[#8A8A8A] bg-[#F5F5F5] p-3">Tidak ada tarif tersedia untuk area ini.</div>
                    )}
                  </div>
                </div>
              )}

              {ref && <div className="text-xs bg-[#F5F5F5] p-2 border border-[#E5E5E5]">Kode afiliasi: <span className="font-bold">{ref}</span></div>}
            </div>
          )}

          <div className="border-t border-[#EEEEEE] p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#8A8A8A]">Subtotal</span>
              <span className="font-semibold">{formatIDR(subtotal)}</span>
            </div>
            {selectedShipping && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#8A8A8A]">Ongkir ({selectedShipping.service.toUpperCase()})</span>
                <span className="font-semibold">{formatIDR(shippingCost)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-base pt-1 border-t border-[#EEEEEE]">
              <span className="font-semibold">Total</span>
              <span className="font-extrabold font-geist">{formatIDR(total)}</span>
            </div>

            {step === 'cart' && (
              <button disabled={cart.length === 0} onClick={startCheckout} className="w-full h-12 bg-black text-white font-semibold disabled:opacity-40 mt-2">
                {auth ? 'Lanjut ke Alamat' : 'Masuk untuk Checkout'}
              </button>
            )}
            {step === 'address' && (
              <button disabled={submitting || !selectedShipping} onClick={proceedToPay} className="w-full h-12 bg-black text-white font-semibold disabled:opacity-40 mt-2 inline-flex items-center justify-center gap-2">
                <CreditCard size={16} /> {submitting ? 'Memproses…' : `Bayar ${formatIDR(total)}`}
              </button>
            )}
          </div>
        </aside>
      </div>
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} title="Masuk untuk Checkout" subtitle="Verifikasi WhatsApp/Email agar kami bisa mengirim konfirmasi pesanan." onSuccess={() => setStep('address')} />
    </>
  );
}
