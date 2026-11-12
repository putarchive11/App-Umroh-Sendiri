import { useEffect, useRef, useState } from "react";
import { useTema } from "./tema";

const svg = (children) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

export const Icon = {
  home: svg(<><path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></>),
  book: svg(<><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>),
  check: svg(<><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>),
  mosque: svg(<><path d="M3 21h18" /><path d="M5 21v-8a7 7 0 0 1 14 0v8" /><path d="M12 3v3" /><path d="M10 21v-4a2 2 0 0 1 4 0v4" /></>),
  user: svg(<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>),
  back: svg(<path d="M15 18l-6-6 6-6" />),
  chev: svg(<path d="M9 18l6-6-6-6" />),
  play: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" /></svg>,
  pause: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>,
  trash: svg(<><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /></>),
  kaaba: svg(<><path d="M4 8l8-4 8 4v12H4z" /><path d="M4 11h16" /></>),
};

export function Card({ children, onClick, className = "", style }) {
  return (
    <div className={`card ${onClick ? "tap" : ""} ${className}`} onClick={onClick} style={style}>
      {children}
    </div>
  );
}

/** Ikon garis Phosphor. `name` berupa "ph-nama"; teks lain (mis. emoji) ditampilkan apa adanya. */
export function PhIcon({ name }) {
  if (typeof name === "string" && name.startsWith("ph-")) return <i className={`ph ${name}`} aria-hidden="true" />;
  return name;
}

export function MenuCard({ icon, title, desc, onClick, href }) {
  const inner = (
    <>
      <div className="menu-icon"><PhIcon name={icon} /></div>
      <div style={{ minWidth: 0 }}>
        <div className="menu-title">{title}</div>
        {desc && <div className="menu-desc">{desc}</div>}
      </div>
      <div className="chev">{Icon.chev}</div>
    </>
  );
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="card tap menu-card">
        {inner}
      </a>
    );
  }
  return <div className="card tap menu-card" onClick={onClick}>{inner}</div>;
}

export function Badge({ children, green }) {
  return <span className={`badge ${green ? "green" : ""}`}>{children}</span>;
}

export function SubHeader({ title, onBack, right }) {
  return (
    <div className="subheader">
      <button className="icon-btn" onClick={onBack} aria-label="Kembali">{Icon.back}</button>
      <h2>{title}</h2>
      {right}
    </div>
  );
}

export function SubPage({ title, onBack, right, children }) {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div>
      <SubHeader title={title} onBack={onBack} right={right} />
      <div className="sub-body fade-up">{children}</div>
    </div>
  );
}

// Teks Arab berharokat, khat Utsman Taha, arah kanan-ke-kiri
export function Arab({ children, size = "", align = "" }) {
  return (
    <div className={`arab ${size} ${align}`} dir="rtl" lang="ar">
      {children}
    </div>
  );
}

// ── Pemutar audio doa ─────────────────────────────────────────
// Hanya satu audio yang berbunyi dalam satu waktu. `src` boleh berupa
// satu URL atau daftar URL (diputar berurutan, mis. ayat per ayat).
let stopCurrent = null;
const fmt = (s) => (isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "0:00");

export function AudioPlayer({ audio }) {
  const list = Array.isArray(audio.src) ? audio.src : [audio.src];
  const ref = useRef(null);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [t, setT] = useState({ cur: 0, dur: 0 });

  const stop = () => {
    const a = ref.current;
    if (a) a.pause();
    setPlaying(false);
  };

  useEffect(() => () => { if (stopCurrent === stop) stopCurrent = null; ref.current && ref.current.pause(); }, []);

  // Pindah ke file berikutnya dalam daftar → langsung putar
  const advancing = useRef(false);
  useEffect(() => {
    if (!advancing.current) return;
    advancing.current = false;
    ref.current && ref.current.play().catch(() => { setError(true); setPlaying(false); });
  }, [idx]);

  const toggle = () => {
    const a = ref.current;
    if (!a) return;
    if (playing) { stop(); return; }
    if (stopCurrent && stopCurrent !== stop) stopCurrent();
    stopCurrent = stop;
    setError(false);
    setLoading(true);
    a.play().then(() => setPlaying(true)).catch(() => { setError(true); setPlaying(false); }).finally(() => setLoading(false));
  };

  const onEnded = () => {
    if (idx < list.length - 1) {
      advancing.current = true;
      setIdx(idx + 1);
    } else {
      setPlaying(false);
      setIdx(0);
      setT({ cur: 0, dur: t.dur });
    }
  };

  const seek = (e) => {
    const a = ref.current;
    if (!a || !a.duration) return;
    const r = e.currentTarget.getBoundingClientRect();
    a.currentTime = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * a.duration;
  };

  const pct = t.dur ? (t.cur / t.dur) * 100 : 0;
  return (
    <div className="audio">
      <audio
        ref={ref}
        src={list[idx]}
        preload="none"
        onTimeUpdate={(e) => setT({ cur: e.currentTarget.currentTime, dur: e.currentTarget.duration || 0 })}
        onLoadedMetadata={(e) => setT({ cur: 0, dur: e.currentTarget.duration || 0 })}
        onWaiting={() => setLoading(true)}
        onPlaying={() => setLoading(false)}
        onEnded={onEnded}
        onError={() => { setError(true); setPlaying(false); setLoading(false); }}
      />
      <button className="audio-btn" onClick={toggle} aria-label={playing ? "Jeda audio" : "Putar audio"}>
        {loading ? <span className="spin" /> : playing ? Icon.pause : Icon.play}
      </button>
      <div className="audio-body">
        <div className="audio-bar" onClick={seek}><div style={{ width: `${pct}%` }} /></div>
        <div className="audio-meta">
          <span>{error ? "Audio gagal dimuat — cek koneksi" : audio.label}</span>
          <span>{list.length > 1 ? `${idx + 1}/${list.length} · ` : ""}{fmt(t.cur)}{t.dur ? ` / ${fmt(t.dur)}` : ""}</span>
        </div>
      </div>
    </div>
  );
}

