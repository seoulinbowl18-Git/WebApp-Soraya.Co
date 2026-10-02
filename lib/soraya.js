// Soraya.Co shared constants & helpers

export const BRAND = 'Soraya.Co';

export const COLORS = {
  surface: '#FFFFFF',
  onSurface: '#1A1A1A',
  surfaceSecondary: '#F5F5F5',
  onSurfaceSecondary: '#333333',
  surfaceTertiary: '#EAEAEA',
  surfaceInverse: '#111111',
  onSurfaceInverse: '#FFFFFF',
  brand: '#000000',
  onBrand: '#FFFFFF',
  muted: '#8A8A8A',
  border: '#E5E5E5',
  divider: '#EEEEEE',
  danger: '#D32F2F',
  success: '#2E7D32',
};

export const CATEGORIES = [
  { slug: 'all', label: 'All' },
  { slug: 'atasan', label: 'Atasan (Top)' },
  { slug: 'blouse', label: 'Blouse' },
  { slug: 'tunik-rayon', label: 'Tunik Rayon' },
  { slug: 'gamis-maxy', label: 'Gamis Maxy' },
  { slug: 'midi-dress', label: 'Midi Dress' },
  { slug: 'setelan', label: 'Setelan' },
  { slug: 'best-seller', label: 'Best Seller' },
  { slug: 'pyajamas', label: 'Pyajamas' },
  { slug: 'promo', label: 'Promo' },
  { slug: 'reseller', label: 'Reseller' },
];

export const PAYMENT_METHODS = {
  bank: [
    { id: 'bca', name: 'BCA' },
    { id: 'bri', name: 'BRI' },
    { id: 'bni', name: 'BNI' },
    { id: 'mandiri', name: 'Mandiri' },
  ],
  ewallet: [
    { id: 'qris', name: 'QRIS' },
    { id: 'dana', name: 'DANA' },
    { id: 'gopay', name: 'GoPay' },
    { id: 'ovo', name: 'OVO' },
    { id: 'shopeepay', name: 'ShopeePay' },
  ],
};

export const PAYOUT_METHODS = [
  { id: 'bca', name: 'BCA' },
  { id: 'bri', name: 'BRI' },
  { id: 'bni', name: 'BNI' },
  { id: 'mandiri', name: 'Mandiri' },
  { id: 'dana', name: 'DANA' },
  { id: 'gopay', name: 'GoPay' },
];

export const MIN_PAYOUT_IDR = 50000;

export const formatIDR = (n) => {
  const v = Number(n || 0);
  return 'Rp ' + v.toLocaleString('id-ID');
};

// Referral cookie helpers (client-side)
export const REF_COOKIE_KEY = 'soraya_ref';
export const REF_TTL_DAYS = 30;

export function setRefCookie(code) {
  if (typeof document === 'undefined') return;
  const d = new Date();
  d.setTime(d.getTime() + REF_TTL_DAYS * 24 * 60 * 60 * 1000);
  document.cookie = `${REF_COOKIE_KEY}=${encodeURIComponent(code)};expires=${d.toUTCString()};path=/`;
  try { localStorage.setItem(REF_COOKIE_KEY, code); } catch (e) {}
}

export function getRefCookie() {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + REF_COOKIE_KEY + '=([^;]*)'));
  if (match) return decodeURIComponent(match[1]);
  try { return localStorage.getItem(REF_COOKIE_KEY); } catch (e) { return null; }
}

// Cart helpers (localStorage)
export const CART_KEY = 'soraya_cart';

export function getCart() {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch { return []; }
}
export function setCart(items) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event('soraya:cart'));
}
export function addToCart(product, qty = 1) {
  const cart = getCart();
  const existing = cart.find((c) => c.id === product.id);
  if (existing) existing.qty += qty;
  else cart.push({ id: product.id, name: product.name, price: product.price, image: product.image, qty });
  setCart(cart);
}
export function updateCartQty(id, qty) {
  const cart = getCart().map((c) => (c.id === id ? { ...c, qty } : c)).filter((c) => c.qty > 0);
  setCart(cart);
}
export function removeFromCart(id) {
  setCart(getCart().filter((c) => c.id !== id));
}
export function clearCart() { setCart([]); }

// Affiliate session (MVP) – stored client-side
export const AFF_KEY = 'soraya_affiliate_code';
export function getAffiliateCode() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AFF_KEY);
}
export function setAffiliateCode(code) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AFF_KEY, code);
}
export function clearAffiliateCode() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AFF_KEY);
}
