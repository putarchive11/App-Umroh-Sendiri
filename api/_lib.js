// Pembantu bersama untuk fungsi server (file berawalan "_" tidak dijadikan alamat API oleh Vercel).
import crypto from "node:crypto";

// Upstash Redis lewat REST. Nama variabel mengikuti yang dipasang otomatis oleh Vercel → Storage → Upstash.
const URL_REDIS = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN_REDIS = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

export const MAKS_PERANGKAT = Math.max(1, parseInt(process.env.MAX_PERANGKAT || "2", 10) || 2);

export async function redis(...perintah) {
  if (!URL_REDIS || !TOKEN_REDIS) throw new Error("DATABASE_BELUM_DIPASANG");
  const r = await fetch(URL_REDIS, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN_REDIS}`, "Content-Type": "application/json" },
    body: JSON.stringify(perintah),
  });
  const data = await r.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

export function kirim(res, status, isi) {
  res.setHeader("Cache-Control", "no-store");
  res.status(status).json(isi);
}

export function bacaBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  try { return JSON.parse(req.body || "{}"); } catch { return {}; }
}

// Huruf yang mudah tertukar (O/0, I/1/L) tidak dipakai.
const HURUF = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** "kus 7hq2-9xm4" → "KUS7HQ29XM4" (bentuk simpanan). */
export function rapikanKode(teks) {
  return String(teks || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20);
}

/** "KUS7HQ29XM4" → "KUS-7HQ2-9XM4" (bentuk tampilan). */
export function tampilKode(k) {
  return k.length === 11 && k.startsWith("KUS") ? `KUS-${k.slice(3, 7)}-${k.slice(7)}` : k;
}

export function kodeBaru() {
  let s = "KUS";
  for (let i = 0; i < 8; i++) s += HURUF[crypto.randomInt(HURUF.length)];
  return s;
}

/** Batasi percobaan per alamat IP agar kode tidak bisa ditebak beruntun. */
export async function batasiPercobaan(req, nama, maks, detik) {
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "anon";
  const kunci = `batas:${nama}:${ip}`;
  const n = await redis("INCR", kunci);
  if (n === 1) await redis("EXPIRE", kunci, detik);
  return n <= maks;
}

export const kunciKode = (k) => `kode:${k}`;
export const DAFTAR_KODE = "kode:semua";

export async function ambilKode(k) {
  const v = await redis("GET", kunciKode(k));
  return v ? JSON.parse(v) : null;
}

export async function simpanKode(k, data) {
  await redis("SET", kunciKode(k), JSON.stringify(data));
}
