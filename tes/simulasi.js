// Simulasi lokal: menjalankan API checkout sungguhan dengan Redis, Midtrans, Meta, dan Resend TIRUAN.
// Tidak ada layanan asli yang disentuh dan tidak ada kode aktivasi asli yang dibuat.
//
// Cara pakai (dua terminal):
//   1) di repo ini          : npm run simulasi
//   2) di repo landing page : PUBLIC_API_BASE=http://localhost:8787 PUBLIC_META_PIXEL_ID=1234567890 npm run dev
// Buka http://localhost:4321, klik "Beli Sekarang", lalu "Bayar (simulasi)".
// Catatan event Meta dan email yang "terkirim": http://localhost:8787/simulasi/catatan
import http from "node:http";
import { KUNCI_PRODUKSI, buatRes, notifikasi, pasangEnv, pasangFetch, redisTiruan } from "./bantu.js";

const PORT = Number(process.env.PORT || 8787);
const LANDING = process.env.LANDING || "http://localhost:4321";

pasangEnv({ ASAL_DIIZINKAN: LANDING, URL_APLIKASI: `http://localhost:${PORT}`, URL_LANDING: LANDING });
const redis = redisTiruan();
const lunas = new Set();
const { luar } = pasangFetch(redis, {
  urlBayar: (b) => `http://localhost:${PORT}/bayar-tiruan?id=${b.transaction_details.order_id}&selesai=${encodeURIComponent(b.callbacks.finish)}`,
  statusMidtrans: (url) => {
    const id = decodeURIComponent(url.split("/v2/")[1].split("/status")[0]);
    return { order_id: id, transaction_status: lunas.has(id) ? "settlement" : "pending", fraud_status: "accept", gross_amount: "125000.00", payment_type: "qris", transaction_id: "trx-" + id, status_code: lunas.has(id) ? "200" : "201" };
  },
});

const rute = {};
for (const nama of ["toko", "checkout", "pesanan", "midtrans", "jejak", "aktivasi", "admin"]) {
  rute[`/api/${nama}`] = (await import(`../api/${nama}.js`)).default;
}

const halamanBayar = (id, selesai) => `<!doctype html><html lang="id"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Pembayaran (simulasi)</title>
<body style="font-family:system-ui;max-width:420px;margin:48px auto;padding:0 20px;text-align:center">
<p style="letter-spacing:.1em;color:#888;font-size:12px">HALAMAN PEMBAYARAN TIRUAN</p>
<h1 style="font-size:22px">Pesanan ${id}</h1><p style="font-size:28px;font-weight:700">Rp125.000</p>
<form method="post" action="/simulasi/lunas"><input type="hidden" name="id" value="${id}"><input type="hidden" name="selesai" value="${selesai}">
<button id="bayar" style="width:100%;padding:16px;border:0;border-radius:999px;background:#0b5a40;color:#fff;font-size:16px;font-weight:700">Bayar (simulasi)</button></form>
<p><a id="batal" href="${selesai}">Kembali tanpa membayar</a></p></body></html>`;

const amanHtml = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

http.createServer(async (req, res0) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const potongan = [];
  for await (const p of req) potongan.push(p);
  const mentah = Buffer.concat(potongan).toString("utf8");

  if (url.pathname === "/bayar-tiruan") {
    res0.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res0.end(halamanBayar(amanHtml(url.searchParams.get("id")), amanHtml(url.searchParams.get("selesai"))));
  }
  if (url.pathname === "/simulasi/lunas") {
    const isi = new URLSearchParams(mentah);
    const id = isi.get("id");
    lunas.add(id);
    // Midtrans mengirim webhook ke server, lalu mengembalikan pembeli ke alamat "finish".
    const w = buatRes();
    await rute["/api/midtrans"]({ method: "POST", headers: {}, body: notifikasi(id, "settlement", { kunci: KUNCI_PRODUKSI }) }, w);
    const kembali = new URL(isi.get("selesai"));
    kembali.searchParams.set("order_id", id);
    kembali.searchParams.set("status_code", "200");
    kembali.searchParams.set("transaction_status", "settlement");
    res0.writeHead(303, { Location: kembali.href });
    return res0.end();
  }
  if (url.pathname === "/simulasi/catatan") {
    res0.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
    return res0.end(JSON.stringify({ meta: luar.meta.map((m) => m.badan.data[0]), email: luar.email.map((e) => e.badan), snap: luar.snap.map((s) => s.badan) }, null, 2));
  }
  if (url.pathname === "/" ) {
    res0.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res0.end(`<!doctype html><meta charset="utf-8"><title>Aplikasi (simulasi)</title><body style="font-family:system-ui;padding:40px"><h1>Aplikasi (simulasi)</h1><p>Kode dari tautan: <b id="kode">${amanHtml(url.searchParams.get("kode") || "-")}</b></p></body>`);
  }

  const handler = rute[url.pathname];
  if (!handler) { res0.writeHead(404); return res0.end("Tidak ada"); }
  const jenis = String(req.headers["content-type"] || "");
  let body = mentah;
  if (jenis.includes("application/json")) { try { body = JSON.parse(mentah || "{}"); } catch { body = {}; } }
  const res = buatRes();
  await handler({ method: req.method, headers: { ...req.headers, "x-forwarded-for": "203.0.113.7" }, body, query: Object.fromEntries(url.searchParams) }, res);
  res0.writeHead(res.statusCode, { ...res.headers, ...(res.body !== undefined ? { "content-type": "application/json" } : {}) });
  res0.end(res.body !== undefined ? JSON.stringify(res.body) : "");
}).listen(PORT, () => console.log(`Simulasi API di http://localhost:${PORT} (landing: ${LANDING})`));
