// Uji alur checkout otomatis dari ujung ke ujung, tanpa menyentuh layanan sungguhan.
// Jalankan: npm test
import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { KUNCI_PRODUKSI, KUNCI_SANDBOX, notifikasi, panggil, pasangEnv, pasangFetch, redisTiruan } from "./bantu.js";

pasangEnv();
const { default: checkout } = await import("../api/checkout.js");
const { default: webhook } = await import("../api/midtrans.js");
const { default: pesanan } = await import("../api/pesanan.js");
const { default: jejak } = await import("../api/jejak.js");
const { default: toko } = await import("../api/toko.js");
const { default: aktivasi } = await import("../api/aktivasi.js");
const { tandaTanganSah } = await import("../api/_midtrans.js");
const { dataPengguna, rapikanTelepon } = await import("../api/_meta.js");
const { isiEmailKode } = await import("../api/_email.js");

const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");
const pembeli = { nama: "Abdullah  Fulan", email: " Pembeli@Example.com ", wa: "0812-3456-7890", fbp: "fb.1.1700000000000.1234567890", fbc: "fb.1.1700000000000.AbCd_ef-123", url: "https://www.umrohsendiri.biz.id/" };

let redis, luar, atur;
beforeEach(() => {
  pasangEnv({ MIDTRANS_SERVER_KEY: KUNCI_PRODUKSI, KUNCI_UJI: "", META_TEST_EVENT_CODE: "" });
  redis = redisTiruan();
  ({ luar, atur } = pasangFetch(redis, {}));
});

const kodeTerdaftar = () => [...(redis.data.get("kode:semua") || [])];
const bacaPesanan = (id) => JSON.parse(redis.data.get(`pesanan:${id}`));
async function pesan(isi = pembeli) {
  const r = await panggil(checkout, { body: isi });
  assert.equal(r.statusCode, 200, JSON.stringify(r.body));
  return r.body;
}
const lunas = (id) => ({ order_id: id, transaction_status: "settlement", fraud_status: "accept", gross_amount: "125000.00", payment_type: "qris", transaction_id: "trx-1", status_code: "200" });

test("tanda tangan Midtrans: sah, salah kunci, dan nominal diubah", () => {
  const n = notifikasi("UMR-261126-ABCDEFGH", "settlement");
  assert.equal(tandaTanganSah(n), true);
  assert.equal(tandaTanganSah({ ...n, gross_amount: "1.00" }), false);
  assert.equal(tandaTanganSah(notifikasi("UMR-261126-ABCDEFGH", "settlement", { kunci: "kunci-orang-lain" })), false);
  assert.equal(tandaTanganSah({ ...n, signature_key: "bukan-hex" }), false);
});

test("checkout: membuat pesanan, transaksi Snap, dan event AddPaymentInfo", async () => {
  const d = await pesan();
  assert.match(d.id, /^UMR-\d{6}-[A-Z0-9]{8}$/);
  assert.equal(d.url, "https://app.midtrans.com/snap/v4/redirection/tok-snap");
  assert.equal(d.harga, 125000);
  assert.equal(d.idEvent, `bayar-${d.id}`);

  const snap = luar.snap[0];
  assert.match(snap.url, /^https:\/\/app\.midtrans\.com\/snap\/v1\/transactions$/);
  assert.equal(snap.headers.Authorization, "Basic " + Buffer.from(KUNCI_PRODUKSI + ":").toString("base64"));
  assert.equal(snap.headers["X-Override-Notification"], "https://app-umroh-sendiri.vercel.app/api/midtrans");
  assert.deepEqual(snap.badan.transaction_details, { order_id: d.id, gross_amount: 125000 });
  assert.equal(snap.badan.item_details[0].price, 125000);
  assert.ok(snap.badan.item_details[0].name.length <= 50);
  assert.equal(snap.badan.customer_details.email, "pembeli@example.com");
  assert.equal(snap.badan.customer_details.phone, "+6281234567890");
  assert.equal(snap.badan.callbacks.finish, `https://www.umrohsendiri.biz.id/terima-kasih/?o=${d.id}&t=${d.t}`);
  assert.match(snap.badan.expiry.start_time, /^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d \+0700$/);

  const p = bacaPesanan(d.id);
  assert.equal(p.status, "menunggu");
  assert.equal(p.nama, "Abdullah Fulan");
  assert.equal(p.email, "pembeli@example.com");
  assert.equal(p.jejak.ip, "203.0.113.7");
  assert.ok(redis.punyaTtl(`pesanan:${d.id}`), "pesanan yang belum dibayar harus terhapus sendiri");

  const ev = luar.meta[0].badan.data[0];
  assert.equal(ev.event_name, "AddPaymentInfo");
  assert.equal(ev.event_id, `bayar-${d.id}`);
  assert.equal(ev.action_source, "website");
  assert.deepEqual(ev.user_data.em, [sha256("pembeli@example.com")]);
  assert.deepEqual(ev.user_data.ph, [sha256("6281234567890")]);
  assert.equal(ev.user_data.client_ip_address, "203.0.113.7");
  assert.equal(ev.user_data.fbp, pembeli.fbp);
  assert.equal(ev.user_data.fbc, pembeli.fbc);
  assert.equal(JSON.stringify(luar.meta[0].badan).includes("pembeli@example.com"), false, "email mentah tidak boleh terkirim ke Meta");
});

