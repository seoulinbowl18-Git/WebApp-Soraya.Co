import './globals.css';
import { Plus_Jakarta_Sans } from 'next/font/google';
import Script from 'next/script';
import { Toaster } from 'sonner';
import { getMidtransClientKey, getSnapScriptUrl } from '@/lib/midtrans';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata = {
  title: 'Soraya.Co — Modest Fashion',
  description: 'Soraya.Co storefront & affiliate center.',
};

export default function RootLayout({ children }) {
  const snapUrl = process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL || getSnapScriptUrl();
  const clientKey = getMidtransClientKey();
  return (
    <html lang="id" className={jakarta.variable}>
      <body className="bg-white text-[#1A1A1A] antialiased font-jakarta">
        {children}
        <Toaster position="top-center" theme="light" richColors={false} />
        <Script src={snapUrl} data-client-key={clientKey} strategy="afterInteractive" />
      </body>
    </html>
  );
}
