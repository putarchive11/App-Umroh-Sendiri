// Alat bantu uji: Redis tiruan (lewat REST Upstash), layanan luar tiruan (Midtrans, Meta, Resend),
// serta req/res tiruan untuk memanggil fungsi API tanpa server sungguhan.
import crypto from "node:crypto";

export const KUNCI_SANDBOX = "SB-Mid-server-UJI123";
export const KUNCI_PRODUKSI = "Mid-server-PRODUKSI123";

export function pasangEnv(tambahan = {}) {
  Object.assign(process.env, {
    KV_REST_API_URL: "https://redis.tiruan",
    KV_REST_API_TOKEN: "token-redis",
    MIDTRANS_SERVER_KEY: KUNCI_PRODUKSI,
    META_PIXEL_ID: "1234567890",
    META_CAPI_TOKEN: "token-meta",
    RESEND_API_KEY: "re_tiruan",
    EMAIL_PENGIRIM: "Kunci Umroh Mandiri <halo@umrohsendiri.biz.id>",
    ...tambahan,
  });
}

/** Redis tiruan: cukup perintah yang dipakai aplikasi. */
export function redisTiruan() {
  const data = new Map();
  const kedaluwarsa = new Map();
  const hidup = (k) => {
    const t = kedaluwarsa.get(k);
    if (t && t <= Date.now()) { data.delete(k); kedaluwarsa.delete(k); }
    return data.has(k);
  };
  const jalankan = ([cmd, ...a]) => {
    switch (String(cmd).toUpperCase()) {
      case "GET": return hidup(a[0]) ? data.get(a[0]) : null;
      case "SET": {
        const [k, v, ...opsi] = a;
        const o = opsi.map((x) => String(x).toUpperCase());
        if (o.includes("NX") && hidup(k)) return null;
        data.set(k, String(v));
        const i = o.indexOf("EX");
        if (i >= 0) kedaluwarsa.set(k, Date.now() + Number(opsi[i + 1]) * 1000);
        else kedaluwarsa.delete(k);
        return "OK";
      }
      case "DEL": { const ada = hidup(a[0]); data.delete(a[0]); kedaluwarsa.delete(a[0]); return ada ? 1 : 0; }
      case "INCR": { const n = (hidup(a[0]) ? Number(data.get(a[0])) : 0) + 1; data.set(a[0], String(n)); return n; }
      case "EXPIRE": kedaluwarsa.set(a[0], Date.now() + Number(a[1]) * 1000); return 1;
      case "SADD": { const s = data.get(a[0]) || new Set(); s.add(a[1]); data.set(a[0], s); return 1; }
      case "SMEMBERS": return [...(data.get(a[0]) || [])];
      case "MGET": return a.map((k) => (hidup(k) ? data.get(k) : null));
      case "ZADD": { const z = data.get(a[0]) || new Map(); z.set(a[2], Number(a[1])); data.set(a[0], z); return 1; }
      default: throw new Error("Perintah Redis tiruan belum ada: " + cmd);
    }
  };
  return { data, kedaluwarsa, jalankan, punyaTtl: (k) => kedaluwarsa.has(k) };
}

/**
 * Mengganti fetch global. `luar` mencatat semua panggilan ke layanan luar dan bisa diatur jawabannya.
 * statusMidtrans: objek jawaban GET status (atau null → gagal dihubungi).
 */
export function pasangFetch(redis, atur = {}) {
  const luar = { snap: [], status: [], meta: [], email: [] };
  const jawab = (status, isi) => new Response(JSON.stringify(isi), { status, headers: { "Content-Type": "application/json" } });
  globalThis.fetch = async (url, opsi = {}) => {
    const u = String(url);
    const badan = opsi.body ? JSON.parse(opsi.body) : null;
    if (u.startsWith("https://redis.tiruan")) {
      try { return jawab(200, { result: redis.jalankan(badan) }); } catch (e) { return jawab(200, { error: e.message }); }
    }
    if (u.includes("/snap/v1/transactions")) {
      luar.snap.push({ url: u, headers: opsi.headers, badan });
      if (atur.snapGagal) return jawab(400, { error_messages: ["transaction_details.order_id sudah digunakan"] });
      const redirect_url = atur.urlBayar ? atur.urlBayar(badan) : "https://app.midtrans.com/snap/v4/redirection/tok-snap";
      return jawab(201, { token: "tok-snap", redirect_url });
    }
    if (/midtrans\.com\/v2\/.+\/status$/.test(u)) {
      luar.status.push({ url: u, headers: opsi.headers });
      const s = typeof atur.statusMidtrans === "function" ? atur.statusMidtrans(u) : atur.statusMidtrans;
      if (!s) throw new Error("Midtrans tidak bisa dihubungi");
      return jawab(200, s);
    }
    if (u.startsWith("https://graph.facebook.com/")) {
      luar.meta.push({ url: u, badan });
      if (atur.metaGagal) return jawab(400, { error: { message: "Invalid parameter" } });
      return jawab(200, { events_received: 1 });
    }
    if (u === "https://api.resend.com/emails") {
      luar.email.push({ headers: opsi.headers, badan });
      if (atur.emailGagal) return jawab(500, { message: "Internal error" });
      return jawab(200, { id: "email-1" });
    }
    throw new Error("fetch tidak dikenal dalam uji: " + u);
  };
  return { luar, atur };
}

export function buatReq({ method = "POST", body, headers = {}, origin = "https://www.umrohsendiri.biz.id" } = {}) {
  return {
    method,
    body,
    query: {},
    headers: {
      host: "app-umroh-sendiri.vercel.app",
      "x-forwarded-for": "203.0.113.7, 10.0.0.1",
      "user-agent": "Mozilla/5.0 (uji)",
      ...(origin ? { origin } : {}),
      ...headers,
    },
  };
}

export function buatRes() {
  const res = { statusCode: 200, headers: {}, body: undefined, selesai: false };
  res.setHeader = (k, v) => { res.headers[k.toLowerCase()] = v; return res; };
  res.status = (s) => { res.statusCode = s; return res; };
  res.json = (isi) => { res.body = isi; res.selesai = true; return res; };
  res.end = () => { res.selesai = true; return res; };
  return res;
}

export async function panggil(handler, opsi) {
  const res = buatRes();
  await handler(buatReq(opsi), res);
  return res;
}

/** Notifikasi Midtrans dengan tanda tangan yang benar. */
export function notifikasi(id, status, { kunci = KUNCI_PRODUKSI, nominal = "125000.00", kodeStatus = "200", ...lain } = {}) {
  const signature_key = crypto.createHash("sha512").update(id + kodeStatus + nominal + kunci).digest("hex");
  return {
    order_id: id, transaction_status: status, status_code: kodeStatus, gross_amount: nominal, signature_key,
    fraud_status: "accept", payment_type: "qris", transaction_id: "trx-" + id, ...lain,
  };
}
