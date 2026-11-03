import { useEffect, useState } from "react";

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

export function MenuCard({ icon, title, desc, onClick, href }) {
  const inner = (
    <>
      <div className="menu-icon">{icon}</div>
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

// Blok doa lengkap: Arab + latin + arti + sumber
export function Doa({ d, size, boxed = true }) {
  const body = (
    <>
      <Arab size={size}>{d.doa}</Arab>
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
