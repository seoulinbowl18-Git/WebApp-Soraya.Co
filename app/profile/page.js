'use client';
import { useEffect, useState } from 'react';
import { getAuth, clearAuth } from '@/lib/auth';
import Header from '@/components/soraya/Header';
import Link from 'next/link';
import { toast } from 'sonner';
import LoginModal from '@/components/soraya/LoginModal';
import { Package, UserRound, LogOut, MapPin, Wallet, Info, Phone, Truck, HelpCircle, Briefcase, Instagram, ArrowRight } from 'lucide-react';
import { getAffiliateCode } from '@/lib/soraya';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const [auth, setAuth] = useState(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [affiliateCode, setAffiliateCodeState] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const update = () => { setAuth(getAuth()); setAffiliateCodeState(getAffiliateCode()); };
    update();
    window.addEventListener('soraya:auth', update);
    window.addEventListener('storage', update);
    return () => { window.removeEventListener('soraya:auth', update); window.removeEventListener('storage', update); };
  }, []);

  function logout() {
    clearAuth();
    toast.success('Keluar berhasil');
  }

  const isAffiliate = !!affiliateCode;

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <section className="max-w-xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {!auth ? (
          <>
            <div className="bg-[#F5F5F5] border border-[#E5E5E5] p-6">
              <h1 className="text-2xl font-extrabold font-geist">Selamat Datang di Soraya.Co</h1>
              <p className="text-sm text-[#333] mt-2">Masuk akun untuk cek status pesanan & gabung program affiliate.</p>
              <button onClick={() => setLoginOpen(true)} className="mt-4 w-full h-12 bg-black text-white font-semibold">Masuk / Daftar</button>
            </div>
            <nav className="mt-6 divide-y divide-[#EEEEEE] border border-[#E5E5E5]">
              <MenuItem icon={Briefcase} label="Program Afiliasi Soraya.Co" onClick={() => setLoginOpen(true)} />
              <MenuItem icon={Package} label="Melacak Pesanan (Track Order)" onClick={() => setLoginOpen(true)} />
              <MenuItem icon={Info} label="Tentang Kami" href="#about" />
              <MenuItem icon={Phone} label="Hubungi Kami" href="#contact" />
              <MenuItem icon={Truck} label="Pengiriman & Pengembalian" href="#shipping" />
              <MenuItem icon={HelpCircle} label="FAQ" href="#faq" />
            </nav>
          </>
        ) : (
          <>
            <div className="bg-[#F5F5F5] border border-[#E5E5E5] p-6">
              <div className="w-14 h-14 bg-black text-white flex items-center justify-center font-extrabold text-xl rounded-full">
                {(auth.user?.name || auth.user?.identifier || '?').slice(0, 1).toUpperCase()}
              </div>
              <div className="mt-3 text-xl font-extrabold font-geist">{auth.user?.name || 'Pengguna Soraya'}</div>
              <div className="text-sm text-[#8A8A8A]">{auth.user?.identifier}</div>
            </div>

            {isAffiliate && (
              <div className="mt-4 bg-black text-white p-5 flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-white/60">Status</div>
                  <div className="text-lg font-bold">Affiliate Active</div>
                  <div className="text-xs text-white/60 mt-0.5">Kode: <span className="font-mono tracking-widest">{affiliateCode}</span></div>
                </div>
                <Link href="/affiliate/dashboard" className="h-10 px-4 bg-white text-black font-semibold text-sm leading-10 inline-flex items-center gap-2">Buka Dashboard <ArrowRight size={14} /></Link>
              </div>
            )}

            <nav className="mt-6 divide-y divide-[#EEEEEE] border border-[#E5E5E5]">
              <MenuItem icon={Package} label="Pesanan Saya" href="/orders" />
              <MenuItem icon={MapPin} label="Alamat Pengiriman" href="#addresses" />
              <MenuItem icon={Wallet} label="Dashboard Afiliasi" href={isAffiliate ? '/affiliate/dashboard' : '/affiliate'} />
              <MenuItem icon={Info} label="Tentang Kami" href="#about" />
              <MenuItem icon={Phone} label="Hubungi Kami" href="#contact" />
              <MenuItem icon={Truck} label="Pengiriman & Pengembalian" href="#shipping" />
              <MenuItem icon={HelpCircle} label="FAQ" href="#faq" />
              <MenuItem icon={LogOut} label="Keluar" onClick={logout} danger />
            </nav>
          </>
        )}

        <div className="mt-10 border-t border-[#EEEEEE] pt-6 text-center">
          <div className="text-xs text-[#8A8A8A] mb-3">Ikuti kami</div>
          <div className="flex items-center justify-center gap-3">
            <a href="#" className="w-9 h-9 border border-[#E5E5E5] flex items-center justify-center"><Instagram size={16} /></a>
            <a href="#" className="w-9 h-9 border border-[#E5E5E5] flex items-center justify-center font-bold text-xs">TT</a>
          </div>
          <div className="mt-6 text-xs text-[#8A8A8A]">Metode Pembayaran</div>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            {['BCA', 'BRI', 'BNI', 'Mandiri', 'QRIS', 'DANA', 'GoPay', 'OVO', 'ShopeePay'].map((p) => (
              <span key={p} className="text-[10px] font-bold border border-[#E5E5E5] px-2 py-1">{p}</span>
            ))}
          </div>
        </div>
      </section>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
}

function MenuItem({ icon: Icon, label, href, onClick, danger }) {
  const inner = (
    <div className={`flex items-center gap-3 h-12 px-4 ${danger ? 'text-[#D32F2F]' : 'text-[#1A1A1A]'} hover:bg-[#F5F5F5]`}>
      <Icon size={16} />
      <span className="text-sm font-medium flex-1">{label}</span>
      <ArrowRight size={14} className="text-[#8A8A8A]" />
    </div>
  );
  if (href) return <Link href={href}>{inner}</Link>;
  return <button onClick={onClick} className="w-full text-left">{inner}</button>;
}
