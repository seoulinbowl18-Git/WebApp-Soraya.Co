'use client';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { setAuth } from '@/lib/auth';

export default function LoginModal({ open, onClose, onSuccess, title = 'Masuk ke Soraya.Co', subtitle = 'Gunakan WhatsApp atau Email untuk masuk.' }) {
  const [step, setStep] = useState('identifier'); // identifier | otp
  const [mode, setMode] = useState('phone');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setStep('identifier'); setOtp(''); setDevOtp(null); setIdentifier('');
    }
  }, [open]);

  async function requestOtp() {
    if (!identifier.trim()) { toast.error('Isi dulu identitas kamu'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengirim OTP');
      setDevOtp(data.devOtp || null);
      setStep('otp');
      toast.success(`Kode OTP terkirim via ${mode === 'phone' ? 'WhatsApp' : 'Email'}`);
    } catch (e) { toast.error(e.message); } finally { setLoading(false); }
  }

  async function verifyOtp() {
    if (otp.length < 4) { toast.error('Masukkan kode OTP'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), otp, mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'OTP salah');
      setAuth({ token: data.token, user: data.user });
      toast.success('Berhasil masuk!');
      onSuccess && onSuccess(data.user);
      onClose();
    } catch (e) { toast.error(e.message); } finally { setLoading(false); }
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm border border-black">
        <div className="flex items-center justify-between h-12 px-4 border-b border-[#EEEEEE]">
          <div className="font-bold">{step === 'identifier' ? title : 'Verifikasi OTP'}</div>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="p-5">
          {step === 'identifier' ? (
            <>
              <p className="text-sm text-[#8A8A8A]">{subtitle}</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button onClick={() => setMode('phone')} className={`h-10 text-sm font-semibold border ${mode === 'phone' ? 'bg-black text-white border-black' : 'bg-white text-[#333] border-[#E5E5E5]'}`}>WhatsApp</button>
                <button onClick={() => setMode('email')} className={`h-10 text-sm font-semibold border ${mode === 'email' ? 'bg-black text-white border-black' : 'bg-white text-[#333] border-[#E5E5E5]'}`}>Email</button>
              </div>
              <input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={mode === 'phone' ? 'Nomor WhatsApp (08…)' : 'alamat@email.com'}
                type={mode === 'phone' ? 'tel' : 'email'}
                className="mt-3 w-full h-11 border border-[#E5E5E5] px-3 text-sm"
              />
              <button disabled={loading} onClick={requestOtp} className="mt-4 w-full h-12 bg-black text-white font-semibold disabled:opacity-40">{loading ? 'Memproses…' : 'Kirim Kode OTP'}</button>
              <div className="mt-3 text-[11px] text-center text-[#8A8A8A]">Tanpa password. Kami kirim kode 6 digit.</div>
            </>
          ) : (
            <>
              <p className="text-sm text-[#8A8A8A]">Kode OTP dikirim ke <strong className="text-[#1A1A1A]">{identifier}</strong></p>
              {devOtp && (
                <div className="mt-3 bg-[#F5F5F5] border border-black p-3 text-xs">
                  <div className="font-bold">MODE DEV — Mock OTP</div>
                  <div className="mt-1">Kode kamu: <span className="font-mono font-bold text-base tracking-widest">{devOtp}</span></div>
                </div>
              )}
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="• • • • • •"
                inputMode="numeric"
                className="mt-4 w-full h-14 border border-[#E5E5E5] px-3 text-center text-2xl font-mono tracking-[0.5em]"
              />
              <button disabled={loading} onClick={verifyOtp} className="mt-4 w-full h-12 bg-black text-white font-semibold disabled:opacity-40">{loading ? 'Memeriksa…' : 'Verifikasi & Masuk'}</button>
              <button onClick={() => setStep('identifier')} className="mt-2 w-full h-10 text-sm text-[#8A8A8A]">← Ganti nomor/email</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
