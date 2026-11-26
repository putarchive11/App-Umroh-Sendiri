// Inti checkout otomatis: pesanan, CORS, dan "pelunasan" (buat kode aktivasi → email → Meta CAPI).
import crypto from "node:crypto";
import { acakHuruf, ambilKode, daftarkanKodeBaru, rapikanKode, redis, simpanKode, tampilKode } from "./_lib.js";
import { kirimEmailKode } from "./_email.js";
import { dataPengguna, kirimEventMeta } from "./_meta.js";

// ─── Pengaturan (bisa diganti lewat Environment Variables di Vercel) ───
export const HARGA = Math.max(1000, parseInt(process.env.HARGA_PAKET || "125000", 10) || 125000);
export const NAMA_PRODUK = (process.env.NAMA_PRODUK || "Paket Ebook + Digital Toolkit Umroh Mandiri").slice(0, 50);
export const ID_PRODUK = "paket-ebook-toolkit";
export const NAMA_TOKO = process.env.NAMA_TOKO || "Kunci Umroh Mandiri";
export const WA_ADMIN = (process.env.WA_ADMIN || "6287777995846").replace(/\D/g, "");
const tanpaGarisAkhir = (s) => String(s || "").trim().replace(/\/+$/, "");
export const URL_APLIKASI = tanpaGarisAkhir(process.env.URL_APLIKASI || "https://app-umroh-sendiri.vercel.app");
export const URL_LANDING = tanpaGarisAkhir(process.env.URL_LANDING || "https://www.umrohsendiri.biz.id");

// ─── CORS: hanya landing page sendiri yang boleh memanggil API ini dari browser ───
const ASAL_BAWAAN = ["https://umrohsendiri.biz.id", "https://www.umrohsendiri.biz.id", "https://umroh-sendiri.vercel.app"];

/** Mengembalikan origin pemanggil bila diizinkan, selain itu "". */
export function asalDiizinkan(req) {
  const asal = tanpaGarisAkhir(req.headers.origin);
  if (!asal) return "";
  const tambahan = (process.env.ASAL_DIIZINKAN || "").split(",").map(tanpaGarisAkhir).filter(Boolean);
  if ([...ASAL_BAWAAN, URL_LANDING, ...tambahan].includes(asal)) return asal;
  try { if (new URL(asal).host === req.headers.host) return asal; } catch { /* origin tidak sah */ }
  return "";
}

/** Memasang header CORS. Mengembalikan false bila permintaan sudah dijawab (preflight OPTIONS). */
export function bukaCors(req, res, metode = "POST, OPTIONS") {
  const asal = asalDiizinkan(req);
  res.setHeader("Vary", "Origin");
  if (asal) {
    res.setHeader("Access-Control-Allow-Origin", asal);
    res.setHeader("Access-Control-Allow-Methods", metode);
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Max-Age", "86400");
  }
  if (req.method === "OPTIONS") { res.status(204).end(); return false; }
  return true;
}

// ─── Pesanan ───
const kunciPesanan = (id) => `pesanan:${id}`;
const TTL_BELUM_LUNAS = 3 * 24 * 3600; // pesanan yang tidak dibayar terhapus sendiri setelah 3 hari
export const DAFTAR_LUNAS = "pesanan:lunas";

/** "UMR-261126-7HQ29XM4" — aman untuk order_id Midtrans (maks. 50 karakter, huruf/angka/tanda hubung). */
export function idPesananBaru(d = new Date()) {
  return `UMR-${d.toISOString().slice(2, 10).replace(/-/g, "")}-${acakHuruf(8)}`;
}
export const idPesananSah = (id) => typeof id === "string" && /^UMR-\d{6}-[A-Z0-9]{8}$/.test(id);

