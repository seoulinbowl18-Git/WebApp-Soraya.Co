// Local fallback catalog for Indonesian cities / kecamatan.
// Used when KiriminAja API blocks our IP so checkout flow doesn't break.
// IDs are prefixed with "LOCAL-" to differentiate from real KiriminAja district ids.

export const FALLBACK_DISTRICTS = [
  // DKI Jakarta
  { id: 'LOCAL-JKT-01', text: 'Menteng, Jakarta Pusat, DKI Jakarta', province: 'DKI Jakarta', zone: 'jabodetabek' },
  { id: 'LOCAL-JKT-02', text: 'Tanah Abang, Jakarta Pusat, DKI Jakarta', province: 'DKI Jakarta', zone: 'jabodetabek' },
  { id: 'LOCAL-JKT-03', text: 'Gambir, Jakarta Pusat, DKI Jakarta', province: 'DKI Jakarta', zone: 'jabodetabek' },
  { id: 'LOCAL-JKT-04', text: 'Setiabudi, Jakarta Selatan, DKI Jakarta', province: 'DKI Jakarta', zone: 'jabodetabek' },
  { id: 'LOCAL-JKT-05', text: 'Kebayoran Baru, Jakarta Selatan, DKI Jakarta', province: 'DKI Jakarta', zone: 'jabodetabek' },
  { id: 'LOCAL-JKT-06', text: 'Mampang Prapatan, Jakarta Selatan, DKI Jakarta', province: 'DKI Jakarta', zone: 'jabodetabek' },
  { id: 'LOCAL-JKT-07', text: 'Pancoran, Jakarta Selatan, DKI Jakarta', province: 'DKI Jakarta', zone: 'jabodetabek' },
  { id: 'LOCAL-JKT-08', text: 'Tebet, Jakarta Selatan, DKI Jakarta', province: 'DKI Jakarta', zone: 'jabodetabek' },
  { id: 'LOCAL-JKT-09', text: 'Kemang, Jakarta Selatan, DKI Jakarta', province: 'DKI Jakarta', zone: 'jabodetabek' },
  { id: 'LOCAL-JKT-10', text: 'Cilandak, Jakarta Selatan, DKI Jakarta', province: 'DKI Jakarta', zone: 'jabodetabek' },
  { id: 'LOCAL-JKT-11', text: 'Pondok Indah, Jakarta Selatan, DKI Jakarta', province: 'DKI Jakarta', zone: 'jabodetabek' },
  { id: 'LOCAL-JKT-12', text: 'Kuningan, Jakarta Selatan, DKI Jakarta', province: 'DKI Jakarta', zone: 'jabodetabek' },
  { id: 'LOCAL-JKT-13', text: 'Senayan, Jakarta Pusat, DKI Jakarta', province: 'DKI Jakarta', zone: 'jabodetabek' },
  { id: 'LOCAL-JKT-14', text: 'Grogol, Jakarta Barat, DKI Jakarta', province: 'DKI Jakarta', zone: 'jabodetabek' },
  { id: 'LOCAL-JKT-15', text: 'Kebon Jeruk, Jakarta Barat, DKI Jakarta', province: 'DKI Jakarta', zone: 'jabodetabek' },
  { id: 'LOCAL-JKT-16', text: 'Palmerah, Jakarta Barat, DKI Jakarta', province: 'DKI Jakarta', zone: 'jabodetabek' },
  { id: 'LOCAL-JKT-17', text: 'Kembangan, Jakarta Barat, DKI Jakarta', province: 'DKI Jakarta', zone: 'jabodetabek' },
  { id: 'LOCAL-JKT-18', text: 'Tambora, Jakarta Barat, DKI Jakarta', province: 'DKI Jakarta', zone: 'jabodetabek' },
  { id: 'LOCAL-JKT-19', text: 'Kelapa Gading, Jakarta Utara, DKI Jakarta', province: 'DKI Jakarta', zone: 'jabodetabek' },
  { id: 'LOCAL-JKT-20', text: 'Tanjung Priok, Jakarta Utara, DKI Jakarta', province: 'DKI Jakarta', zone: 'jabodetabek' },
  { id: 'LOCAL-JKT-21', text: 'Pademangan, Jakarta Utara, DKI Jakarta', province: 'DKI Jakarta', zone: 'jabodetabek' },
  { id: 'LOCAL-JKT-22', text: 'Matraman, Jakarta Timur, DKI Jakarta', province: 'DKI Jakarta', zone: 'jabodetabek' },
  { id: 'LOCAL-JKT-23', text: 'Cakung, Jakarta Timur, DKI Jakarta', province: 'DKI Jakarta', zone: 'jabodetabek' },
  { id: 'LOCAL-JKT-24', text: 'Pulo Gadung, Jakarta Timur, DKI Jakarta', province: 'DKI Jakarta', zone: 'jabodetabek' },
  { id: 'LOCAL-JKT-25', text: 'Jatinegara, Jakarta Timur, DKI Jakarta', province: 'DKI Jakarta', zone: 'jabodetabek' },

  // Bodetabek (Jabar/Banten)
  { id: 'LOCAL-DPK-01', text: 'Beji, Depok, Jawa Barat', province: 'Jawa Barat', zone: 'jabodetabek' },
  { id: 'LOCAL-DPK-02', text: 'Pancoran Mas, Depok, Jawa Barat', province: 'Jawa Barat', zone: 'jabodetabek' },
  { id: 'LOCAL-DPK-03', text: 'Cimanggis, Depok, Jawa Barat', province: 'Jawa Barat', zone: 'jabodetabek' },
  { id: 'LOCAL-BGR-01', text: 'Bogor Tengah, Kota Bogor, Jawa Barat', province: 'Jawa Barat', zone: 'jabodetabek' },
  { id: 'LOCAL-BGR-02', text: 'Bogor Selatan, Kota Bogor, Jawa Barat', province: 'Jawa Barat', zone: 'jabodetabek' },
  { id: 'LOCAL-BGR-03', text: 'Cibinong, Kabupaten Bogor, Jawa Barat', province: 'Jawa Barat', zone: 'jabodetabek' },
  { id: 'LOCAL-BKS-01', text: 'Bekasi Barat, Kota Bekasi, Jawa Barat', province: 'Jawa Barat', zone: 'jabodetabek' },
  { id: 'LOCAL-BKS-02', text: 'Bekasi Timur, Kota Bekasi, Jawa Barat', province: 'Jawa Barat', zone: 'jabodetabek' },
  { id: 'LOCAL-BKS-03', text: 'Tambun, Kabupaten Bekasi, Jawa Barat', province: 'Jawa Barat', zone: 'jabodetabek' },
  { id: 'LOCAL-TNG-01', text: 'Tangerang, Kota Tangerang, Banten', province: 'Banten', zone: 'jabodetabek' },
  { id: 'LOCAL-TNG-02', text: 'Serpong, Tangerang Selatan, Banten', province: 'Banten', zone: 'jabodetabek' },
  { id: 'LOCAL-TNG-03', text: 'Ciputat, Tangerang Selatan, Banten', province: 'Banten', zone: 'jabodetabek' },
  { id: 'LOCAL-TNG-04', text: 'Pondok Aren, Tangerang Selatan, Banten', province: 'Banten', zone: 'jabodetabek' },

  // Jawa Barat (lainnya)
  { id: 'LOCAL-BDG-01', text: 'Coblong, Kota Bandung, Jawa Barat', province: 'Jawa Barat', zone: 'jawa' },
  { id: 'LOCAL-BDG-02', text: 'Sumur Bandung, Kota Bandung, Jawa Barat', province: 'Jawa Barat', zone: 'jawa' },
  { id: 'LOCAL-BDG-03', text: 'Lengkong, Kota Bandung, Jawa Barat', province: 'Jawa Barat', zone: 'jawa' },
  { id: 'LOCAL-BDG-04', text: 'Antapani, Kota Bandung, Jawa Barat', province: 'Jawa Barat', zone: 'jawa' },
  { id: 'LOCAL-BDG-05', text: 'Dago, Kota Bandung, Jawa Barat', province: 'Jawa Barat', zone: 'jawa' },
  { id: 'LOCAL-CMH-01', text: 'Cimahi Tengah, Kota Cimahi, Jawa Barat', province: 'Jawa Barat', zone: 'jawa' },
  { id: 'LOCAL-BDG-06', text: 'Soreang, Kabupaten Bandung, Jawa Barat', province: 'Jawa Barat', zone: 'jawa' },
  { id: 'LOCAL-SMD-01', text: 'Sumedang Utara, Sumedang, Jawa Barat', province: 'Jawa Barat', zone: 'jawa' },
  { id: 'LOCAL-TSK-01', text: 'Tasikmalaya, Jawa Barat', province: 'Jawa Barat', zone: 'jawa' },
  { id: 'LOCAL-CRB-01', text: 'Cirebon, Jawa Barat', province: 'Jawa Barat', zone: 'jawa' },
  { id: 'LOCAL-GRT-01', text: 'Garut Kota, Garut, Jawa Barat', province: 'Jawa Barat', zone: 'jawa' },
  { id: 'LOCAL-SKB-01', text: 'Sukabumi, Jawa Barat', province: 'Jawa Barat', zone: 'jawa' },

  // Jawa Tengah / DIY
  { id: 'LOCAL-SMG-01', text: 'Semarang Tengah, Kota Semarang, Jawa Tengah', province: 'Jawa Tengah', zone: 'jawa' },
  { id: 'LOCAL-SMG-02', text: 'Semarang Selatan, Kota Semarang, Jawa Tengah', province: 'Jawa Tengah', zone: 'jawa' },
  { id: 'LOCAL-SMG-03', text: 'Banyumanik, Kota Semarang, Jawa Tengah', province: 'Jawa Tengah', zone: 'jawa' },
  { id: 'LOCAL-SLO-01', text: 'Laweyan, Kota Surakarta (Solo), Jawa Tengah', province: 'Jawa Tengah', zone: 'jawa' },
  { id: 'LOCAL-SLO-02', text: 'Jebres, Kota Surakarta (Solo), Jawa Tengah', province: 'Jawa Tengah', zone: 'jawa' },
  { id: 'LOCAL-MGL-01', text: 'Magelang Tengah, Kota Magelang, Jawa Tengah', province: 'Jawa Tengah', zone: 'jawa' },
  { id: 'LOCAL-PKL-01', text: 'Pekalongan Barat, Kota Pekalongan, Jawa Tengah', province: 'Jawa Tengah', zone: 'jawa' },
  { id: 'LOCAL-PWT-01', text: 'Purwokerto Utara, Banyumas, Jawa Tengah', province: 'Jawa Tengah', zone: 'jawa' },
  { id: 'LOCAL-TGL-01', text: 'Tegal Barat, Kota Tegal, Jawa Tengah', province: 'Jawa Tengah', zone: 'jawa' },
  { id: 'LOCAL-KDU-01', text: 'Kudus Kota, Kudus, Jawa Tengah', province: 'Jawa Tengah', zone: 'jawa' },
  { id: 'LOCAL-YGY-01', text: 'Gondokusuman, Kota Yogyakarta, DIY', province: 'DI Yogyakarta', zone: 'jawa' },
  { id: 'LOCAL-YGY-02', text: 'Umbulharjo, Kota Yogyakarta, DIY', province: 'DI Yogyakarta', zone: 'jawa' },
  { id: 'LOCAL-YGY-03', text: 'Depok, Sleman, DIY', province: 'DI Yogyakarta', zone: 'jawa' },
  { id: 'LOCAL-YGY-04', text: 'Kasihan, Bantul, DIY', province: 'DI Yogyakarta', zone: 'jawa' },

  // Jawa Timur
  { id: 'LOCAL-SBY-01', text: 'Gubeng, Kota Surabaya, Jawa Timur', province: 'Jawa Timur', zone: 'jawa' },
  { id: 'LOCAL-SBY-02', text: 'Tegalsari, Kota Surabaya, Jawa Timur', province: 'Jawa Timur', zone: 'jawa' },
  { id: 'LOCAL-SBY-03', text: 'Sukolilo, Kota Surabaya, Jawa Timur', province: 'Jawa Timur', zone: 'jawa' },
  { id: 'LOCAL-SBY-04', text: 'Rungkut, Kota Surabaya, Jawa Timur', province: 'Jawa Timur', zone: 'jawa' },
  { id: 'LOCAL-MLG-01', text: 'Klojen, Kota Malang, Jawa Timur', province: 'Jawa Timur', zone: 'jawa' },
  { id: 'LOCAL-MLG-02', text: 'Lowokwaru, Kota Malang, Jawa Timur', province: 'Jawa Timur', zone: 'jawa' },
  { id: 'LOCAL-MLG-03', text: 'Blimbing, Kota Malang, Jawa Timur', province: 'Jawa Timur', zone: 'jawa' },
  { id: 'LOCAL-SDA-01', text: 'Sidoarjo, Sidoarjo, Jawa Timur', province: 'Jawa Timur', zone: 'jawa' },
  { id: 'LOCAL-GSK-01', text: 'Gresik, Gresik, Jawa Timur', province: 'Jawa Timur', zone: 'jawa' },
  { id: 'LOCAL-KDR-01', text: 'Mojoroto, Kota Kediri, Jawa Timur', province: 'Jawa Timur', zone: 'jawa' },
  { id: 'LOCAL-MDN-01', text: 'Madiun, Kota Madiun, Jawa Timur', province: 'Jawa Timur', zone: 'jawa' },
  { id: 'LOCAL-JBR-01', text: 'Sumbersari, Jember, Jawa Timur', province: 'Jawa Timur', zone: 'jawa' },
  { id: 'LOCAL-BWI-01', text: 'Banyuwangi, Banyuwangi, Jawa Timur', province: 'Jawa Timur', zone: 'jawa' },

  // Bali / Nusa Tenggara
  { id: 'LOCAL-DPS-01', text: 'Denpasar Barat, Kota Denpasar, Bali', province: 'Bali', zone: 'bali' },
  { id: 'LOCAL-DPS-02', text: 'Denpasar Selatan, Kota Denpasar, Bali', province: 'Bali', zone: 'bali' },
  { id: 'LOCAL-DPS-03', text: 'Kuta, Badung, Bali', province: 'Bali', zone: 'bali' },
  { id: 'LOCAL-DPS-04', text: 'Ubud, Gianyar, Bali', province: 'Bali', zone: 'bali' },
  { id: 'LOCAL-DPS-05', text: 'Singaraja, Buleleng, Bali', province: 'Bali', zone: 'bali' },
  { id: 'LOCAL-NTB-01', text: 'Mataram, Kota Mataram, NTB', province: 'NTB', zone: 'nusa' },
  { id: 'LOCAL-NTT-01', text: 'Kupang, Kota Kupang, NTT', province: 'NTT', zone: 'nusa' },

  // Sumatra
  { id: 'LOCAL-MDN-01S', text: 'Medan Baru, Kota Medan, Sumatera Utara', province: 'Sumatera Utara', zone: 'sumatera' },
  { id: 'LOCAL-MDN-02', text: 'Medan Petisah, Kota Medan, Sumatera Utara', province: 'Sumatera Utara', zone: 'sumatera' },
  { id: 'LOCAL-PKU-01', text: 'Sukajadi, Kota Pekanbaru, Riau', province: 'Riau', zone: 'sumatera' },
  { id: 'LOCAL-PDG-01', text: 'Padang Barat, Kota Padang, Sumatera Barat', province: 'Sumatera Barat', zone: 'sumatera' },
  { id: 'LOCAL-PLB-01', text: 'Ilir Barat, Kota Palembang, Sumatera Selatan', province: 'Sumatera Selatan', zone: 'sumatera' },
  { id: 'LOCAL-BDL-01', text: 'Tanjungkarang Pusat, Kota Bandar Lampung, Lampung', province: 'Lampung', zone: 'sumatera' },
  { id: 'LOCAL-BTH-01', text: 'Batam Kota, Kota Batam, Kepulauan Riau', province: 'Kepulauan Riau', zone: 'sumatera' },
  { id: 'LOCAL-ACE-01', text: 'Banda Aceh, Kota Banda Aceh, Aceh', province: 'Aceh', zone: 'sumatera' },
  { id: 'LOCAL-JMB-01', text: 'Jambi, Kota Jambi, Jambi', province: 'Jambi', zone: 'sumatera' },
  { id: 'LOCAL-BKL-01', text: 'Bengkulu, Kota Bengkulu, Bengkulu', province: 'Bengkulu', zone: 'sumatera' },

  // Kalimantan
  { id: 'LOCAL-PNK-01', text: 'Pontianak Kota, Kota Pontianak, Kalimantan Barat', province: 'Kalimantan Barat', zone: 'kalimantan' },
  { id: 'LOCAL-BJM-01', text: 'Banjarmasin Tengah, Kota Banjarmasin, Kalimantan Selatan', province: 'Kalimantan Selatan', zone: 'kalimantan' },
  { id: 'LOCAL-BPN-01', text: 'Balikpapan Kota, Kota Balikpapan, Kalimantan Timur', province: 'Kalimantan Timur', zone: 'kalimantan' },
  { id: 'LOCAL-SMD-01K', text: 'Samarinda Ulu, Kota Samarinda, Kalimantan Timur', province: 'Kalimantan Timur', zone: 'kalimantan' },
  { id: 'LOCAL-PKY-01', text: 'Palangka Raya, Kota Palangkaraya, Kalimantan Tengah', province: 'Kalimantan Tengah', zone: 'kalimantan' },

  // Sulawesi
  { id: 'LOCAL-MKS-01', text: 'Makassar, Kota Makassar, Sulawesi Selatan', province: 'Sulawesi Selatan', zone: 'sulawesi' },
  { id: 'LOCAL-MDO-01', text: 'Manado, Kota Manado, Sulawesi Utara', province: 'Sulawesi Utara', zone: 'sulawesi' },
  { id: 'LOCAL-PLU-01', text: 'Palu, Kota Palu, Sulawesi Tengah', province: 'Sulawesi Tengah', zone: 'sulawesi' },
  { id: 'LOCAL-KDI-01', text: 'Kendari, Kota Kendari, Sulawesi Tenggara', province: 'Sulawesi Tenggara', zone: 'sulawesi' },
  { id: 'LOCAL-GOR-01', text: 'Gorontalo, Kota Gorontalo, Gorontalo', province: 'Gorontalo', zone: 'sulawesi' },

  // Maluku & Papua
  { id: 'LOCAL-AMB-01', text: 'Ambon, Kota Ambon, Maluku', province: 'Maluku', zone: 'timur' },
  { id: 'LOCAL-JPR-01', text: 'Jayapura, Kota Jayapura, Papua', province: 'Papua', zone: 'timur' },
  { id: 'LOCAL-SRG-01', text: 'Sorong, Kota Sorong, Papua Barat', province: 'Papua Barat', zone: 'timur' },
  { id: 'LOCAL-MKD-01', text: 'Manokwari, Papua Barat', province: 'Papua Barat', zone: 'timur' },
  { id: 'LOCAL-TNT-01', text: 'Ternate, Kota Ternate, Maluku Utara', province: 'Maluku Utara', zone: 'timur' },
];

