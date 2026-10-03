'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Link2, Package, Receipt, Wallet, LogOut, Menu, X } from 'lucide-react';
import Header from '@/components/soraya/Header';
import LoginModal from '@/components/soraya/LoginModal';
import { clearAffiliateCode, getAffiliateCode } from '@/lib/soraya';
import { getAuth, clearAuth } from '@/lib/auth';

const NAV = [
  { href: '/affiliate/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/affiliate/links', label: 'Link & QR', icon: Link2 },
  { href: '/affiliate/products', label: 'Katalog Komisi', icon: Package },
  { href: '/affiliate/orders', label: 'Pesanan', icon: Receipt },
  { href: '/affiliate/payouts', label: 'Dompet', icon: Wallet },
];

export default function AffiliateShell({ children, affiliate }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState(null);
  const [auth, setAuth] = useState(null);
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    const c = getAffiliateCode();
    const a = getAuth();
    setCode(c);
    setAuth(a);
    if (!a) { setLoginOpen(true); return; }
    if (!c) router.push('/affiliate');
    const update = () => setAuth(getAuth());
    window.addEventListener('soraya:auth', update);
    return () => window.removeEventListener('soraya:auth', update);
  }, []);

  function signOut() { clearAffiliateCode(); clearAuth(); router.push('/affiliate'); }

  if (!auth) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-extrabold font-geist">Masuk untuk mengakses Dashboard Afiliasi</h1>
          <p className="text-sm text-[#8A8A8A] mt-2">Verifikasi akun kamu via WhatsApp atau Email.</p>
          <button onClick={() => setLoginOpen(true)} className="mt-5 h-12 px-6 bg-black text-white font-semibold">Masuk Sekarang</button>
        </div>
        <LoginModal open={loginOpen} onClose={() => router.push('/')} title="Masuk ke Affiliate Center" onSuccess={() => { setAuth(getAuth()); if (!getAffiliateCode()) router.push('/affiliate'); }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      {affiliate?.status === 'pending' && (
        <div className="bg-[#111111] text-white text-sm text-center py-2 px-4">
          <strong>Verifikasi Pending</strong> — Akun afiliasi Anda sedang menunggu aktivasi oleh admin Soraya.Co. Anda tetap bisa menyiapkan link & QR Anda.
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 flex gap-6">
        <aside className="hidden md:block w-56 shrink-0">
          <div className="border border-[#E5E5E5]">
            <div className="p-4 border-b border-[#EEEEEE]">
              <div className="text-[11px] uppercase tracking-widest text-[#8A8A8A]">Kode Afiliasi</div>
              <div className="text-base font-extrabold tracking-widest">{code || '---'}</div>
            </div>
            <nav className="p-2">
              {NAV.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return <Link key={item.href} href={item.href} className={`flex items-center gap-3 h-10 px-3 text-sm font-medium ${active ? 'bg-black text-white' : 'text-[#333333] hover:bg-[#F5F5F5]'}`}><Icon size={16} /> {item.label}</Link>;
              })}
              <button onClick={signOut} className="flex items-center gap-3 h-10 px-3 text-sm font-medium text-[#333333] hover:bg-[#F5F5F5] w-full text-left"><LogOut size={16} /> Keluar</button>
            </nav>
          </div>
        </aside>

        <button onClick={() => setOpen(true)} className="md:hidden fixed bottom-5 right-5 z-30 w-12 h-12 bg-black text-white flex items-center justify-center rounded-full"><Menu size={20} /></button>
        {open && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
            <aside className="absolute right-0 top-0 h-full w-72 bg-white border-l border-[#E5E5E5] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-[#8A8A8A]">Kode Afiliasi</div>
                  <div className="text-base font-extrabold tracking-widest">{code || '---'}</div>
                </div>
                <button onClick={() => setOpen(false)}><X size={20} /></button>
              </div>
              <nav className="mt-6">
                {NAV.map((item) => { const Icon = item.icon; const active = pathname === item.href; return <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={`flex items-center gap-3 h-11 px-3 text-sm font-medium ${active ? 'bg-black text-white' : 'text-[#333333] hover:bg-[#F5F5F5]'}`}><Icon size={16} /> {item.label}</Link>; })}
                <button onClick={signOut} className="flex items-center gap-3 h-11 px-3 text-sm font-medium text-[#333333] w-full text-left mt-2 border-t border-[#EEEEEE]"><LogOut size={16} /> Keluar</button>
              </nav>
            </aside>
          </div>
        )}

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
