// POST /api/checkout  { nama, email, wa?, fbp?, fbc?, url?, uji? }
// Membuat pesanan + transaksi Midtrans, lalu mengembalikan alamat halaman pembayaran.
import crypto from "node:crypto";
import { bacaBody, batasiPercobaan, ipKlien, kirim } from "./_lib.js";
import {
  HARGA, ID_PRODUK, NAMA_PRODUK, asalDiizinkan, bukaCors, idPesananBaru, simpanPesanan, tokenBaru,
} from "./_toko.js";
import { buatTransaksi, midtransSiap, modeMidtrans } from "./_midtrans.js";
import { dataPengguna, kirimEventMeta, kodeUjiMeta, rapikanEmail, rapikanTelepon } from "./_meta.js";

export const config = { maxDuration: 30 };

const POLA_EMAIL = /^[^\s@<>()",;:\\]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i;

function kunciUjiCocok(diberi) {
  const asli = (process.env.KUNCI_UJI || "").trim();
  if (!asli) return false;
  const a = crypto.createHash("sha256").update(String(diberi || "")).digest();
  const b = crypto.createHash("sha256").update(asli).digest();
  return crypto.timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  if (!bukaCors(req, res)) return;
  if (req.method !== "POST") return kirim(res, 405, { ok: false, pesan: "Metode tidak didukung." });
  try {
    const asal = asalDiizinkan(req);
    if (!asal) return kirim(res, 403, { ok: false, alasan: "asal", pesan: "Permintaan tidak dikenali." });
    if (!midtransSiap()) return kirim(res, 503, { ok: false, alasan: "belum_siap", pesan: "Pembayaran otomatis belum aktif." });

    const b = bacaBody(req);
    // Kolom jebakan: manusia tidak melihatnya, bot biasanya mengisinya.
    if (String(b.situs || "").trim()) return kirim(res, 400, { ok: false, alasan: "isian", pesan: "Permintaan tidak dapat diproses." });

    const nama = String(b.nama || "").replace(/\s+/g, " ").trim().slice(0, 80);
    const email = rapikanEmail(b.email).slice(0, 120);
    const wa = rapikanTelepon(b.wa);
    if (nama.length < 2) return kirim(res, 400, { ok: false, alasan: "nama", pesan: "Mohon isi nama Anda." });
    if (!POLA_EMAIL.test(email)) return kirim(res, 400, { ok: false, alasan: "email", pesan: "Alamat email belum benar. Kode aktivasi dikirim ke email ini." });
    if (wa && (wa.length < 10 || wa.length > 15)) return kirim(res, 400, { ok: false, alasan: "wa", pesan: "Nomor WhatsApp belum benar." });

    // Sandbox: pembayaran pura-pura tetapi kode asli, jadi hanya pemilik (pemegang KUNCI_UJI) yang boleh.
    const uji = modeMidtrans() === "sandbox";
    if (uji && !kunciUjiCocok(b.uji)) {
      return kirim(res, 403, { ok: false, alasan: "sandbox", pesan: "Pembayaran otomatis belum aktif." });
    }

    if (!(await batasiPercobaan(req, "checkout", 8, 600))) {
      return kirim(res, 429, { ok: false, alasan: "terlalu_sering", pesan: "Terlalu banyak percobaan. Coba lagi beberapa menit lagi." });
    }

    const id = idPesananBaru();
    const token = tokenBaru();
    const host = String(req.headers["x-forwarded-host"] || req.headers.host || "");
    const urlNotifikasi = (process.env.URL_WEBHOOK || "").trim() || (host ? `https://${host}/api/midtrans` : "");
    const jejak = {
      ip: ipKlien(req),
      ua: String(req.headers["user-agent"] || "").slice(0, 500),
      fbp: typeof b.fbp === "string" ? b.fbp.slice(0, 200) : "",
      fbc: typeof b.fbc === "string" ? b.fbc.slice(0, 500) : "",
      url: typeof b.url === "string" && b.url.startsWith(asal) ? b.url.slice(0, 500) : asal + "/",
    };

    let trx;
    try {
      trx = await buatTransaksi({
        id, harga: HARGA, namaProduk: NAMA_PRODUK, idProduk: ID_PRODUK, nama, email, wa: wa ? "+" + wa : "",
        urlSelesai: `${asal}/terima-kasih/?o=${id}&t=${token}`,
        urlNotifikasi,
      });
    } catch (e) {
      console.error("checkout: gagal membuat transaksi", e.message);
      return kirim(res, 502, { ok: false, alasan: "gateway", pesan: "Halaman pembayaran belum bisa dibuka. Coba lagi sebentar lagi." });
    }

    await simpanPesanan({
      id, token, status: "menunggu", nama, email, wa, harga: HARGA, uji,
      dibuat: new Date().toISOString(), asal, urlBayar: trx.redirect_url, jejak,
    });

    // Event sisi server; browser mengirim event yang sama (eventID sama) lewat Pixel, Meta membuang duplikatnya.
    const idEvent = `bayar-${id}`;
    await kirimEventMeta({
      nama: "AddPaymentInfo", id: idEvent, url: jejak.url, uji,
      pengguna: dataPengguna({ email, wa, nama, ...jejak, idLuar: email }),
      kustom: { currency: "IDR", value: HARGA, content_type: "product", content_ids: [ID_PRODUK], content_name: NAMA_PRODUK },
    });

    return kirim(res, 200, { ok: true, id, t: token, url: trx.redirect_url, harga: HARGA, idEvent, uji, lacak: !uji || Boolean(kodeUjiMeta()) });
  } catch (e) {
    console.error("checkout: galat", e.message);
    const belum = String(e.message).includes("DATABASE_BELUM_DIPASANG");
    return kirim(res, 500, { ok: false, alasan: "server", pesan: belum ? "Database belum dipasang di Vercel." : "Server sedang bermasalah. Coba beberapa saat lagi." });
  }
}
