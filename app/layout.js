import './globals.css';
import { Toaster } from 'sonner';

export const metadata = {
  title: 'Soraya.Co — Modest Fashion',
  description: 'Soraya.Co storefront & affiliate center.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-white text-[#1A1A1A] antialiased" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif' }}>
        {children}
        <Toaster position="top-center" theme="light" richColors={false} />
      </body>
    </html>
  );
}