// Flat estimated rates per zone (origin: Jakarta/Jabodetabek, default seller)
export const FALLBACK_RATES = {
  jabodetabek: [
    { service: 'jne', service_name: 'JNE REG', estimated_days: '1-2', price: 15000 },
    { service: 'jnt', service_name: 'J&T Express EZ', estimated_days: '1-2', price: 14000 },
    { service: 'sicepat', service_name: 'SiCepat REG', estimated_days: '1-2', price: 13000 },
    { service: 'anteraja', service_name: 'AnterAja Reguler', estimated_days: '1-2', price: 12500 },
    { service: 'gosend', service_name: 'GoSend Instant (same-day)', estimated_days: '0', price: 25000 },
  ],
  jawa: [
    { service: 'jne', service_name: 'JNE REG', estimated_days: '2-3', price: 22000 },
    { service: 'jnt', service_name: 'J&T Express', estimated_days: '2-3', price: 21000 },
    { service: 'sicepat', service_name: 'SiCepat REG', estimated_days: '2-4', price: 20000 },
    { service: 'anteraja', service_name: 'AnterAja Reguler', estimated_days: '2-3', price: 19500 },
  ],
  sumatera: [
    { service: 'jne', service_name: 'JNE REG', estimated_days: '3-5', price: 36000 },
    { service: 'jnt', service_name: 'J&T Express', estimated_days: '3-5', price: 35000 },
    { service: 'sicepat', service_name: 'SiCepat REG', estimated_days: '4-6', price: 32000 },
  ],
  bali: [
    { service: 'jne', service_name: 'JNE REG', estimated_days: '3-4', price: 32000 },
    { service: 'jnt', service_name: 'J&T Express', estimated_days: '3-4', price: 31000 },
    { service: 'sicepat', service_name: 'SiCepat REG', estimated_days: '3-5', price: 29000 },
  ],
  nusa: [
    { service: 'jne', service_name: 'JNE REG', estimated_days: '4-6', price: 48000 },
    { service: 'jnt', service_name: 'J&T Express', estimated_days: '4-6', price: 46000 },
  ],
  kalimantan: [
    { service: 'jne', service_name: 'JNE REG', estimated_days: '4-6', price: 45000 },
    { service: 'jnt', service_name: 'J&T Express', estimated_days: '4-6', price: 43000 },
    { service: 'sicepat', service_name: 'SiCepat REG', estimated_days: '5-7', price: 40000 },
  ],
  sulawesi: [
    { service: 'jne', service_name: 'JNE REG', estimated_days: '4-6', price: 48000 },
    { service: 'jnt', service_name: 'J&T Express', estimated_days: '4-6', price: 46000 },
  ],
  timur: [
    { service: 'jne', service_name: 'JNE REG', estimated_days: '6-9', price: 72000 },
    { service: 'jnt', service_name: 'J&T Express', estimated_days: '6-9', price: 68000 },
  ],
};

