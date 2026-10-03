export const MOBILE_PRODUCTS_URL = 'https://style-commerce-app-5.preview.emergentagent.com/api/products';

const IMG = (id) => `https://images.unsplash.com/${id}`;
const DESCRIPTION = 'Modest wear premium dari Soraya.Co. Dibuat dari bahan pilihan untuk kenyamanan dan tampilan elegan.';

export const FALLBACK_PRODUCTS = [
  { id: 'soraya-001', name: 'Soraya Blouse Linen Beige', category: 'blouse', price: 185000, originalPrice: 245000, image: IMG('photo-1652953338424-612617bc4b8e') },
  { id: 'soraya-002', name: 'Atasan Katun Hitam Minimal', category: 'atasan', price: 165000, originalPrice: 199000, image: IMG('photo-1652953338411-5d9ccc011c83') },
  { id: 'soraya-003', name: 'Tunik Rayon Monokrom', category: 'tunik-rayon', price: 215000, originalPrice: 265000, image: IMG('photo-1652953338199-41a65077091e') },
  { id: 'soraya-004', name: 'Gamis Maxy Elegant Noir', category: 'gamis-maxy', price: 345000, originalPrice: 425000, image: IMG('photo-1596703343516-57c8fe6282d7') },
  { id: 'soraya-005', name: 'Midi Dress Grey Stone', category: 'midi-dress', price: 275000, originalPrice: 325000, image: IMG('photo-1504051771394-dd2e66b2e08f') },
  { id: 'soraya-006', name: 'Setelan Daily Essentials', category: 'setelan', price: 285000, originalPrice: 349000, image: IMG('photo-1601653233006-5c9fd30eab12') },
  { id: 'soraya-007', name: 'Best Seller: Abaya Noir', category: 'best-seller', price: 395000, originalPrice: 495000, image: IMG('photo-1716505681246-2f2e0f41871c') },
].map((p) => ({
  ...p,
  categories: [p.category],
  description: DESCRIPTION,
  commissionPct: 10,
  stock: 50,
  variants: [],
  sizes: [],
  source: 'fallback',
}));

export function filterProducts(items, category, search) {
  let out = items;
  if (category && category !== 'all') out = out.filter((p) => (p.categories || [p.category]).includes(category));
  if (search) out = out.filter((p) => (p.name || '').toLowerCase().includes(search.toLowerCase()));
  return out;
}
