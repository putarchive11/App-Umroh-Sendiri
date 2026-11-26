// Meta Conversions API (CAPI): event dikirim dari server, berpasangan dengan Meta Pixel di browser.
// Event yang sama dikirim dari dua sisi dengan event_id yang sama, lalu Meta membuang duplikatnya.
// Dokumentasi: https://developers.facebook.com/docs/marketing-api/conversions-api
import crypto from "node:crypto";
import net from "node:net";

const idPixel = () => (process.env.META_PIXEL_ID || "").trim();
const tokenCapi = () => (process.env.META_CAPI_TOKEN || "").trim();
const versiApi = () => (process.env.META_API_VERSION || "v25.0").trim();

export const metaSiap = () => Boolean(idPixel() && tokenCapi());
export const kodeUjiMeta = () => (process.env.META_TEST_EVENT_CODE || "").trim();

const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");

export const rapikanEmail = (e) => String(e || "").trim().toLowerCase();

/** "0812-3456 789" → "628123456789" (angka saja, dengan kode negara, sesuai aturan Meta). */
export function rapikanTelepon(t) {
  let n = String(t || "").replace(/\D/g, "");
  if (!n) return "";
  if (n.startsWith("0")) n = "62" + n.slice(1);
  else if (n.startsWith("8")) n = "62" + n;
  return n;
}

// _fbp / _fbc dari cookie browser: "fb.1.<waktu>.<nilai>". Tidak boleh di-hash maupun diubah hurufnya.
const cookieMetaSah = (v) => typeof v === "string" && v.length <= 500 && /^fb\.\d\.\d+\.[\w.-]+$/.test(v);

/** Menyusun user_data. Data pribadi (email, telepon, nama) di-hash SHA-256; IP, user agent, fbp, fbc tidak. */
export function dataPengguna({ email, wa, nama, ip, ua, fbp, fbc, idLuar } = {}) {
  const u = {};
  const em = rapikanEmail(email);
  if (em) u.em = [sha256(em)];
  const ph = rapikanTelepon(wa);
  if (ph) u.ph = [sha256(ph)];
  const kata = String(nama || "").trim().toLowerCase().replace(/[^\p{L}\s]/gu, "").split(/\s+/).filter(Boolean);
  if (kata.length) u.fn = [sha256(kata[0])];
  if (kata.length > 1) u.ln = [sha256(kata.slice(1).join(""))];
  if (idLuar) u.external_id = [sha256(String(idLuar))];
  if (ip && net.isIP(ip)) u.client_ip_address = ip;
  if (ua) u.client_user_agent = String(ua).slice(0, 1000);
  if (cookieMetaSah(fbp)) u.fbp = fbp;
  if (cookieMetaSah(fbc)) u.fbc = fbc;
  return u;
}

/**
 * Mengirim satu event ke Meta. Tidak pernah melempar galat: hasilnya { ok, lewati?, status?, pesan? }.
 * `id` harus sama dengan eventID yang dipakai Pixel di browser agar tidak terhitung dua kali.
 */
export async function kirimEventMeta({ nama, id, waktu, url, pengguna, kustom, uji = false }) {
  if (!metaSiap()) return { ok: false, lewati: true, pesan: "META belum dikonfigurasi" };
  // Pesanan uji (sandbox) hanya dikirim bila ada kode uji, supaya tampil di tab Test Events.
  if (uji && !kodeUjiMeta()) return { ok: true, lewati: true, pesan: "Pesanan uji tidak dikirim ke Meta" };
  const event = {
    event_name: nama,
    event_time: Math.floor((waktu ? new Date(waktu).getTime() : Date.now()) / 1000),
    event_id: String(id),
    action_source: "website",
    user_data: pengguna || {},
  };
  if (url) event.event_source_url = String(url).slice(0, 1000);
  if (kustom) event.custom_data = kustom;
  const isi = { data: [event] };
  if (kodeUjiMeta()) isi.test_event_code = kodeUjiMeta();
  try {
    const r = await fetch(
      `https://graph.facebook.com/${versiApi()}/${encodeURIComponent(idPixel())}/events?access_token=${encodeURIComponent(tokenCapi())}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(isi), signal: AbortSignal.timeout(6000) }
    );
    let d = {};
    try { d = await r.json(); } catch { /* bukan JSON */ }
    if (!r.ok) return { ok: false, status: r.status, pesan: d?.error?.message || `HTTP ${r.status}` };
    return { ok: true, status: r.status, diterima: d.events_received };
  } catch (e) {
    return { ok: false, pesan: String(e.message || e) };
  }
}
