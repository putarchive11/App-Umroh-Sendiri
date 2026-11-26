// Midtrans Snap (halaman pembayaran yang di-host Midtrans): QRIS, e-wallet, transfer bank, dll.
// Dokumentasi: https://docs.midtrans.com/docs/snap-snap-integration-guide
import crypto from "node:crypto";

const kunciServer = () => (process.env.MIDTRANS_SERVER_KEY || "").trim();

export const midtransSiap = () => Boolean(kunciServer());

/**
 * "sandbox" atau "produksi". Kunci sandbox Midtrans berawalan "SB-".
 * Bisa dipaksa lewat env MIDTRANS_MODE bila suatu saat format kunci berubah.
 */
export function modeMidtrans() {
  const paksa = (process.env.MIDTRANS_MODE || "").trim().toLowerCase();
  if (paksa === "sandbox" || paksa === "produksi") return paksa;
  return kunciServer().startsWith("SB-") ? "sandbox" : "produksi";
}

const dasarSnap = () => (modeMidtrans() === "produksi" ? "https://app.midtrans.com" : "https://app.sandbox.midtrans.com");
const dasarApi = () => (modeMidtrans() === "produksi" ? "https://api.midtrans.com" : "https://api.sandbox.midtrans.com");
const otorisasi = () => "Basic " + Buffer.from(kunciServer() + ":").toString("base64");

/** "2026-11-26 11:15:00 +0700" — format waktu yang diminta Midtrans (WIB). */
export function waktuWib(d = new Date()) {
  const w = new Date(d.getTime() + 7 * 3600 * 1000).toISOString();
  return `${w.slice(0, 10)} ${w.slice(11, 19)} +0700`;
}

/**
 * Membuat transaksi Snap. Hasil: { token, redirect_url }.
 * urlNotifikasi dikirim lewat X-Override-Notification supaya webhook pasti menuju aplikasi ini
 * walaupun kolom "Payment Notification URL" di dashboard Midtrans belum diisi.
 */
export async function buatTransaksi({ id, harga, namaProduk, idProduk, nama, email, wa, urlSelesai, urlNotifikasi, jamKedaluwarsa = 24 }) {
  const isi = {
    transaction_details: { order_id: id, gross_amount: harga },
    item_details: [{ id: idProduk, price: harga, quantity: 1, name: String(namaProduk).slice(0, 50) }],
    customer_details: { first_name: String(nama).slice(0, 255), email, ...(wa ? { phone: wa } : {}) },
    callbacks: { finish: urlSelesai },
    expiry: { start_time: waktuWib(), unit: "hour", duration: jamKedaluwarsa },
  };
  const metode = (process.env.MIDTRANS_METODE || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (metode.length) isi.enabled_payments = metode;

  const r = await fetch(`${dasarSnap()}/snap/v1/transactions`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: otorisasi(),
      ...(urlNotifikasi ? { "X-Override-Notification": urlNotifikasi } : {}),
    },
    body: JSON.stringify(isi),
    signal: AbortSignal.timeout(12000),
  });
  let data = {};
  try { data = await r.json(); } catch { /* bukan JSON */ }
  if (r.status !== 201 || !data.redirect_url) {
    const pesan = Array.isArray(data.error_messages) ? data.error_messages.join("; ") : `HTTP ${r.status}`;
    throw new Error("MIDTRANS: " + pesan);
  }
  return data;
}

/** Status terbaru sebuah pesanan langsung dari Midtrans (sumber kebenaran). null bila tidak bisa dihubungi. */
export async function cekStatus(id) {
  try {
    const r = await fetch(`${dasarApi()}/v2/${encodeURIComponent(id)}/status`, {
      headers: { Accept: "application/json", Authorization: otorisasi() },
      signal: AbortSignal.timeout(8000),
    });
    const data = await r.json();
    return data && data.transaction_status ? data : null;
  } catch {
    return null;
  }
}

/** Tanda tangan notifikasi: SHA512(order_id + status_code + gross_amount + ServerKey). */
export function tandaTanganSah(n) {
  const kunci = kunciServer();
  if (!kunci || !n) return false;
  const harap = crypto
    .createHash("sha512")
    .update(String(n.order_id ?? "") + String(n.status_code ?? "") + String(n.gross_amount ?? "") + kunci)
    .digest();
  const diberi = String(n.signature_key || "");
  if (!/^[0-9a-f]{128}$/i.test(diberi)) return false;
  return crypto.timingSafeEqual(harap, Buffer.from(diberi, "hex"));
}

/** Dana benar-benar diterima: settlement (semua metode) atau capture (kartu) yang tidak ditolak sistem fraud. */
export function sudahLunas(s) {
  const t = s?.transaction_status;
  return (t === "settlement" || t === "capture") && (!s.fraud_status || s.fraud_status === "accept");
}

export const dikembalikan = (s) => ["refund", "chargeback"].includes(s?.transaction_status);
export const kedaluwarsa = (s) => s?.transaction_status === "expire";
export const ditolak = (s) => ["deny", "cancel", "failure"].includes(s?.transaction_status);

/** Nominal dari Midtrans ("125000.00") sama dengan harga pesanan. */
export const nominalCocok = (s, harga) => Math.round(parseFloat(s?.gross_amount)) === Number(harga);
