// POST /api/admin  (header x-admin-key = ADMIN_PASSWORD)
// aksi: masuk | daftar | buat | cabut | pulihkan | reset
import crypto from "node:crypto";
import {
  DAFTAR_KODE, MAKS_PERANGKAT, ambilKode, batasiPercobaan, bacaBody, kirim, kodeBaru, kunciKode,
  rapikanKode, redis, simpanKode, tampilKode,
} from "./_lib.js";

function sandiBenar(dikirim) {
  const asli = process.env.ADMIN_PASSWORD || "";
  if (!asli) return false;
  const a = crypto.createHash("sha256").update(String(dikirim || "")).digest();
  const b = crypto.createHash("sha256").update(asli).digest();
  return crypto.timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return kirim(res, 405, { ok: false, pesan: "Metode tidak didukung." });
  try {
    if (!process.env.ADMIN_PASSWORD) return kirim(res, 500, { ok: false, pesan: "ADMIN_PASSWORD belum diatur di Vercel." });
    if (!sandiBenar(req.headers["x-admin-key"])) {
      const boleh = await batasiPercobaan(req, "admin", 10, 900);
      return kirim(res, boleh ? 401 : 429, { ok: false, pesan: boleh ? "Kata sandi salah." : "Terlalu banyak percobaan. Tunggu 15 menit." });
    }

    const b = bacaBody(req);
    const aksi = b.aksi;

    if (aksi === "masuk") return kirim(res, 200, { ok: true, maks: MAKS_PERANGKAT });

    if (aksi === "daftar") {
      const semua = (await redis("SMEMBERS", DAFTAR_KODE)) || [];
      if (!semua.length) return kirim(res, 200, { ok: true, maks: MAKS_PERANGKAT, kode: [] });
      const isi = await redis("MGET", ...semua.map(kunciKode));
      const kode = semua
        .map((k, i) => (isi[i] ? { kode: tampilKode(k), ...JSON.parse(isi[i]) } : null))
        .filter(Boolean)
        .sort((x, y) => String(y.dibuat).localeCompare(String(x.dibuat)));
      return kirim(res, 200, { ok: true, maks: MAKS_PERANGKAT, kode });
    }

    if (aksi === "buat") {
      const nama = String(b.nama || "").trim().slice(0, 80);
      if (!nama) return kirim(res, 400, { ok: false, pesan: "Nama pembeli wajib diisi." });
      const data = {
        nama,
        kontak: String(b.kontak || "").trim().slice(0, 80),
        catatan: String(b.catatan || "").trim().slice(0, 200),
        dibuat: new Date().toISOString(),
        perangkat: [],
        dicabut: false,
      };
      for (let i = 0; i < 5; i++) {
        const k = kodeBaru();
        const jadi = await redis("SET", kunciKode(k), JSON.stringify(data), "NX");
        if (jadi === "OK") {
          await redis("SADD", DAFTAR_KODE, k);
          return kirim(res, 200, { ok: true, kode: tampilKode(k), data });
        }
      }
      return kirim(res, 500, { ok: false, pesan: "Gagal membuat kode, coba lagi." });
    }

    if (["cabut", "pulihkan", "reset"].includes(aksi)) {
      const k = rapikanKode(b.kode);
      const data = await ambilKode(k);
      if (!data) return kirim(res, 404, { ok: false, pesan: "Kode tidak ditemukan." });
      if (aksi === "cabut") data.dicabut = true;
      if (aksi === "pulihkan") data.dicabut = false;
      if (aksi === "reset") data.perangkat = [];
      await simpanKode(k, data);
      return kirim(res, 200, { ok: true, kode: tampilKode(k), data });
    }

    return kirim(res, 400, { ok: false, pesan: "Aksi tidak dikenal." });
  } catch (e) {
    const belum = String(e.message).includes("DATABASE_BELUM_DIPASANG");
    return kirim(res, 500, { ok: false, pesan: belum ? "Database Upstash belum dipasang di Vercel." : "Server bermasalah: " + e.message });
  }
}
