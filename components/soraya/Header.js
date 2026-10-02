'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ShoppingBag, User, Search } from 'lucide-react';
import { getCart } from '@/lib/soraya';

export default function Header({ onSearch, searchValue, showSearch = true, onCartClick }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const update = () => setCount(getCart().reduce((s, i) => s + i.qty, 0));
    update();
    window.addEventListener('soraya:cart', update);
    window.addEventListener('storage', update);
    return () => {
      window.removeEventListener('soraya:cart', update);
      window.removeEventListener('storage', update);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E5E5E5]">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center gap-4">
        <Link href="/" className="text-xl md:text-2xl font-black tracking-tight text-[#1A1A1A] shrink-0">
          Soraya.Co
        </Link>
        {showSearch && (
          <div className="flex-1 max-w-xl mx-auto hidden md:flex items-center bg-[#F5F5F5] rounded-md px-3 h-10">
            <Search size={16} className="text-[#8A8A8A] mr-2" />
            <input
              value={searchValue || ''}
              onChange={(e) => onSearch && onSearch(e.target.value)}
              placeholder="Search products…"
              className="bg-transparent outline-none w-full text-sm text-[#1A1A1A] placeholder:text-[#8A8A8A]"
            />
          </div>
        )}
        <nav className="ml-auto flex items-center gap-3 md:gap-5">
          <Link href="/affiliate" className="hidden sm:inline text-sm font-medium text-[#333333] hover:text-black">
            Affiliate
          </Link>
          <button
            onClick={onCartClick}
            className="relative w-10 h-10 flex items-center justify-center rounded-md hover:bg-[#F5F5F5]"
            aria-label="Cart"
          >
            <ShoppingBag size={18} />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {count}
              </span>
            )}
          </button>
          <Link href="/affiliate" className="w-10 h-10 flex items-center justify-center rounded-md hover:bg-[#F5F5F5]" aria-label="Profile">
            <User size={18} />
          </Link>
        </nav>
      </div>
      {showSearch && (
        <div className="md:hidden px-4 pb-3">
          <div className="flex items-center bg-[#F5F5F5] rounded-md px-3 h-10">
            <Search size={16} className="text-[#8A8A8A] mr-2" />
            <input
              value={searchValue || ''}
              onChange={(e) => onSearch && onSearch(e.target.value)}
              placeholder="Search products…"
              className="bg-transparent outline-none w-full text-sm"
            />
          </div>
        </div>
      )}
    </header>
  );
}