const KEYWORDS = {
  jakarta: ['jakarta', 'jkt', 'dki'],
  bogor: ['bogor', 'cibinong', 'bgr'],
  depok: ['depok', 'dpk'],
  bekasi: ['bekasi', 'tambun', 'bks'],
  tangerang: ['tangerang', 'serpong', 'ciputat', 'tng', 'bsd'],
  bandung: ['bandung', 'cimahi', 'bdg'],
  semarang: ['semarang', 'smg'],
  solo: ['solo', 'surakarta', 'slo'],
  yogya: ['yogya', 'jogja', 'ygy', 'diy'],
  surabaya: ['surabaya', 'sby'],
  malang: ['malang', 'mlg'],
  medan: ['medan', 'mdn'],
  bali: ['bali', 'denpasar', 'dps', 'kuta', 'ubud'],
  makassar: ['makassar', 'mks'],
};

export function searchFallbackDistricts(query) {
  const q = (query || '').toLowerCase().trim();
  if (q.length < 2) return [];
  return FALLBACK_DISTRICTS.filter((d) => {
    if (d.text.toLowerCase().includes(q)) return true;
    // keyword expansion
    for (const [, keys] of Object.entries(KEYWORDS)) {
      if (keys.some((k) => q.includes(k)) && keys.some((k) => d.text.toLowerCase().includes(k))) return true;
    }
    return false;
  }).slice(0, 25).map((d) => ({ id: d.id, text: d.text, fallback: true }));
}

export function getFallbackRates(destinationId, itemValue = 0) {
  const d = FALLBACK_DISTRICTS.find((x) => x.id === destinationId);
  if (!d) return [];
  const base = FALLBACK_RATES[d.zone] || FALLBACK_RATES.jawa;
  // Slight insurance surcharge if order value > 500k
  const insurance = itemValue > 500000 ? Math.round(itemValue * 0.002) : 0;
  return base.map((r) => ({ ...r, price: r.price + insurance, fallback: true }));
}
