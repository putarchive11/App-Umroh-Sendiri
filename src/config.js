// ─────────────────────────────────────────────────────────────
// Pengaturan yang paling sering diganti — ubah di sini saja.
// ─────────────────────────────────────────────────────────────

export const APP_NAME = "Kunci Umroh Sendiri";
export const APP_BRAND = "PANDUAN UMROH MANDIRI";

// Kurs default 1 SAR ke Rupiah (bisa diubah pengguna di aplikasi)
export const DEFAULT_KURS = 4770; // kurs tengah ±Rp4.766 per 3 Nov 2026

// Nomor WhatsApp admin (format internasional tanpa "+" dan tanpa 0 di depan).
export const NOMOR_WA = "6287777995846";

// Batas perangkat per kode (hanya untuk teks di layar; batas sebenarnya diatur di server: MAX_PERANGKAT).
export const MAKS_PERANGKAT = 2;

const wa = (pesan) => `https://wa.me/${NOMOR_WA}?text=${encodeURIComponent(pesan)}`;

export const LAYANAN = [
  {
    icon: "ph-van",
    title: "Transportasi Umroh Mandiri",
    desc: "Pesan transport via WhatsApp",
    href: wa("Assalamu’alaikum, saya mau pesan transportasi umroh."),
  },
  {
    icon: "ph-user-check",
    title: "Pesan Muthowif",
    desc: "Booking pendamping ibadah",
    href: wa("Assalamu’alaikum, saya mau booking muthowif."),
  },
  {
    icon: "ph-seal-check",
    title: "Pesan Visa Umroh",
    desc: "Urus visa umroh via WhatsApp",
    href: wa("Assalamu’alaikum, saya mau pesan visa umroh."),
  },
];