test("checkout: isian salah, asal tak dikenal, dan kolom jebakan ditolak", async () => {
  assert.equal((await panggil(checkout, { body: { ...pembeli, email: "bukan-email" } })).statusCode, 400);
  assert.equal((await panggil(checkout, { body: { ...pembeli, nama: "A" } })).statusCode, 400);
  assert.equal((await panggil(checkout, { body: { ...pembeli, wa: "123" } })).statusCode, 400);
  assert.equal((await panggil(checkout, { body: { ...pembeli, situs: "http://spam" } })).statusCode, 400);
  assert.equal((await panggil(checkout, { body: pembeli, origin: "https://situs-lain.com" })).statusCode, 403);
  assert.equal((await panggil(checkout, { body: pembeli, origin: "" })).statusCode, 403);
  assert.equal(luar.snap.length, 0);
});

test("checkout: badan text/plain (tanpa preflight CORS) tetap terbaca", async () => {
  const r = await panggil(checkout, { body: JSON.stringify(pembeli) });
  assert.equal(r.statusCode, 200);
  assert.equal(r.headers["access-control-allow-origin"], "https://www.umrohsendiri.biz.id");
});

test("checkout: Midtrans menolak → 502 dan tidak ada pesanan tersimpan", async () => {
  atur.snapGagal = true;
  const r = await panggil(checkout, { body: pembeli });
  assert.equal(r.statusCode, 502);
  assert.equal([...redis.data.keys()].filter((k) => k.startsWith("pesanan:")).length, 0);
});

test("checkout: pembatas 8 percobaan per 10 menit per IP", async () => {
  for (let i = 0; i < 8; i++) await pesan();
  assert.equal((await panggil(checkout, { body: pembeli })).statusCode, 429);
});

