'use client';
import { useEffect, useState } from 'react';
import { X, Minus, Plus, Trash2 } from 'lucide-react';
import { getCart, updateCartQty, removeFromCart, formatIDR, getRefCookie, clearCart, PAYMENT_METHODS } from '@/lib/soraya';
import { toast } from 'sonner';

export default function CartDrawer({ open, onClose }) {
  const [cart, setCart] = useState([]);
  const [checkout, setCheckout] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '', payment: 'bca' });
  const [submitting, setSubmitting] = useState(false);
  const [ref, setRef] = useState(null);

  useEffect(() => {
    const update = () => setCart(getCart());
    update();
    setRef(getRefCookie());
    window.addEventListener('soraya:cart', update);
    return () => window.removeEventListener('soraya:cart', update);
  }, [open]);

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  async function submitOrder() {
    if (!form.name || !form.phone || !form.address) {
      toast.error('Please fill name, phone, and address');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((c) => ({ id: c.id, qty: c.qty })),
          customer: { name: form.name, phone: form.phone, address: form.address },
          paymentMethod: form.payment,
          ref: ref || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success(`Order ${data.order.orderNumber} placed!`);
      clearCart();
      setCheckout(false);
      onClose();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <aside className="w-full max-w-md bg-white h-full flex flex-col border-l border-[#E5E5E5]">
        <div className="h-14 flex items-center justify-between px-4 border-b border-[#EEEEEE]">
          <h2 className="font-bold text-[#1A1A1A]">{checkout ? 'Checkout' : `Cart (${cart.length})`}</h2>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center hover:bg-[#F5F5F5]"><X size={18} /></button>
        </div>

        {!checkout ? (
          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="p-8 text-center text-[#8A8A8A] text-sm">Your cart is empty.</div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex gap-3 p-4 border-b border-[#EEEEEE]">
                  <img src={`${item.image}?auto=format&fit=crop&w=200&h=250&q=60`} alt="" className="w-16 h-20 object-cover bg-[#F5F5F5]" />
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
              ))
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <input className="w-full h-11 border border-[#E5E5E5] px-3 text-sm" placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="w-full h-11 border border-[#E5E5E5] px-3 text-sm" placeholder="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <textarea className="w-full border border-[#E5E5E5] p-3 text-sm" rows={3} placeholder="Shipping address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <div>
              <div className="text-xs font-semibold text-[#333] mb-2 mt-2">Bank Transfer</div>
              <div className="grid grid-cols-4 gap-2">
                {PAYMENT_METHODS.bank.map((m) => (
                  <button key={m.id} onClick={() => setForm({ ...form, payment: m.id })} className={`h-10 border text-xs font-semibold ${form.payment === m.id ? 'bg-black text-white border-black' : 'border-[#E5E5E5] text-[#333]'}`}>{m.name}</button>
                ))}
              </div>
              <div className="text-xs font-semibold text-[#333] mb-2 mt-3">E-Wallet / Instant</div>
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_METHODS.ewallet.map((m) => (
                  <button key={m.id} onClick={() => setForm({ ...form, payment: m.id })} className={`h-10 border text-xs font-semibold ${form.payment === m.id ? 'bg-black text-white border-black' : 'border-[#E5E5E5] text-[#333]'}`}>{m.name}</button>
                ))}
              </div>
            </div>
            {ref && <div className="text-xs bg-[#F5F5F5] p-2 border border-[#E5E5E5]">Referral code applied: <span className="font-bold">{ref}</span></div>}
          </div>
        )}

        <div className="border-t border-[#EEEEEE] p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#8A8A8A]">Subtotal</span>
            <span className="font-bold text-[#1A1A1A]">{formatIDR(subtotal)}</span>
          </div>
          {!checkout ? (
            <button disabled={cart.length === 0} onClick={() => setCheckout(true)} className="w-full h-12 bg-black text-white font-semibold disabled:opacity-40">Checkout</button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setCheckout(false)} className="flex-1 h-12 border border-[#E5E5E5] font-semibold">Back</button>
              <button disabled={submitting} onClick={submitOrder} className="flex-1 h-12 bg-black text-white font-semibold disabled:opacity-40">{submitting ? 'Placing…' : 'Place Order'}</button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
