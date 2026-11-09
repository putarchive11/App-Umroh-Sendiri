// POST /api/aktivasi  { kode, perangkat, label, cek? }
// Mengecek kode lisensi di server. Daftar kode tidak pernah dikirim ke browser.
import { MAKS_PERANGKAT, ambilKode, batasiPercobaan, bacaBody, kirim, rapikanKode, simpanKode, tampilKode } from "./_lib.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return kirim(res, 405, { ok: false, pesan: "Metode tidak didukung." });
  try {
    const b = bacaBody(req);
    const kode = rapikanKode(b.kode);
    const perangkat = String(b.perangkat || "").replace(/[^a-zA-Z0-9-]/g, "").slice(0, 64);
    const label = String(b.label || "Perangkat").slice(0, 60);
    const cek = b.cek === true;

    if (!kode || perangkat.length < 8) return kirim(res, 400, { ok: false, alasan: "isian", pesan: "Masukkan kode aktivasi dengan benar." });
    if (!cek && !(await batasiPercobaan(req, "aktivasi", 15, 600))) {
      return kirim(res, 429, { ok: false, alasan: "terlalu_sering", pesan: "Terlalu banyak percobaan. Coba lagi 10 menit lagi." });
    }

    const data = await ambilKode(kode);
    if (!data) return kirim(res, 404, { ok: false, alasan: "tidak_dikenal", pesan: "Kode tidak ditemukan. Periksa kembali hurufnya, atau hubungi admin." });
    if (data.dicabut) return kirim(res, 403, { ok: false, alasan: "dicabut", pesan: "Kode ini sudah tidak aktif. Silakan hubungi admin." });

    const daftar = data.perangkat || [];
    const ada = daftar.find((p) => p.id === perangkat);
    const sekarang = new Date().toISOString();

    if (cek) {
      if (!ada) return kirim(res, 403, { ok: false, alasan: "perangkat_dilepas", pesan: "Perangkat ini sudah dilepas dari kode. Silakan aktifkan ulang." });
      return kirim(res, 200, { ok: true, nama: data.nama || "", kode: tampilKode(kode) });
    }

    if (!ada) {
      if (daftar.length >= MAKS_PERANGKAT) {
        return kirim(res, 409, {
          ok: false,
          alasan: "penuh",
          pesan: `Kode ini sudah dipakai di ${daftar.length} perangkat (batas ${MAKS_PERANGKAT}). Hubungi admin bila Anda ganti HP.`,
        });
      }
      daftar.push({ id: perangkat, label, waktu: sekarang });
      data.perangkat = daftar;
      data.terakhir = sekarang;
      await simpanKode(kode, data);
    }
    return kirim(res, 200, { ok: true, nama: data.nama || "", kode: tampilKode(kode), maks: MAKS_PERANGKAT });
  } catch (e) {
    const belum = String(e.message).includes("DATABASE_BELUM_DIPASANG");
    return kirim(res, 500, { ok: false, alasan: "server", pesan: belum ? "Database aktivasi belum dipasang di Vercel." : "Server sedang bermasalah. Coba beberapa saat lagi." });
  }
}
