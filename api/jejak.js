// POST /api/jejak  { event, id, url?, fbp?, fbc? }
// Pasangan sisi server untuk event Pixel di landing page (PageView, ViewContent, InitiateCheckout, Contact).
// Browser mengirim event ke Pixel DAN ke sini dengan id yang sama; Meta membuang duplikatnya.
// Gunanya: event tetap sampai walaupun Pixel diblokir browser atau pemblokir iklan.
import { bacaBody, batasiPercobaan, ipKlien } from "./_lib.js";
import { HARGA, ID_PRODUK, NAMA_PRODUK, asalDiizinkan, bukaCors } from "./_toko.js";
import { dataPengguna, kirimEventMeta, metaSiap } from "./_meta.js";

const produk = { currency: "IDR", value: HARGA, content_type: "product", content_ids: [ID_PRODUK], content_name: NAMA_PRODUK };
// Hanya event ini yang diterima; Purchase dan AddPaymentInfo hanya dikirim server dari data pembayaran asli.
const EVENT = { PageView: null, ViewContent: produk, InitiateCheckout: { ...produk, num_items: 1 }, Contact: null };

export default async function handler(req, res) {
  if (!bukaCors(req, res)) return;
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).end();
  try {
    const asal = asalDiizinkan(req);
    if (!asal || !metaSiap()) return res.status(204).end();

    const b = bacaBody(req);
    const nama = String(b.event || "");
    const id = String(b.id || "");
    if (!Object.hasOwn(EVENT, nama) || !/^[\w.-]{8,80}$/.test(id)) return res.status(204).end();
    if (!(await batasiPercobaan(req, "jejak", 120, 600))) return res.status(204).end();

    const kustom = EVENT[nama];
    await kirimEventMeta({
      nama,
      id,
      url: typeof b.url === "string" && b.url.startsWith(asal) ? b.url.slice(0, 500) : asal + "/",
      pengguna: dataPengguna({ ip: ipKlien(req), ua: req.headers["user-agent"], fbp: b.fbp, fbc: b.fbc }),
      ...(kustom ? { kustom } : {}),
    });
  } catch (e) {
    console.error("jejak: galat", e.message);
  }
  return res.status(204).end();
}
