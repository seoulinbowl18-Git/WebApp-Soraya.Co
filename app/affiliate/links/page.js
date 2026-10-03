'use client';
import { useEffect, useState } from 'react';
import AffiliateShell from '@/components/soraya/AffiliateShell';
import { getAffiliateCode, formatIDR, imgUrl } from '@/lib/soraya';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import { Copy, Download } from 'lucide-react';

export default function AffiliateLinks() {
  const router = useRouter();
  const [code, setCode] = useState(null);
  const [affiliate, setAffiliate] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [manualUrl, setManualUrl] = useState('');
  const [generated, setGenerated] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    const c = getAffiliateCode();
    if (!c) { router.push('/affiliate'); return; }
    setCode(c);
    fetch(`/api/affiliate/${c}`).then((r) => r.json()).then((d) => setAffiliate(d.affiliate));
    fetch('/api/products').then((r) => r.json()).then((d) => setProducts(d.items || []));
  }, []);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  async function generate(url) {
    if (!code || !url) return;
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
    toast.success('Link disalin');
  }

  return (
    <AffiliateShell affiliate={affiliate}>
      <h1 className="text-3xl md:text-4xl font-extrabold font-geist">Link & QR Code</h1>
      <p className="text-sm text-[#8A8A8A] mt-2">Pilih produk atau tempel URL — kami akan buat tracking link + QR Code otomatis.</p>

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <div className="border border-[#E5E5E5] p-5">
          <div className="text-xs uppercase tracking-widest text-[#8A8A8A]">Tempel URL produk</div>
          <div className="flex gap-2 mt-2">
            <input value={manualUrl} onChange={(e) => setManualUrl(e.target.value)} placeholder="https://soraya.co/product/…" className="flex-1 h-11 border border-[#E5E5E5] px-3 text-sm" />
            <button onClick={() => generate(manualUrl)} className="h-11 px-4 bg-black text-white text-sm font-semibold">Buat Link</button>
          </div>

          <div className="mt-5 border-t border-[#EEEEEE] pt-4">
            <div className="text-xs uppercase tracking-widest text-[#8A8A8A]">Atau pilih produk</div>
            <div className="mt-3 max-h-96 overflow-y-auto divide-y divide-[#EEEEEE]">
              {products.map((p) => (
                <button key={p.id} onClick={() => { setSelectedId(p.id); generate(`${origin}/product/${p.id}`); }} className={`w-full text-left flex gap-3 py-3 px-2 ${selectedId === p.id ? 'bg-[#F5F5F5]' : ''}`}>
                  <img src={imgUrl(p.image, 120, 150, 50)} className="w-12 h-16 object-cover bg-[#F5F5F5]" alt="" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium line-clamp-2">{p.name}</div>
                    <div className="text-xs text-[#8A8A8A] mt-0.5">{formatIDR(p.price)} · {p.commissionPct || 10}% komisi</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="border border-[#E5E5E5] p-5">
          <div className="text-xs uppercase tracking-widest text-[#8A8A8A]">Tracking link kamu</div>
          {generated ? (
            <>
              <div className="mt-3 bg-[#F5F5F5] p-3 text-xs break-all font-mono border border-[#E5E5E5]">{generated}</div>
              <div className="mt-3 flex gap-2">
                <button onClick={copy} className="flex-1 h-11 bg-black text-white font-semibold text-sm inline-flex items-center justify-center gap-2"><Copy size={14}/> Salin Link</button>
                <a href={qrDataUrl} download={`soraya-${code}.png`} className="flex-1 h-11 border border-black font-semibold text-sm leading-[44px] text-center inline-flex items-center justify-center gap-2"><Download size={14}/> Unduh QR</a>
              </div>
              <div className="mt-5 flex justify-center bg-white border border-[#EEEEEE] p-5">
                {qrDataUrl && <img src={qrDataUrl} alt="QR" className="w-56 h-56" />}
              </div>
              <div className="text-xs text-[#8A8A8A] mt-3 text-center">Bagikan QR ini di Instagram Stories, TikTok, atau cetak — setiap scan akan terlacak.</div>
            </>
          ) : (
            <div className="mt-10 text-center text-sm text-[#8A8A8A]">Pilih produk atau tempel URL untuk membuat link kamu.</div>
          )}
        </div>
      </div>
    </AffiliateShell>
  );
}
