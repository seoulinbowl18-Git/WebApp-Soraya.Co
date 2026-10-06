'use client';
import Link from 'next/link';
import { Instagram, Twitter, Youtube, Music2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-16 bg-black text-white">
      <div className="max-w-6xl mx-auto px-6 py-12 text-center">
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Soraya.Co</h2>
        <p className="text-sm text-stone-400 mt-2">Fashion rayon nyaman untuk keseharian.</p>

        {/* Nav links */}
        <nav className="mt-7 flex items-center justify-center gap-6 md:gap-10 text-sm font-semibold">
          <Link href="/about" className="hover:text-stone-300">About Us</Link>
          <Link href="/contact" className="hover:text-stone-300">Contact</Link>
          <Link href="/track" className="hover:text-stone-300">Track Order</Link>
        </nav>

        {/* Socials */}
        <div className="mt-7 flex items-center justify-center gap-4">
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram"
             className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center hover:bg-stone-200 transition">
            <Instagram size={18} />
          </a>
          <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" aria-label="TikTok"
             className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center hover:bg-stone-200 transition">
            <Music2 size={18} />
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter"
             className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center hover:bg-stone-200 transition">
            <Twitter size={18} />
          </a>
          <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube"
             className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center hover:bg-stone-200 transition">
            <Youtube size={18} />
          </a>
        </div>

        {/* Payment accepted */}
        <div className="mt-9">
          <p className="text-xs uppercase tracking-widest text-stone-400">We accept</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
            {['QRIS', 'BCA', 'BRI', 'BNI', 'Mandiri', 'DANA', 'GoPay', 'OVO', 'ShopeePay'].map((m) => (
              <span key={m} className="px-4 py-2 border border-stone-600 rounded-md text-xs font-semibold text-stone-200">
                {m}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-10 text-xs text-stone-500 border-t border-stone-800 pt-6">
          &copy; {new Date().getFullYear()} Soraya.Co. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
