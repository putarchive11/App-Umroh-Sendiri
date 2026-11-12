// Tema tampilan: "dark" (Kiswah Hitam) atau "light" (Kiswah Gading).
// Pilihan disimpan di perangkat. Skrip kecil di index.html sudah menerapkannya
// sebelum aplikasi dimuat, jadi layar tidak berkedip saat dibuka.
import { useEffect, useState } from "react";

const KUNCI = "umroh_tema";
const WARNA_BAR = { dark: "#0A0907", light: "#F6F0E1" };

export function bacaTema() {
  try {
    const t = localStorage.getItem(KUNCI);
    return t === "light" || t === "dark" ? t : "dark";
  } catch {
    return "dark";
  }
}

export function terapkanTema(t) {
  document.documentElement.dataset.theme = t;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", WARNA_BAR[t]);
  try { localStorage.setItem(KUNCI, t); } catch { /* abaikan */ }
}

// Dipakai beberapa komponen sekaligus; semuanya ikut berubah saat tema diganti.
const pendengar = new Set();

export function useTema() {
  const [tema, setTemaLokal] = useState(bacaTema);
  useEffect(() => {
    pendengar.add(setTemaLokal);
    return () => pendengar.delete(setTemaLokal);
  }, []);
  const setTema = (t) => {
    terapkanTema(t);
    pendengar.forEach((f) => f(t));
  };
  return [tema, setTema];
}
