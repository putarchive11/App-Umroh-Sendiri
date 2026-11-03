// Penyimpanan lokal di perangkat pengguna (localStorage).
const PREFIX = "umroh_";

export function load(key, fallback) {
  try {
    const v = localStorage.getItem(PREFIX + key);
    return v == null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* penyimpanan penuh / diblokir — abaikan */
  }
}

export const fmt = (n) => new Intl.NumberFormat("id-ID").format(Math.round(Number(n) || 0));
