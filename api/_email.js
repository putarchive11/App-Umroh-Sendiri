// Email kode aktivasi lewat Resend (https://resend.com/docs/api-reference/emails/send-email).
import { MAKS_PERANGKAT } from "./_lib.js";

const kunciResend = () => (process.env.RESEND_API_KEY || "").trim();
const pengirim = () => (process.env.EMAIL_PENGIRIM || "").trim(); // mis. "Kunci Umroh Mandiri <halo@umrohsendiri.biz.id>"

export const emailSiap = () => Boolean(kunciResend() && pengirim());

const aman = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/** Isi email (subjek, HTML, teks polos). Dipisah agar mudah diuji dan dibaca ulang. */
export function isiEmailKode({ nama, kode, idPesanan, urlAplikasi, namaToko, waAdmin, emailBantuan }) {
  const tautan = `${urlAplikasi}/?kode=${encodeURIComponent(kode)}`;
  const wa = waAdmin ? `https://wa.me/${waAdmin}` : "";
  const subjek = `Kode aktivasi Anda — ${namaToko}`;

  const teks = [
    `Assalamu’alaikum ${nama},`,
    "",
    `Jazakumullahu khairan, pembayaran Anda sudah kami terima. Berikut kode aktivasi aplikasi ${namaToko}:`,
    "",
    `    ${kode}`,
    "",
    "Cara memakainya:",
    `1. Buka ${tautan}`,
    "2. Kode terisi otomatis. Bila belum, ketik kode di atas lalu tekan Aktifkan.",
    "3. Pengguna iPhone: pasang dulu aplikasi ke Layar Utama (Bagikan > Tambah ke Layar Utama), lalu aktifkan dari ikon tersebut.",
    "",
    `Satu kode berlaku untuk ${MAKS_PERANGKAT} perangkat. Mohon tidak dibagikan kepada orang lain.`,
    `Nomor pesanan: ${idPesanan}`,
    "",
    `Butuh bantuan? Balas email ini${wa ? ` atau hubungi admin di ${wa}` : ""}.`,
    "",
    `— ${namaToko}`,
  ].join("\n");

  const html = `<!doctype html>
<html lang="id"><body style="margin:0;padding:0;background:#f3efe7;font-family:Arial,Helvetica,sans-serif;color:#1e211e;">
<div style="display:none;max-height:0;overflow:hidden;">Kode aktivasi Anda: ${aman(kode)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3efe7;padding:24px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;">
  <tr><td style="background:#0b2a22;padding:22px 28px;color:#e7cf98;font-size:16px;font-weight:bold;letter-spacing:.3px;">${aman(namaToko)}</td></tr>
  <tr><td style="padding:28px;">
    <p style="margin:0 0 14px;font-size:16px;line-height:1.6;">Assalamu’alaikum ${aman(nama)},</p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;">Jazakumullahu khairan, pembayaran Anda sudah kami terima. Berikut kode aktivasi aplikasi Anda:</p>
    <div style="margin:0 0 22px;padding:18px 12px;border:2px dashed #b99245;border-radius:12px;background:#fbfaf7;text-align:center;font-family:'Courier New',monospace;font-size:26px;font-weight:bold;letter-spacing:2px;color:#0b5a40;">${aman(kode)}</div>
    <p style="margin:0 0 24px;text-align:center;"><a href="${aman(tautan)}" style="display:inline-block;padding:14px 26px;border-radius:999px;background:#0b5a40;color:#fff8e7;font-size:15px;font-weight:bold;text-decoration:none;">Buka aplikasi &amp; aktifkan</a></p>
    <p style="margin:0 0 8px;font-size:14px;font-weight:bold;">Cara memakainya</p>
    <ol style="margin:0 0 20px;padding-left:20px;font-size:14px;line-height:1.7;color:#3c4a42;">
      <li>Tekan tombol di atas. Kode terisi otomatis, lalu tekan <b>Aktifkan</b>.</li>
      <li>Bila kode belum terisi, ketik kode di atas secara manual.</li>
      <li>Pengguna iPhone: pasang dulu aplikasi ke Layar Utama (Bagikan &rsaquo; Tambah ke Layar Utama), lalu aktifkan dari ikon tersebut.</li>
    </ol>
    <p style="margin:0 0 6px;font-size:13px;line-height:1.6;color:#6f746e;">Satu kode berlaku untuk ${MAKS_PERANGKAT} perangkat. Mohon tidak dibagikan kepada orang lain.</p>
    <p style="margin:0 0 18px;font-size:13px;line-height:1.6;color:#6f746e;">Nomor pesanan: ${aman(idPesanan)}</p>
    <p style="margin:0;font-size:13px;line-height:1.6;color:#6f746e;">Butuh bantuan? Balas email ini${wa ? ` atau <a href="${aman(wa)}" style="color:#0b5a40;">hubungi admin lewat WhatsApp</a>` : ""}.</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

  return { subjek, html, teks };
}

/**
 * Mengirim email kode aktivasi. Tidak pernah melempar galat: hasilnya { ok, lewati?, pesan? }.
 * Idempotency-Key membuat Resend tidak mengirim dua kali bila webhook pembayaran datang berulang.
 */
export async function kirimEmailKode({ kepada, nama, kode, idPesanan, urlAplikasi, namaToko, waAdmin }) {
  if (!emailSiap()) return { ok: false, lewati: true, pesan: "Email belum dikonfigurasi" };
  const balas = (process.env.EMAIL_BALASAN || "").trim();
  const tembusan = (process.env.EMAIL_ADMIN || "").trim();
  const { subjek, html, teks } = isiEmailKode({ nama, kode, idPesanan, urlAplikasi, namaToko, waAdmin });
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${kunciResend()}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `aktivasi-${idPesanan}`,
      },
      body: JSON.stringify({
        from: pengirim(),
        to: [kepada],
        subject: subjek,
        html,
        text: teks,
        ...(balas ? { reply_to: balas } : {}),
        ...(tembusan ? { bcc: [tembusan] } : {}),
      }),
      signal: AbortSignal.timeout(8000),
    });
    let d = {};
    try { d = await r.json(); } catch { /* bukan JSON */ }
    if (!r.ok) return { ok: false, status: r.status, pesan: d?.message || `HTTP ${r.status}` };
    return { ok: true, id: d.id };
  } catch (e) {
    return { ok: false, pesan: String(e.message || e) };
  }
}
