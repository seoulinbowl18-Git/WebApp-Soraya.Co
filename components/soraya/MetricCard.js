'use client';
// Flat #F5F5F5 card with #000000 border per spec
export default function MetricCard({ label, value, hint }) {
  return (
    <div className="bg-[#F5F5F5] border border-black p-4 md:p-5">
      <div className="text-[11px] uppercase tracking-widest text-[#333333] font-semibold">{label}</div>
      <div className="text-2xl md:text-3xl font-extrabold mt-2 text-[#1A1A1A] font-geist">{value}</div>
      {hint && <div className="text-xs text-[#8A8A8A] mt-1">{hint}</div>}
    </div>
  );
}
