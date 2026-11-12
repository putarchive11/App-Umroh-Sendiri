import { useEffect, useState } from "react";
import { APP_NAME, MAKS_PERANGKAT, NOMOR_WA } from "./config";
import { aktifkan } from "./aktivasi";
import { PhIcon, TemaToggle } from "./ui";

const waBeli = `https://wa.me/${NOMOR_WA}?text=${encodeURIComponent(
  "Assalamu’alaikum, saya ingin membeli akses aplikasi Kunci Umroh Sendiri."
)}`;

// ─── Layar aktivasi untuk pembeli ───
export function AktivasiPage({ onAktif }) {
  const [kode, setKode] = useState("");
  const [proses, setProses] = useState(false);
  const [galat, setGalat] = useState("");

  async function kirim(e) {
    e.preventDefault();
    if (!kode.trim()) return setGalat("Masukkan kode aktivasi Anda.");
    setProses(true);
    setGalat("");
    const r = await aktifkan(kode);
    setProses(false);
    if (r.ok) onAktif(r.aktivasi);
    else setGalat(r.pesan);
  }

  return (
    <div className="app">
      <main className="aktivasi fade-up">
        <TemaToggle />
        <img className="aktivasi-logo" src="/kabah.png" alt="" width="64" height="64" />
        <div className="aktivasi-merek">{APP_NAME}</div>
        <h1>Aktifkan Aplikasi</h1>
        <p className="aktivasi-sub">Masukkan kode aktivasi yang Anda terima dari admin setelah pembelian.</p>

        <form className="card aktivasi-kartu" onSubmit={kirim}>
          <label htmlFor="kode" className="aktivasi-label">Kode aktivasi</label>
          <input
            id="kode"
            className="input aktivasi-input"
            placeholder="KUS-XXXX-XXXX"
            value={kode}
            onChange={(e) => setKode(e.target.value.toUpperCase())}
            autoCapitalize="characters"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            inputMode="text"
          />
          {galat && <div className="aktivasi-galat"><PhIcon name="ph-warning-circle" /> {galat}</div>}
          <button className="btn block aktivasi-btn" disabled={proses}>
            {proses ? <span className="spin" /> : <><PhIcon name="ph-key" /> Aktifkan</>}
          </button>
        </form>

        <a className="aktivasi-beli" href={waBeli} target="_blank" rel="noreferrer">
          <PhIcon name="ph-whatsapp-logo" /> Belum punya kode? Beli lewat WhatsApp
        </a>

        <ul className="aktivasi-info">
          <li><PhIcon name="ph-device-mobile" /> Satu kode untuk maksimal {MAKS_PERANGKAT} perangkat.</li>
          <li><PhIcon name="ph-wifi-slash" /> Setelah aktif, aplikasi tetap bisa dibuka tanpa sinyal.</li>
          <li><PhIcon name="ph-house-line" /> Pengguna iPhone: pasang dulu ke Layar Utama, lalu aktifkan dari ikon tersebut.</li>
        </ul>
      </main>
    </div>
  );
}

// ─── Halaman admin: buka alamat aplikasi + #admin ───
const K_SANDI = "umroh_admin_sandi";

async function api(sandi, isi) {
  const r = await fetch("/api/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-key": sandi },
    body: JSON.stringify(isi),
  });
  let d = {};
  try { d = await r.json(); } catch { d = { ok: false, pesan: "Server tidak menjawab." }; }
  return d;
}

