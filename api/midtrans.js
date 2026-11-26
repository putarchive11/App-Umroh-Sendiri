// POST /api/midtrans — webhook ("HTTP Notification") dari Midtrans.
// Di sinilah pembayaran dinyatakan lunas, kode aktivasi dibuat, email dikirim, dan event Purchase dikirim ke Meta.
// Dokumentasi: https://docs.midtrans.com/docs/https-notification-webhooks
import { bacaBody, kirim } from "./_lib.js";
import { ambilPesanan, idPesananSah, lunasi, tandaiBelumLunas, tandaiRefund } from "./_toko.js";
import { cekStatus, dikembalikan, ditolak, kedaluwarsa, midtransSiap, nominalCocok, sudahLunas, tandaTanganSah } from "./_midtrans.js";

export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  if (req.method !== "POST") return kirim(res, 405, { ok: false, pesan: "Metode tidak didukung." });
  try {
    // 503 membuat Midtrans mencoba lagi nanti (berguna bila kunci server belum sempat dipasang).
    if (!midtransSiap()) return kirim(res, 503, { ok: false, pesan: "MIDTRANS_SERVER_KEY belum diatur di Vercel." });

    const n = bacaBody(req);
    if (!n || !n.order_id || !n.signature_key) return kirim(res, 400, { ok: false, pesan: "Notifikasi tidak lengkap." });
    if (!tandaTanganSah(n)) return kirim(res, 403, { ok: false, pesan: "Tanda tangan tidak sah." });

    const id = String(n.order_id);
    const p = idPesananSah(id) ? await ambilPesanan(id) : null;
    // Notifikasi uji dari dashboard atau pesanan yang sudah terhapus: dijawab 200 supaya tidak dikirim berulang.
    if (!p) return kirim(res, 200, { ok: true, catatan: "Pesanan tidak dikenal, diabaikan." });

    // Notifikasi bisa datang tidak berurutan atau diputar ulang, jadi status terbaru ditanyakan langsung ke Midtrans.
    // Bila Midtrans tidak bisa dihubungi, notifikasi ini (tanda tangannya sudah sah) yang dipakai.
    const s = (await cekStatus(id)) || n;

    if (!nominalCocok(s, p.harga)) {
      console.error("midtrans: nominal tidak cocok", id, s.gross_amount, p.harga);
      return kirim(res, 200, { ok: true, catatan: "Nominal tidak cocok, diabaikan." });
    }

    let h = { ok: true };
    if (sudahLunas(s)) h = await lunasi(id, { metode: s.payment_type, idTransaksi: s.transaction_id });
    else if (dikembalikan(s)) h = await tandaiRefund(id, s.transaction_status);
    else if (kedaluwarsa(s)) h = await tandaiBelumLunas(id, "kedaluwarsa");
    else if (ditolak(s)) h = await tandaiBelumLunas(id, "gagal");
    // pending, authorize, partial_refund: tidak ada yang perlu diubah.

    // Sedang dikerjakan permintaan lain → minta Midtrans mengirim ulang nanti (pengerjaan ulang aman).
    if (h.sibuk) return kirim(res, 503, { ok: false, pesan: "Pesanan sedang diproses, kirim ulang nanti." });
    // Kode sudah dibuat tetapi email/Meta gagal sementara → 500 supaya Midtrans mencoba sekali lagi.
    if (h.ok && h.lengkap === false) return kirim(res, 500, { ok: false, pesan: "Sebagian langkah belum selesai, kirim ulang." });
    return kirim(res, 200, { ok: true, status: h.pesanan?.status || s.transaction_status });
  } catch (e) {
    console.error("midtrans: galat", e.message);
    return kirim(res, 500, { ok: false, pesan: "Server bermasalah, kirim ulang nanti." });
  }
}
