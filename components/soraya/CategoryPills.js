'use client';
import { CATEGORIES } from '@/lib/soraya';

export default function CategoryPills({ value, onChange }) {
  return (
    <div className="w-full border-b border-[#EEEEEE] bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex gap-2 overflow-x-auto no-scrollbar">
        {CATEGORIES.map((c) => {
          const active = value === c.slug;
          return (
            <button
              key={c.slug}
              onClick={() => onChange(c.slug)}
              className={`shrink-0 px-4 h-9 text-sm font-medium transition-colors ${
                active
                  ? 'bg-black text-white'
                  : 'bg-[#F5F5F5] text-[#333333] hover:bg-[#EAEAEA]'
              }`}
              style={{ borderRadius: 999 }}
            >
              {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
