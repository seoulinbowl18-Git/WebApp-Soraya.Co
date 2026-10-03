'use client';
// Client-side referral middleware: captures ?ref=CODE on ANY storefront page,
// stores in cookie + localStorage (30 days), and fires a click-track event.
import { useEffect } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { setRefCookie } from '@/lib/soraya';

export default function ReferralTracker() {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    const r = searchParams.get('ref');
    if (!r) return;
    setRefCookie(r);
    // Try to extract productId from /product/[id]
    let productId = null;
    const m = pathname && pathname.match(/^\/product\/([^/]+)$/);
    if (m) productId = m[1];
    fetch('/api/affiliate/track-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref: r, productId }),
    }).catch(() => {});
  }, [searchParams, pathname]);

  return null;
}