test("sandbox: tertutup untuk umum, terbuka dengan KUNCI_UJI, event Meta ditahan", async () => {
  pasangEnv({ MIDTRANS_SERVER_KEY: KUNCI_SANDBOX, KUNCI_UJI: "rahasia-uji" });
  const tanpa = await panggil(checkout, { body: pembeli });
  assert.equal(tanpa.statusCode, 403);
  assert.equal(tanpa.body.alasan, "sandbox");
  const salah = await panggil(checkout, { body: { ...pembeli, uji: "salah" } });
  assert.equal(salah.statusCode, 403);
  assert.equal(salah.body.alasan, "kunci_uji_salah");
  pasangEnv({ MIDTRANS_SERVER_KEY: KUNCI_SANDBOX, KUNCI_UJI: "" });
  assert.equal((await panggil(checkout, { body: { ...pembeli, uji: "apa-saja" } })).body.alasan, "kunci_uji_kosong");
  pasangEnv({ MIDTRANS_SERVER_KEY: KUNCI_SANDBOX, KUNCI_UJI: "rahasia-uji" });
  const r = await panggil(checkout, { body: { ...pembeli, uji: "rahasia-uji" } });
  assert.equal(r.statusCode, 200);
  assert.equal(r.body.uji, true);
  assert.match(luar.snap[0].url, /^https:\/\/app\.sandbox\.midtrans\.com\//);
  assert.equal(luar.meta.length, 0, "tanpa META_TEST_EVENT_CODE, pesanan uji tidak mengotori data iklan");

  atur.statusMidtrans = lunas(r.body.id);
  const w = await panggil(webhook, { body: notifikasi(r.body.id, "settlement", { kunci: KUNCI_SANDBOX }), origin: "" });
  assert.equal(w.statusCode, 200);
  assert.match(luar.status[0].url, /^https:\/\/api\.sandbox\.midtrans\.com\/v2\//);
  assert.match(JSON.parse(redis.data.get("kode:" + kodeTerdaftar()[0])).catatan, /UJI SANDBOX/);
  assert.equal(luar.meta.length, 0);
});

test("sandbox + META_TEST_EVENT_CODE: event dikirim dengan kode uji", async () => {
  pasangEnv({ MIDTRANS_SERVER_KEY: KUNCI_SANDBOX, KUNCI_UJI: "rahasia-uji", META_TEST_EVENT_CODE: "TEST123" });
  await panggil(checkout, { body: { ...pembeli, uji: "rahasia-uji" } });
  assert.equal(luar.meta[0].badan.test_event_code, "TEST123");
});

test("webhook lunas: satu kode, satu email, satu Purchase — walau notifikasi datang berulang", async () => {
  const d = await pesan();
  luar.meta.length = 0;
  atur.statusMidtrans = lunas(d.id);

  const r1 = await panggil(webhook, { body: notifikasi(d.id, "settlement"), origin: "" });
  assert.equal(r1.statusCode, 200);
  assert.equal(r1.body.status, "lunas");

  const [k] = kodeTerdaftar();
  assert.match(k, /^KUS[A-Z0-9]{8}$/);
  const dataKode = JSON.parse(redis.data.get("kode:" + k));
  assert.equal(dataKode.nama, "Abdullah Fulan");
  assert.equal(dataKode.kontak, "pembeli@example.com");
  assert.equal(dataKode.pesanan, d.id);
  assert.deepEqual(dataKode.perangkat, []);

  const p = bacaPesanan(d.id);
  assert.equal(p.status, "lunas");
  assert.match(p.kode, /^KUS-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  assert.equal(p.jejak, undefined, "IP/user agent dihapus setelah event terkirim");
  assert.equal(redis.punyaTtl(`pesanan:${d.id}`), false, "pesanan lunas disimpan permanen");

  assert.equal(luar.email.length, 1);
  assert.deepEqual(luar.email[0].badan.to, ["pembeli@example.com"]);
  assert.equal(luar.email[0].headers["Idempotency-Key"], `aktivasi-${d.id}`);
  assert.ok(luar.email[0].badan.html.includes(p.kode) && luar.email[0].badan.text.includes(p.kode));
  assert.ok(luar.email[0].badan.text.includes(`https://app-umroh-sendiri.vercel.app/?kode=${p.kode}`));

  assert.equal(luar.meta.length, 1);
  const ev = luar.meta[0].badan.data[0];
  assert.equal(ev.event_name, "Purchase");
  assert.equal(ev.event_id, `beli-${d.id}`);
  assert.equal(ev.custom_data.value, 125000);
  assert.equal(ev.custom_data.currency, "IDR");
  assert.equal(ev.custom_data.order_id, d.id);
  assert.equal(ev.event_source_url, "https://www.umrohsendiri.biz.id/");
  assert.equal(ev.user_data.fbp, pembeli.fbp);
  assert.equal(ev.user_data.client_user_agent, "Mozilla/5.0 (uji)");

  // Notifikasi yang sama datang lagi (Midtrans memang bisa mengirim ulang).
  for (let i = 0; i < 3; i++) assert.equal((await panggil(webhook, { body: notifikasi(d.id, "settlement"), origin: "" })).statusCode, 200);
  assert.equal(kodeTerdaftar().length, 1);
  assert.equal(luar.email.length, 1);
  assert.equal(luar.meta.length, 1);
});

test("webhook bersamaan: tetap hanya satu kode", async () => {
  const d = await pesan();
  atur.statusMidtrans = lunas(d.id);
  const hasil = await Promise.all([1, 2, 3, 4].map(() => panggil(webhook, { body: notifikasi(d.id, "settlement"), origin: "" })));
  assert.ok(hasil.some((r) => r.statusCode === 200));
  assert.ok(hasil.every((r) => [200, 503].includes(r.statusCode)), "yang kalah berebut diminta kirim ulang");
  assert.equal(kodeTerdaftar().length, 1);
  assert.equal(luar.email.length, 1);
});

test("webhook: tanda tangan palsu ditolak dan tidak menghasilkan kode", async () => {
  const d = await pesan();
  atur.statusMidtrans = lunas(d.id);
  const palsu = { ...notifikasi(d.id, "settlement", { kunci: "kunci-penyerang" }) };
  assert.equal((await panggil(webhook, { body: palsu, origin: "" })).statusCode, 403);
  assert.equal((await panggil(webhook, { body: { order_id: d.id }, origin: "" })).statusCode, 400);
  assert.equal(kodeTerdaftar().length, 0);
});

test("webhook: notifikasi lama diputar ulang padahal Midtrans bilang belum lunas → tidak ada kode", async () => {
  const d = await pesan();
  atur.statusMidtrans = { ...lunas(d.id), transaction_status: "pending" };
  assert.equal((await panggil(webhook, { body: notifikasi(d.id, "settlement"), origin: "" })).statusCode, 200);
  assert.equal(kodeTerdaftar().length, 0);
  assert.equal(bacaPesanan(d.id).status, "menunggu");
});

test("webhook: nominal tidak sama dengan harga → tidak ada kode", async () => {
  const d = await pesan();
  atur.statusMidtrans = { ...lunas(d.id), gross_amount: "1000.00" };
  assert.equal((await panggil(webhook, { body: notifikasi(d.id, "settlement", { nominal: "1000.00" }), origin: "" })).statusCode, 200);
  assert.equal(kodeTerdaftar().length, 0);
});

test("webhook: Midtrans tak bisa dihubungi → notifikasi bertanda tangan sah tetap dipakai", async () => {
  const d = await pesan();
  atur.statusMidtrans = null;
  assert.equal((await panggil(webhook, { body: notifikasi(d.id, "settlement"), origin: "" })).statusCode, 200);
  assert.equal(kodeTerdaftar().length, 1);
});

test("webhook: kartu ditolak sistem fraud tidak dianggap lunas", async () => {
  const d = await pesan();
  atur.statusMidtrans = { ...lunas(d.id), transaction_status: "capture", fraud_status: "deny" };
  await panggil(webhook, { body: notifikasi(d.id, "capture", { fraud_status: "deny" }), origin: "" });
  assert.equal(kodeTerdaftar().length, 0);
});

test("webhook: pesanan tak dikenal dijawab 200 (notifikasi uji dari dashboard)", async () => {
  const r = await panggil(webhook, { body: notifikasi("payment_notif_test_G123_abc", "settlement"), origin: "" });
  assert.equal(r.statusCode, 200);
  assert.equal(kodeTerdaftar().length, 0);
});

test("email gagal: kode tetap ada, Midtrans diminta kirim ulang, lalu email tersusul tanpa kode ganda", async () => {
  const d = await pesan();
  atur.statusMidtrans = lunas(d.id);
  atur.emailGagal = true;
  const r1 = await panggil(webhook, { body: notifikasi(d.id, "settlement"), origin: "" });
  assert.equal(r1.statusCode, 500);
  assert.equal(kodeTerdaftar().length, 1);
  assert.equal(bacaPesanan(d.id).emailCoba, 1);

  atur.emailGagal = false;
  const r2 = await panggil(webhook, { body: notifikasi(d.id, "settlement"), origin: "" });
  assert.equal(r2.statusCode, 200);
  assert.equal(kodeTerdaftar().length, 1);
  assert.ok(bacaPesanan(d.id).emailTerkirim);
  assert.equal(luar.meta.filter((m) => m.badan.data[0].event_name === "Purchase").length, 1);
});

test("email dan Meta belum dikonfigurasi: pesanan tetap lunas dan webhook 200", async () => {
  pasangEnv({ RESEND_API_KEY: "", META_CAPI_TOKEN: "" });
  try {
    const d = await pesan();
    atur.statusMidtrans = lunas(d.id);
    assert.equal((await panggil(webhook, { body: notifikasi(d.id, "settlement"), origin: "" })).statusCode, 200);
    assert.equal(kodeTerdaftar().length, 1);
    assert.equal(luar.email.length + luar.meta.length, 0);
  } finally {
    pasangEnv();
  }
});

test("refund: kode dicabut dan tidak hidup lagi oleh notifikasi lama", async () => {
  const d = await pesan();
  atur.statusMidtrans = lunas(d.id);
  await panggil(webhook, { body: notifikasi(d.id, "settlement"), origin: "" });
  const [k] = kodeTerdaftar();

  atur.statusMidtrans = { ...lunas(d.id), transaction_status: "refund" };
  assert.equal((await panggil(webhook, { body: notifikasi(d.id, "refund"), origin: "" })).statusCode, 200);
  assert.equal(JSON.parse(redis.data.get("kode:" + k)).dicabut, true);
  assert.equal(bacaPesanan(d.id).status, "refund");

  atur.statusMidtrans = null; // notifikasi "settlement" lama diputar ulang saat Midtrans tak bisa dihubungi
  await panggil(webhook, { body: notifikasi(d.id, "settlement"), origin: "" });
  assert.equal(JSON.parse(redis.data.get("kode:" + k)).dicabut, true);
  assert.equal(kodeTerdaftar().length, 1);
});

test("kedaluwarsa: status berubah, tetapi pesanan lunas tidak pernah diturunkan", async () => {
  const a = await pesan();
  atur.statusMidtrans = { ...lunas(a.id), transaction_status: "expire" };
  await panggil(webhook, { body: notifikasi(a.id, "expire"), origin: "" });
  assert.equal(bacaPesanan(a.id).status, "kedaluwarsa");

  const b = await pesan();
  atur.statusMidtrans = lunas(b.id);
  await panggil(webhook, { body: notifikasi(b.id, "settlement"), origin: "" });
  atur.statusMidtrans = null;
  await panggil(webhook, { body: notifikasi(b.id, "expire"), origin: "" });
  assert.equal(bacaPesanan(b.id).status, "lunas");
});

test("halaman sukses: token salah ditolak; token benar melihat status dan kode", async () => {
  const d = await pesan();
  assert.equal((await panggil(pesanan, { body: { id: d.id, t: "salah" } })).statusCode, 404);
  assert.equal((await panggil(pesanan, { body: { id: "UMR-000000-AAAAAAAA", t: d.t } })).statusCode, 404);
  assert.equal((await panggil(pesanan, { body: { id: "../etc", t: d.t } })).statusCode, 400);

  atur.statusMidtrans = { ...lunas(d.id), transaction_status: "pending" };
  const tunggu = await panggil(pesanan, { body: { id: d.id, t: d.t } });
  assert.equal(tunggu.body.status, "menunggu");
  assert.equal(tunggu.body.kode, undefined);
  assert.equal(tunggu.body.urlBayar, d.url);
  assert.equal(tunggu.body.email, "p***@example.com");
});

test("halaman sukses menjadi jaring pengaman bila webhook tidak pernah sampai", async () => {
  const d = await pesan();
  atur.statusMidtrans = lunas(d.id);
  const r = await panggil(pesanan, { body: { id: d.id, t: d.t } });
  assert.equal(r.body.status, "lunas");
  assert.match(r.body.kode, /^KUS-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  assert.equal(r.body.urlAplikasi, "https://app-umroh-sendiri.vercel.app");
  assert.equal(r.body.emailTerkirim, true);
  assert.equal(kodeTerdaftar().length, 1);

  // Mengecek berkali-kali tidak menambah kode dan tidak membanjiri Midtrans.
  const sebelum = luar.status.length;
  for (let i = 0; i < 5; i++) await panggil(pesanan, { body: { id: d.id, t: d.t } });
  assert.equal(luar.status.length, sebelum);
  assert.equal(kodeTerdaftar().length, 1);
  assert.equal(luar.email.length, 1);
});

test("halaman sukses: pengecekan ke Midtrans dibatasi sekali per 8 detik per pesanan", async () => {
  const d = await pesan();
  atur.statusMidtrans = { ...lunas(d.id), transaction_status: "pending" };
  for (let i = 0; i < 6; i++) await panggil(pesanan, { body: { id: d.id, t: d.t } });
  assert.equal(luar.status.length, 1);
});

test("kode dari checkout otomatis bisa dipakai di layar aktivasi aplikasi", async () => {
  const d = await pesan();
  atur.statusMidtrans = lunas(d.id);
  await panggil(webhook, { body: notifikasi(d.id, "settlement"), origin: "" });
  const kode = bacaPesanan(d.id).kode;
  const r = await panggil(aktivasi, { body: { kode, perangkat: "perangkat-uji-0001", label: "Android" } });
  assert.equal(r.statusCode, 200);
  assert.equal(r.body.ok, true);
  assert.equal(r.body.nama, "Abdullah Fulan");
});

test("jejak: hanya event yang diizinkan, dari asal yang diizinkan, yang diteruskan ke Meta", async () => {
  const kirim = (isi, opsi = {}) => panggil(jejak, { body: JSON.stringify({ id: "pv.1700000000000.abcd1234", fbp: pembeli.fbp, url: "https://www.umrohsendiri.biz.id/", ...isi }), ...opsi });
  assert.equal((await kirim({ event: "PageView" })).statusCode, 204);
  assert.equal(luar.meta.length, 1);
  const ev = luar.meta[0].badan.data[0];
  assert.equal(ev.event_name, "PageView");
  assert.equal(ev.event_id, "pv.1700000000000.abcd1234");
  assert.equal(ev.user_data.client_ip_address, "203.0.113.7");
  assert.equal(ev.custom_data, undefined);

  await kirim({ event: "ViewContent" });
  assert.equal(luar.meta[1].badan.data[0].custom_data.value, 125000);

  await kirim({ event: "Purchase" }); // pembelian palsu dari browser
  await kirim({ event: "AddPaymentInfo" });
  await kirim({ event: "PageView", id: "x" });
  await kirim({ event: "PageView" }, { origin: "https://situs-lain.com" });
  assert.equal(luar.meta.length, 2);
});

test("toko: checkout aktif hanya di mode produksi", async () => {
  let r = await panggil(toko, { method: "GET" });
  assert.deepEqual({ checkout: r.body.checkout, sandbox: r.body.sandbox, harga: r.body.harga }, { checkout: true, sandbox: false, harga: 125000 });
  pasangEnv({ MIDTRANS_SERVER_KEY: KUNCI_SANDBOX });
  r = await panggil(toko, { method: "GET" });
  assert.deepEqual({ checkout: r.body.checkout, sandbox: r.body.sandbox }, { checkout: false, sandbox: true });
  pasangEnv({ MIDTRANS_SERVER_KEY: "" });
  r = await panggil(toko, { method: "GET" });
  assert.deepEqual({ checkout: r.body.checkout, sandbox: r.body.sandbox }, { checkout: false, sandbox: false });
  assert.equal((await panggil(checkout, { body: pembeli })).statusCode, 503);
});

test("CORS: preflight dijawab 204, asal lain tidak mendapat izin", async () => {
  const ok = await panggil(checkout, { method: "OPTIONS" });
  assert.equal(ok.statusCode, 204);
  assert.equal(ok.headers["access-control-allow-origin"], "https://www.umrohsendiri.biz.id");
  const lain = await panggil(checkout, { method: "OPTIONS", origin: "https://situs-lain.com" });
  assert.equal(lain.headers["access-control-allow-origin"], undefined);
});

test("Meta: normalisasi telepon dan hash data pribadi", () => {
  assert.equal(rapikanTelepon("0812-3456 7890"), "6281234567890");
  assert.equal(rapikanTelepon("+62 812 3456 7890"), "6281234567890");
  assert.equal(rapikanTelepon("81234567890"), "6281234567890");
  const u = dataPengguna({ email: " A@B.co ", nama: "Abdullah bin Fulan", ip: "bukan-ip", fbp: "palsu", fbc: "fb.1.123.AbC" });
  assert.deepEqual(u.em, [sha256("a@b.co")]);
  assert.deepEqual(u.fn, [sha256("abdullah")]);
  assert.deepEqual(u.ln, [sha256("binfulan")]);
  assert.equal(u.client_ip_address, undefined);
  assert.equal(u.fbp, undefined);
  assert.equal(u.fbc, "fb.1.123.AbC", "huruf besar-kecil fbc tidak boleh diubah");
});

test("email: nama pembeli di-escape agar tidak bisa menyisipkan HTML", () => {
  const { html, teks, subjek } = isiEmailKode({ nama: '<img src=x onerror="alert(1)">', kode: "KUS-AAAA-BBBB", idPesanan: "UMR-261126-ABCDEFGH", urlAplikasi: "https://app.contoh", namaToko: "Kunci Umroh Mandiri", waAdmin: "628" });
  assert.equal(html.includes("<img src=x"), false);
  assert.ok(html.includes("&lt;img"));
  assert.ok(teks.includes("https://app.contoh/?kode=KUS-AAAA-BBBB"));
  assert.match(subjek, /Kode aktivasi/);
});