const tgl = (s) => (s ? new Date(s).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-");

function nomorWa(kontak) {
  let n = String(kontak || "").replace(/\D/g, "");
  if (n.startsWith("0")) n = "62" + n.slice(1);
  return n.length >= 10 ? n : "";
}

export function AdminPage() {
  const [sandi, setSandi] = useState(() => sessionStorage.getItem(K_SANDI) || "");
  const [masuk, setMasuk] = useState(false);
  const [pesan, setPesan] = useState("");
  const [daftar, setDaftar] = useState([]);
  const [maks, setMaks] = useState(MAKS_PERANGKAT);
  const [form, setForm] = useState({ nama: "", kontak: "", catatan: "" });
  const [baru, setBaru] = useState(null);
  const [cari, setCari] = useState("");
  const [sibuk, setSibuk] = useState(false);

  async function muat(s = sandi) {
    const d = await api(s, { aksi: "daftar" });
    if (d.ok) { setDaftar(d.kode); setMaks(d.maks); }
    return d;
  }

  async function login(e) {
    e?.preventDefault();
    setSibuk(true);
    const d = await muat(sandi);
    setSibuk(false);
    if (d.ok) { setMasuk(true); setPesan(""); sessionStorage.setItem(K_SANDI, sandi); }
    else { setPesan(d.pesan); sessionStorage.removeItem(K_SANDI); }
  }

  useEffect(() => { if (sandi) login(); }, []); // eslint-disable-line

  async function buat(e) {
    e.preventDefault();
    setSibuk(true);
    const d = await api(sandi, { aksi: "buat", ...form });
    setSibuk(false);
    if (!d.ok) return setPesan(d.pesan);
    setBaru({ kode: d.kode, ...d.data });
    setForm({ nama: "", kontak: "", catatan: "" });
    setPesan("");
    muat();
  }

  async function ubah(aksi, k, tanya) {
    if (tanya && !confirm(tanya)) return;
    const d = await api(sandi, { aksi, kode: k });
    if (!d.ok) alert(d.pesan);
    muat();
  }

  function teksKirim(b) {
    return `Assalamu’alaikum ${b.nama}, jazakallahu khairan atas pembeliannya.\n\nKode aktivasi aplikasi Kunci Umroh Sendiri:\n*${b.kode}*\n\nBuka ${location.origin} lalu masukkan kode di atas. Satu kode berlaku untuk ${maks} perangkat. Mohon tidak dibagikan ke orang lain.`;
  }

  if (!masuk) {
    return (
      <div className="app">
        <main className="aktivasi fade-up">
          <span className="head-ico admin-ico"><PhIcon name="ph-lock-key" /></span>
          <h1>Admin Kode</h1>
          <p className="aktivasi-sub">Khusus admin {APP_NAME}.</p>
          <form className="card aktivasi-kartu" onSubmit={login}>
            <label className="aktivasi-label" htmlFor="sandi">Kata sandi admin</label>
            <input id="sandi" type="password" className="input" value={sandi} onChange={(e) => setSandi(e.target.value)} autoComplete="current-password" />
            {pesan && <div className="aktivasi-galat"><PhIcon name="ph-warning-circle" /> {pesan}</div>}
            <button className="btn block aktivasi-btn" disabled={sibuk || !sandi}>{sibuk ? <span className="spin" /> : "Masuk"}</button>
          </form>
        </main>
      </div>
    );
  }

  const q = cari.trim().toLowerCase();
  const tampil = daftar.filter((d) => !q || `${d.kode} ${d.nama} ${d.kontak}`.toLowerCase().includes(q));
  const aktif = daftar.filter((d) => d.perangkat?.length && !d.dicabut).length;

  return (
    <div className="app">
      <main className="main fade-up" style={{ paddingBottom: 40 }}>
        <div className="page-head between">
          <div>
            <h2><span className="head-ico"><PhIcon name="ph-key" /></span>Admin Kode</h2>
            <p>{daftar.length} kode dibuat · {aktif} sudah dipakai · batas {maks} perangkat/kode</p>
          </div>
          <button className="icon-btn" title="Keluar" onClick={() => { sessionStorage.removeItem(K_SANDI); location.hash = ""; location.reload(); }}>
            <PhIcon name="ph-sign-out" />
          </button>
        </div>

        <div className="pad stack">
          <form className="card stack" onSubmit={buat}>
            <div className="card-title" style={{ marginBottom: 0 }}>Buat kode untuk pembeli</div>
            <input className="input" placeholder="Nama pembeli *" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} />
            <input className="input" placeholder="No. WhatsApp / email" value={form.kontak} onChange={(e) => setForm({ ...form, kontak: e.target.value })} />
            <input className="input" placeholder="Catatan (opsional, mis. paket VIP)" value={form.catatan} onChange={(e) => setForm({ ...form, catatan: e.target.value })} />
            {pesan && <div className="aktivasi-galat"><PhIcon name="ph-warning-circle" /> {pesan}</div>}
            <button className="btn block aktivasi-btn" disabled={sibuk || !form.nama.trim()}>{sibuk ? <span className="spin" /> : "Buat kode"}</button>
          </form>

          {baru && (
            <div className="card kode-baru">
              <div className="xs muted">Kode untuk {baru.nama}</div>
              <div className="kode-besar">{baru.kode}</div>
              <div className="row" style={{ justifyContent: "center", flexWrap: "wrap" }}>
                <button className="btn sm ghost" onClick={() => navigator.clipboard?.writeText(teksKirim(baru))}><PhIcon name="ph-copy" /> Salin pesan</button>
                <a className="btn sm" style={{ textDecoration: "none" }} target="_blank" rel="noreferrer"
                  href={`https://wa.me/${nomorWa(baru.kontak)}?text=${encodeURIComponent(teksKirim(baru))}`}>
                  <PhIcon name="ph-whatsapp-logo" /> Kirim ke pembeli
                </a>
              </div>
            </div>
          )}

          <div className="section-label">Daftar kode</div>
          <input className="input" placeholder="Cari nama / kode / kontak" value={cari} onChange={(e) => setCari(e.target.value)} />
          {!tampil.length && <p className="small muted" style={{ textAlign: "center" }}>Belum ada kode.</p>}
          {tampil.map((d) => (
            <div key={d.kode} className={`card kode-item ${d.dicabut ? "dicabut" : ""}`}>
              <div className="between">
                <b className="kode-teks">{d.kode}</b>
                {d.dicabut ? <span className="badge merah">Dicabut</span>
                  : d.perangkat?.length ? <span className="badge green">{d.perangkat.length}/{maks} perangkat</span>
                  : <span className="badge">Belum dipakai</span>}
              </div>
              <div className="small" style={{ marginTop: 6 }}><b>{d.nama}</b>{d.kontak ? ` · ${d.kontak}` : ""}</div>
              {d.catatan && <div className="xs muted">{d.catatan}</div>}
              <div className="xs muted">Dibuat {tgl(d.dibuat)}</div>
              {d.perangkat?.map((p) => <div key={p.id} className="xs muted">• {p.label}, aktif {tgl(p.waktu)}</div>)}
              <div className="row" style={{ marginTop: 10, flexWrap: "wrap", gap: 8 }}>
                {d.perangkat?.length > 0 && (
                  <button className="btn sm ghost" onClick={() => ubah("reset", d.kode, `Lepas semua perangkat dari kode ${d.kode}? Pembeli perlu memasukkan kode lagi.`)}>
                    <PhIcon name="ph-arrow-counter-clockwise" /> Reset perangkat
                  </button>
                )}
                {d.dicabut
                  ? <button className="btn sm ghost" onClick={() => ubah("pulihkan", d.kode)}>Pulihkan</button>
                  : <button className="btn sm ghost merah" onClick={() => ubah("cabut", d.kode, `Cabut kode ${d.kode}? Aplikasi pembeli akan terkunci saat online.`)}>Cabut</button>}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