/** Token rahasia per pesanan: hanya pemegangnya (browser pembeli) yang bisa melihat kode di halaman sukses. */
export const tokenBaru = () => crypto.randomBytes(20).toString("hex");
export function tokenCocok(p, t) {
  const a = Buffer.from(String(p?.token || ""));
  const b = Buffer.from(String(t || ""));
  return a.length > 0 && a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function ambilPesanan(id) {
  const v = await redis("GET", kunciPesanan(id));
  return v ? JSON.parse(v) : null;
}

export async function simpanPesanan(p) {
  const tetap = p.status === "lunas" || p.status === "refund";
  if (tetap) await redis("SET", kunciPesanan(p.id), JSON.stringify(p));
  else await redis("SET", kunciPesanan(p.id), JSON.stringify(p), "EX", TTL_BELUM_LUNAS);
}

/** "toni@gmail.com" → "t***@gmail.com" untuk ditampilkan di halaman sukses. */
export function samarkanEmail(e) {
  const [nama, domain] = String(e || "").split("@");
  return nama && domain ? `${nama[0]}***@${domain}` : "";
}

// ─── Pelunasan ───
const MAKS_COBA = 5;

/**
 * Setiap perubahan pesanan setelah dibuat harus lewat gembok ini, supaya webhook Midtrans dan
 * pengecekan dari halaman sukses yang datang bersamaan tidak saling menimpa data.
 */
async function denganGembok(id, kerja) {
  const gembok = `gembok:pesanan:${id}`;
  if ((await redis("SET", gembok, "1", "NX", "EX", 45)) !== "OK") return { ok: false, sibuk: true };
  try {
    return await kerja();
  } finally {
    try { await redis("DEL", gembok); } catch { /* gembok kedaluwarsa sendiri */ }
  }
}

/**
 * Dipanggil setiap kali Midtrans menyatakan pesanan lunas (webhook) atau saat halaman sukses mengecek.
 * Aman dipanggil berulang: kode aktivasi dibuat tepat satu kali, email dan event Purchase dikirim tepat satu kali.
 * Hasil: { ok, pesanan, lengkap } | { ok:false, sibuk:true } | { ok:false, alasan }.
 */
export function lunasi(id, info = {}) {
  return denganGembok(id, async () => {
    const p = await ambilPesanan(id);
    if (!p) return { ok: false, alasan: "tidak_ada" };
    if (p.status === "refund") return { ok: false, alasan: "refund", pesanan: p };
    const sekarang = new Date().toISOString();

    // 1) Kode aktivasi — langkah terpenting, langsung disimpan sebelum mengerjakan yang lain.
    if (!p.kode) {
      const k = await daftarkanKodeBaru({
        nama: p.nama,
        kontak: p.email,
        catatan: `Otomatis · ${p.id}${info.metode ? " · " + info.metode : ""}${p.uji ? " · UJI SANDBOX" : ""}`,
        dibuat: sekarang,
        perangkat: [],
        dicabut: false,
        pesanan: p.id,
      });
      if (!k) throw new Error("GAGAL_MEMBUAT_KODE");
      p.kode = tampilKode(k);
      p.status = "lunas";
      p.lunasPada = sekarang;
      if (info.metode) p.metode = info.metode;
      if (info.idTransaksi) p.idTransaksi = info.idTransaksi;
      await simpanPesanan(p);
      await redis("ZADD", DAFTAR_LUNAS, Date.now(), p.id);
    }

    // 2) Email dan 3) Meta CAPI dijalankan bersamaan; kegagalan salah satunya tidak membatalkan kode.
    const tugas = [];
    if (!p.emailTerkirim && (p.emailCoba || 0) < MAKS_COBA) {
      tugas.push(
        kirimEmailKode({ kepada: p.email, nama: p.nama, kode: p.kode, idPesanan: p.id, urlAplikasi: URL_APLIKASI, namaToko: NAMA_TOKO, waAdmin: WA_ADMIN }).then((h) => {
          if (h.ok) { p.emailTerkirim = sekarang; delete p.emailGalat; }
          else if (!h.lewati) { p.emailCoba = (p.emailCoba || 0) + 1; p.emailGalat = String(h.pesan || "").slice(0, 200); }
        })
      );
    }
    if (!p.metaTerkirim && (p.metaCoba || 0) < MAKS_COBA) {
      const j = p.jejak || {};
      tugas.push(
        kirimEventMeta({
          nama: "Purchase",
          id: `beli-${p.id}`,
          waktu: p.lunasPada,
          url: j.url,
          uji: Boolean(p.uji),
          pengguna: dataPengguna({ email: p.email, wa: p.wa, nama: p.nama, ip: j.ip, ua: j.ua, fbp: j.fbp, fbc: j.fbc, idLuar: p.email }),
          kustom: { currency: "IDR", value: p.harga, content_type: "product", content_ids: [ID_PRODUK], content_name: NAMA_PRODUK, num_items: 1, order_id: p.id },
        }).then((h) => {
          // Jejak (IP, user agent, cookie Meta) dihapus begitu tidak diperlukan lagi.
          // (juga bila Meta belum dikonfigurasi atau pesanan uji: tidak ada yang akan dikirim.)
          if (h.ok && !h.lewati) { p.metaTerkirim = sekarang; delete p.metaGalat; delete p.jejak; }
          else if (h.lewati) delete p.jejak;
          else { p.metaCoba = (p.metaCoba || 0) + 1; p.metaGalat = String(h.pesan || "").slice(0, 200); }
        })
      );
    }
    if (tugas.length) {
      await Promise.all(tugas);
      if ((p.metaCoba || 0) >= MAKS_COBA) delete p.jejak;
      await simpanPesanan(p);
    }

    // "lengkap" = tidak ada lagi yang perlu dicoba ulang (terkirim, belum dikonfigurasi, atau jatah coba habis).
    const beres = (terkirim, galat, coba) => Boolean(terkirim) || !galat || (coba || 0) >= MAKS_COBA;
    return { ok: true, pesanan: p, lengkap: beres(p.emailTerkirim, p.emailGalat, p.emailCoba) && beres(p.metaTerkirim, p.metaGalat, p.metaCoba) };
  });
}

/** Menandai pesanan yang belum lunas sebagai "kedaluwarsa" atau "gagal". Pesanan lunas tidak pernah diturunkan. */
export function tandaiBelumLunas(id, status) {
  return denganGembok(id, async () => {
    const p = await ambilPesanan(id);
    if (!p) return { ok: false, alasan: "tidak_ada" };
    if (!p.kode && p.status !== "refund" && p.status !== status) {
      p.status = status;
      await simpanPesanan(p);
    }
    return { ok: true, pesanan: p };
  });
}

/** Refund penuh atau chargeback: kode dicabut supaya aplikasi terkunci saat perangkat online. */
export function tandaiRefund(id, alasan = "refund") {
  return denganGembok(id, async () => {
    const p = await ambilPesanan(id);
    if (!p) return { ok: false, alasan: "tidak_ada" };
    if (p.kode) {
      const k = rapikanKode(p.kode);
      const data = await ambilKode(k);
      if (data && !data.dicabut) {
        data.dicabut = true;
        data.catatan = `${data.catatan || ""} · DICABUT (${alasan})`.trim();
        await simpanKode(k, data);
      }
    }
    if (p.status !== "refund") {
      p.status = "refund";
      p.refundPada = new Date().toISOString();
      delete p.jejak;
      await simpanPesanan(p);
    }
    return { ok: true, pesanan: p };
  });
}

/** Pembatas sederhana: true bila aksi `nama` untuk pesanan ini belum dilakukan dalam `detik` terakhir. */
export async function bolehCek(id, nama, detik) {
  return (await redis("SET", `jeda:${nama}:${id}`, "1", "NX", "EX", detik)) === "OK";
}
