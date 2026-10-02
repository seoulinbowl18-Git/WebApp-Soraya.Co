'use client';
import { useState } from 'react';
import Header from '@/components/soraya/Header';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PAYOUT_METHODS, setAffiliateCode } from '@/lib/soraya';

export default function AffiliateRegister() {
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', socialLinks: '', payoutMethod: 'bca', accountName: '', accountNumber: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const router = useRouter();

  async function submit(e) {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.phone) { toast.error('Please fill required fields'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/affiliate/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          socialLinks: form.socialLinks,
          payout: { method: form.payoutMethod, accountName: form.accountName, accountNumber: form.accountNumber },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setAffiliateCode(data.affiliate.code);
      setResult(data.affiliate);
      toast.success('Welcome to Soraya.Co Affiliates!');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-xl mx-auto px-4 md:px-6 py-16 text-center">
          <div className="text-xs tracking-widest uppercase text-[#8A8A8A]">Welcome aboard</div>
          <h1 className="text-3xl md:text-5xl font-black mt-3">You&apos;re in.</h1>
          <p className="mt-4 text-[#333]">Your affiliate code:</p>
          <div className="mt-3 text-2xl font-black tracking-widest bg-black text-white py-4 px-6 inline-block">{result.code}</div>
          <div className="mt-6">
            <button onClick={() => router.push('/affiliate/dashboard')} className="h-12 px-6 bg-black text-white font-semibold">Go to Dashboard →</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <section className="max-w-xl mx-auto px-4 md:px-6 py-10">
        <Link href="/affiliate" className="text-sm text-[#8A8A8A] hover:text-black">← Back</Link>
        <h1 className="text-3xl md:text-5xl font-black mt-3">Join the Program</h1>
        <p className="text-sm text-[#8A8A8A] mt-2">Fill in your details to get your affiliate code.</p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <Field label="Full name *"><input className="input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></Field>
          <Field label="Email *"><input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Phone number *"><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Social media profile links"><input placeholder="Instagram, TikTok, etc." className="input" value={form.socialLinks} onChange={(e) => setForm({ ...form, socialLinks: e.target.value })} /></Field>
          <div className="pt-2 border-t border-[#EEEEEE]" />
          <div className="text-xs uppercase tracking-widest text-[#8A8A8A]">Payout account</div>
          <Field label="Method">
            <select className="input" value={form.payoutMethod} onChange={(e) => setForm({ ...form, payoutMethod: e.target.value })}>
              {PAYOUT_METHODS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Account holder name"><input className="input" value={form.accountName} onChange={(e) => setForm({ ...form, accountName: e.target.value })} /></Field>
          <Field label="Account number"><input className="input" value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} /></Field>

          <button disabled={loading} className="w-full h-12 bg-black text-white font-semibold disabled:opacity-40">{loading ? 'Creating…' : 'Create Affiliate Account'}</button>
        </form>

        <style jsx>{`
          .input { width: 100%; height: 44px; border: 1px solid #E5E5E5; padding: 0 12px; font-size: 14px; background: #fff; }
          select.input { height: 44px; }
        `}</style>
      </section>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="text-xs font-semibold text-[#333] mb-1.5">{label}</div>
      {children}
    </label>
  );
}