// Blok doa lengkap: Arab + audio + latin + arti + sumber
export function Doa({ d, size, boxed = true }) {
  const body = (
    <>
      <Arab size={size}>{d.doa}</Arab>
      {d.audio && <AudioPlayer audio={d.audio} />}
      {d.latin && <div className="latin">{d.latin}</div>}
      {d.arti && <div className="arti">“{d.arti}”</div>}
      {d.sumber && <div className="sumber">{d.sumber}</div>}
    </>
  );
  return boxed ? <div className="doa-box">{body}</div> : body;
}

export function Progress({ pct }) {
  return (
    <div className="progress">
      <div style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}

export function CheckBox({ on }) {
  return <span className={`box ${on ? "on" : ""}`}>{on ? "✓" : ""}</span>;
}

// Banner "Pasang aplikasi" (PWA)
export function InstallBanner() {
  const [evt, setEvt] = useState(null);
  const [hidden, setHidden] = useState(() => {
    try { return localStorage.getItem("umroh_install_hidden") === "1"; } catch { return false; }
  });
  useEffect(() => {
    const h = (e) => { e.preventDefault(); setEvt(e); };
    window.addEventListener("beforeinstallprompt", h);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);
  if (!evt || hidden) return null;
  const close = () => {
    setHidden(true);
    try { localStorage.setItem("umroh_install_hidden", "1"); } catch { /* abaikan */ }
  };
  return (
    <div className="card install">
      <div style={{ fontSize: 26 }}>📲</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>Pasang Umroh Sendiri</div>
        <div className="xs muted">Buka cepat dari layar utama HP</div>
      </div>
      <button className="btn sm" onClick={async () => { evt.prompt(); await evt.userChoice; setEvt(null); }}>Pasang</button>
      <button className="icon-btn" onClick={close} aria-label="Tutup">×</button>
    </div>
  );
}

// ── Tombol tema terang / gelap ────────────────────────────────
export function TemaToggle() {
  const [tema, setTema] = useTema();
  const gelap = tema !== "light";
  return (
    <button
      type="button"
      className="tema-btn"
      onClick={() => setTema(gelap ? "light" : "dark")}
      aria-label={gelap ? "Ganti ke tampilan terang" : "Ganti ke tampilan gelap"}
      title={gelap ? "Tampilan terang" : "Tampilan gelap"}
    >
      <svg className="ikon-bulan" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
      </svg>
      <svg className="ikon-matahari" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2.5v2M12 19.5v2M4.6 4.6L6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4" />
      </svg>
    </button>
  );
}

// Pilihan tema bergambar (halaman Saya)
export function PilihanTema() {
  const [tema, setTema] = useTema();
  const opsi = [
    { id: "dark", nama: "Kiswah Hitam", cls: "gelap" },
    { id: "light", nama: "Kiswah Gading", cls: "terang" },
  ];
  return (
    <div className="tema-pilihan" role="radiogroup" aria-label="Tampilan aplikasi">
      {opsi.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={tema === o.id}
          className={`tema-opsi ${tema === o.id ? "on" : ""}`} onClick={() => setTema(o.id)}>
          <div className={`tema-contoh ${o.cls}`} />
          <span>{o.nama}{tema === o.id && <i className="ph ph-check-circle" aria-hidden="true" />}</span>
        </button>
      ))}
    </div>
  );
}
