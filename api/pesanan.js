// POST /api/pesanan  { id, t }
// Dipakai halaman "terima kasih" di landing page untuk menampilkan status dan kode aktivasi.
// Hanya pemegang token pesanan (browser pembeli) yang mendapat jawaban.
import { MAKS_PERANGKAT, bacaBody, batasiPercobaan, kirim } from "./_lib.js";
import {
  URL_APLIKASI, ambilPesanan, bolehCek, bukaCors, idPesananSah, lunasi, samarkanEmail, tandaiBelumLunas, tandaiRefund, tokenCocok,
} from "./_toko.js";
import { cekStatus, dikembalikan, ditolak, kedaluwarsa, midtransSiap, nominalCocok, sudahLunas } from "./_midtrans.js";
import { emailSiap } from "./_email.js";
import { kodeUjiMeta } from "./_meta.js";

export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  if (!bukaCors(req, res)) return;
  if (req.method !== "POST") return kirim(res, 405, { ok: false, pesan: "Metode tidak didukung." });
  try {
    const b = bacaBody(req);
    const id = String(b.id || "");
    if (!idPesananSah(id) || !b.t) return kirim(res, 400, { ok: false, alasan: "isian", pesan: "Data pesanan tidak lengkap." });
    if (!(await batasiPercobaan(req, "pesanan", 120, 600))) {
      return kirim(res, 429, { ok: false, alasan: "terlalu_sering", pesan: "Terlalu sering. Coba lagi sebentar lagi." });
    }

    let p = await ambilPesanan(id);
    // Jawaban sama untuk "tidak ada" dan "token salah" supaya nomor pesanan tidak bisa ditebak-tebak.
    if (!p || !tokenCocok(p, b.t)) return kirim(res, 404, { ok: false, alasan: "tidak_dikenal", pesan: "Pesanan tidak ditemukan." });

    // Jaring pengaman bila webhook Midtrans terlambat atau gagal sampai: tanya langsung ke Midtrans,
    // paling sering sekali per 8 detik per pesanan.
    const perluCek = p.status !== "lunas" && p.status !== "refund";
    const perluSusulan = p.status === "lunas" && ((p.emailGalat && !p.emailTerkirim) || (p.metaGalat && !p.metaTerkirim));
    if (midtransSiap() && perluCek && (await bolehCek(id, "status", 8))) {
      const s = await cekStatus(id);
      if (s && nominalCocok(s, p.harga)) {
        let h = null;
        if (sudahLunas(s)) h = await lunasi(id, { metode: s.payment_type, idTransaksi: s.transaction_id });
        else if (dikembalikan(s)) h = await tandaiRefund(id, s.transaction_status);
        else if (kedaluwarsa(s)) h = await tandaiBelumLunas(id, "kedaluwarsa");
        else if (ditolak(s)) h = await tandaiBelumLunas(id, "gagal");
        if (h?.pesanan) p = h.pesanan;
        else if (h?.sibuk) p = (await ambilPesanan(id)) || p;
      }
    } else if (perluSusulan && (await bolehCek(id, "susulan", 60))) {
      const h = await lunasi(id); // mencoba lagi email / event yang tadi gagal
      if (h?.pesanan) p = h.pesanan;
    }

    const lunas = p.status === "lunas";
    return kirim(res, 200, {
      ok: true,
      id: p.id,
      status: p.status, // menunggu | lunas | kedaluwarsa | gagal | refund
      harga: p.harga,
      uji: Boolean(p.uji),
      email: samarkanEmail(p.email),
      // Pesanan uji hanya dicatat Pixel bila server juga mengirimnya ke tab Test Events (ada kode uji).
      lacak: !p.uji || Boolean(kodeUjiMeta()),
      ...(lunas ? { kode: p.kode, urlAplikasi: URL_APLIKASI, maks: MAKS_PERANGKAT, emailTerkirim: Boolean(p.emailTerkirim), emailAktif: emailSiap() } : {}),
      ...(p.status === "menunggu" ? { urlBayar: p.urlBayar } : {}),
    });
  } catch (e) {
    console.error("pesanan: galat", e.message);
    return kirim(res, 500, { ok: false, alasan: "server", pesan: "Server sedang bermasalah. Coba beberapa saat lagi." });
  }
}
