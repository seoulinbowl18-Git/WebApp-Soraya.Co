'use client';
import { useEffect, useState } from 'react';
import Header from '@/components/soraya/Header';
import { SubNav } from '@/app/affiliate/dashboard/page';
import { getAffiliateCode, formatIDR } from '@/lib/soraya';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import QRCode from 'qrcode';

export default function AffiliateLinks() {
  const router = useRouter();
  const [code, setCode] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [manualUrl, setManualUrl] = useState('');
  const [generated, setGenerated] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    const c = getAffiliateCode();
    if (!c) { router.push('/affiliate'); return; }
    setCode(c);
    fetch('/api/products').then((r) => r.json()).then((d) => setProducts(d.items || []));
  }, []);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  async function generate(url) {
    if (!code) return;
    let trackedUrl = url;
    try {
      const u = new URL(url);
      u.searchParams.set('ref', code);
      trackedUrl = u.toString();
    } catch {
      trackedUrl = `${url}${url.includes('?') ? '&' : '?'}ref=${code}`;
    }
    setGenerated(trackedUrl);
    const dataUrl = await QRCode.toDataURL(trackedUrl, { margin: 1, width: 320, color: { dark: '#000000', light: '#FFFFFF' } });
    setQrDataUrl(dataUrl);
  }

  function copy() {
    if (!generated) return;
    navigator.clipboard.writeText(generated);
    toast.success('Link copied');
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        <h1 className="text-3xl md:text-4xl font-black">Links & QR</h1>
        <SubNav active="links" />

        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <div className="border border-[#E5E5E5] p-5">
            <div className="text-xs uppercase tracking-widest text-[#8A8A8A]">Pick a product</div>
            <div className="mt-3 max-h-96 overflow-y-auto divide-y divide-[#EEEEEE]">
              {products.map((p) => (
                <button key={p.id} onClick={() => { setSelectedId(p.id); generate(`${origin}/product/${p.id}`); }} className={`w-full text-left flex gap-3 py-3 ${selectedId === p.id ? 'bg-[#F5F5F5]' : ''}`}>
                  <img src={`${p.image}?auto=format&fit=crop&w=120&h=150&q=50`} className="w-12 h-16 object-cover bg-[#F5F5F5]" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium line-clamp-2">{p.name}</div>
                    <div className="text-xs text-[#8A8A8A] mt-0.5">{formatIDR(p.price)} · {p.commissionPct || 10}% commission</div>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-5 border-t border-[#EEEEEE] pt-4">
              <div className="text-xs uppercase tracking-widest text-[#8A8A8A]">Or paste a product URL</div>
              <div className="flex gap-2 mt-2">
                <input value={manualUrl} onChange={(e) => setManualUrl(e.target.value)} placeholder="https://soraya.co/product/..." className="flex-1 h-11 border border-[#E5E5E5] px-3 text-sm" />
                <button onClick={() => generate(manualUrl)} className="h-11 px-4 bg-black text-white text-sm font-semibold">Generate</button>
              </div>
            </div>
          </div>

          <div className="border border-[#E5E5E5] p-5">
            <div className="text-xs uppercase tracking-widest text-[#8A8A8A]">Your tracked link</div>
            {generated ? (
              <>
                <div className="mt-3 bg-[#F5F5F5] p-3 text-xs break-all font-mono">{generated}</div>
                <div className="mt-3 flex gap-2">
                  <button onClick={copy} className="flex-1 h-11 bg-black text-white font-semibold text-sm">Copy Link</button>
                  <a href={qrDataUrl} download={`soraya-${code}.png`} className="flex-1 h-11 border border-black font-semibold text-sm leading-[44px] text-center">Download QR</a>
                </div>
                <div className="mt-5 flex justify-center bg-white border border-[#EEEEEE] p-5">
                  {qrDataUrl && <img src={qrDataUrl} alt="QR" className="w-56 h-56" />}
                </div>
                <div className="text-xs text-[#8A8A8A] mt-3 text-center">Share this QR on Instagram Stories, TikTok, or print it out — every scan is tracked.</div>
              </>
            ) : (
              <div className="mt-10 text-center text-sm text-[#8A8A8A]">Select a product or paste a URL to generate your link.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
