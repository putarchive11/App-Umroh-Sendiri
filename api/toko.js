// GET /api/toko — keadaan toko untuk landing page (tanpa data rahasia).
// Landing page memakai ini untuk memutuskan: tampilkan checkout otomatis, atau tetap QRIS manual.
import { HARGA, NAMA_PRODUK, bukaCors } from "./_toko.js";
import { midtransSiap, modeMidtrans } from "./_midtrans.js";

export default function handler(req, res) {
  if (!bukaCors(req, res, "GET, OPTIONS")) return;
  if (req.method !== "GET") return res.status(405).json({ ok: false, pesan: "Metode tidak didukung." });
  const siap = midtransSiap() && Boolean(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL);
  const sandbox = siap && modeMidtrans() === "sandbox";
  // Jawaban boleh disimpan sebentar oleh CDN Vercel supaya tidak memanggil fungsi di setiap kunjungan.
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=60, stale-while-revalidate=300");
  res.status(200).json({
    ok: true,
    // Mode sandbox tidak dibuka untuk umum: pembayarannya pura-pura, tetapi kode aktivasinya asli.
    checkout: siap && !sandbox,
    sandbox,
    harga: HARGA,
    produk: NAMA_PRODUK,
  });
}
