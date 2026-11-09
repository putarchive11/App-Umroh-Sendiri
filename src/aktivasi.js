// Status aktivasi di perangkat. Setelah aktif, aplikasi tetap bisa dipakai tanpa sinyal.
const K_AKTIVASI = "umroh_aktivasi";
const K_PERANGKAT = "umroh_perangkat";

function acak() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function idPerangkat() {
  try {
    let id = localStorage.getItem(K_PERANGKAT);
    if (!id) { id = acak(); localStorage.setItem(K_PERANGKAT, id); }
    return id;
  } catch {
    return acak();
  }
}

export function labelPerangkat() {
  const ua = navigator.userAgent;
  const os = /iPhone/.test(ua) ? "iPhone" : /iPad/.test(ua) ? "iPad" : /Android/.test(ua) ? "Android" : /Windows/.test(ua) ? "Windows" : /Mac/.test(ua) ? "Mac" : "Perangkat";
  const pasang = window.matchMedia?.("(display-mode: standalone)").matches || navigator.standalone ? " (terpasang)" : "";
  return os + pasang;
}

export function bacaAktivasi() {
  try { return JSON.parse(localStorage.getItem(K_AKTIVASI)) || null; } catch { return null; }
}

function simpan(a) {
  try { localStorage.setItem(K_AKTIVASI, JSON.stringify(a)); } catch { /* abaikan */ }
}

export function hapusAktivasi() {
  try { localStorage.removeItem(K_AKTIVASI); } catch { /* abaikan */ }
}

async function panggil(isi) {
  const r = await fetch("/api/aktivasi", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...isi, perangkat: idPerangkat(), label: labelPerangkat() }),
  });
  let data = {};
  try { data = await r.json(); } catch { /* bukan JSON */ }
  return { status: r.status, ...data };
}

/** Mengaktifkan kode. Hasil: { ok, pesan, aktivasi } */
export async function aktifkan(kode) {
  if (!navigator.onLine) return { ok: false, pesan: "Perangkat sedang offline. Aktivasi pertama butuh internet." };
  try {
    const r = await panggil({ kode });
    if (!r.ok) return { ok: false, pesan: r.pesan || "Kode tidak bisa diaktifkan." };
    const aktivasi = { kode: r.kode, nama: r.nama, waktu: new Date().toISOString() };
    simpan(aktivasi);
    return { ok: true, aktivasi };
  } catch {
    return { ok: false, pesan: "Tidak bisa terhubung ke server. Periksa sinyal lalu coba lagi." };
  }
}

/**
 * Cek ulang diam-diam saat online. Hanya mengunci kalau server jelas menyatakan
 * kode dicabut / perangkat dilepas. Gangguan sinyal atau server tidak mengunci.
 */
export async function cekUlang(a) {
  if (!a || !navigator.onLine) return "lewati";
  try {
    const r = await panggil({ kode: a.kode, cek: true });
    if (r.ok) return "ok";
    if (["dicabut", "tidak_dikenal", "perangkat_dilepas"].includes(r.alasan)) return "kunci";
    return "lewati";
  } catch {
    return "lewati";
  }
}
