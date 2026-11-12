import { useEffect, useState } from "react";
import { APP_NAME, LAYANAN } from "./config";
import { CHECKLIST_DOKUMEN, CHECKLIST_BARANG, DOA_TAHALLUL, DOA_ZAMZAM, DOA_KELUAR_MASJID } from "./data";
import { Card, MenuCard, Badge, Doa, Icon, InstallBanner, PhIcon, Arab } from "./ui";
import { PanduanNiat, PanduanTawaf, PanduanSai } from "./tools/ibadah";
import { KalkulatorBiaya, KalkulatorNabung, KonversiMataUang, NabungTracker, PengeluaranTracker } from "./tools/keuangan";
import { ChecklistView, TimelineView, ItineraryPlanner, ArahKiblat, RekomendasiProduk } from "./tools/persiapan";
import { CatatanPribadi, OlehOlehList } from "./tools/personal";
import { AktivasiPage, AdminPage } from "./Aktivasi";
import { bacaAktivasi, cekUlang, hapusAktivasi } from "./aktivasi";

// Daftar semua alat (sub-halaman)
const SUBS = {
  niat: (p) => <PanduanNiat {...p} />,
  tawaf: (p) => <PanduanTawaf {...p} />,
  sai: (p) => <PanduanSai {...p} />,
  biaya: (p) => <KalkulatorBiaya {...p} />,
  nabung: (p) => <KalkulatorNabung {...p} />,
  konversi: (p) => <KonversiMataUang {...p} />,
  doc: (p) => <ChecklistView title="Checklist Dokumen" data={CHECKLIST_DOKUMEN} storageKey="cl-doc" {...p} />,
  barang: (p) => <ChecklistView title="Checklist Barang Bawaan" data={CHECKLIST_BARANG} storageKey="cl-barang" allowCustom {...p} />,
  timeline: (p) => <TimelineView {...p} />,
  itinerary: (p) => <ItineraryPlanner {...p} />,
  kiblat: (p) => <ArahKiblat {...p} />,
  catatan: (p) => <CatatanPribadi {...p} />,
  tracker: (p) => <NabungTracker {...p} />,
  pengeluaran: (p) => <PengeluaranTracker {...p} />,
  oleholeh: (p) => <OlehOlehList {...p} />,
  produk: (p) => <RekomendasiProduk {...p} />,
};

const TABS = [
  { id: "home", icon: Icon.home, label: "Beranda" },
  { id: "book", icon: Icon.book, label: "Ebook" },
  { id: "tools", icon: Icon.check, label: "Persiapan" },
  { id: "ibadah", icon: Icon.mosque, label: "Ibadah" },
  { id: "me", icon: Icon.user, label: "Saya" },
];

// ─── Gerbang aktivasi ───
export default function App() {
  const [admin, setAdmin] = useState(() => location.hash === "#admin");
  const [aktivasi, setAktivasi] = useState(bacaAktivasi);

  useEffect(() => {
    const f = () => setAdmin(location.hash === "#admin");
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);

  // Cek ulang diam-diam saat online (mis. kode dicabut karena refund).
  useEffect(() => {
    if (!aktivasi) return;
    cekUlang(aktivasi).then((r) => {
      if (r === "kunci") { hapusAktivasi(); setAktivasi(null); }
    });
  }, [aktivasi?.kode]); // eslint-disable-line

  if (admin) return <AdminPage />;
  if (!aktivasi) return <AktivasiPage onAktif={setAktivasi} />;
  return <AppUtama aktivasi={aktivasi} />;
}

function AppUtama({ aktivasi }) {
  const [tab, setTab] = useState("home");
  const [sub, setSub] = useState(null);
  const go = (s) => setSub(s);
  const back = () => setSub(null);

  let content;
  if (sub && SUBS[sub]) content = SUBS[sub]({ onBack: back });
  else if (tab === "book") content = <EbookPage />;
  else if (tab === "tools") content = <ToolsPage go={go} />;
  else if (tab === "ibadah") content = <IbadahPage go={go} />;
  else if (tab === "me") content = <PersonalPage go={go} aktivasi={aktivasi} />;
  else content = <HomePage go={go} />;

  return (
    <div className="app">
      <main className="main">{content}</main>
      <InstallBanner />
      {!sub && (
        <nav className="bottom-nav">
          <div className="bar">
            {TABS.map((t) => (
              <button key={t.id} className={tab === t.id ? "on" : ""} onClick={() => { setTab(t.id); window.scrollTo(0, 0); }}>
                {t.icon}
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}

// ─── BERANDA ───
const QUICK = [
  { icon: "ph-arrows-clockwise", title: "Panduan Tawaf", desc: "Doa per putaran", sub: "tawaf" },
  { icon: "ph-calculator", title: "Kalkulator Biaya", desc: "Estimasi total", sub: "biaya" },
  { icon: "ph-list-checks", title: "Checklist", desc: "Dokumen & barang", sub: "doc" },
  { icon: "ph-coins", title: "Konversi SAR", desc: "SAR ↔ IDR", sub: "konversi" },
  { icon: "ph-chart-pie-slice", title: "Budgeting", desc: "Rencana anggaran", sub: "nabung" },
  { icon: "ph-receipt", title: "Pengeluaran", desc: "Catat pengeluaran", sub: "pengeluaran" },
];

function HomePage({ go }) {
  return (
    <div className="fade-up">
      <div className="hero">
        <div className="brand">
          <img className="logo-img" src="/kabah.png" alt="" width="40" height="40" />
          <div>
            <div className="brand-name">{APP_NAME}</div>
            <div className="brand-sub">Panduan umroh mandiri</div>
          </div>
        </div>
        <h1>Panduan Umroh Mandiri</h1>
        <p>Panduan lengkap umrah mandiri dari nol — persiapan, ibadah, checklist, dan kalkulator biaya dalam satu aplikasi.</p>
        <div className="kiswah-band" aria-hidden="true" />
      </div>
      <div className="talbiyah" role="button" tabIndex={0} onClick={() => go("niat")} onKeyDown={(e) => e.key === "Enter" && go("niat")}>
        <Arab size="lg">لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ</Arab>
        <div className="talbiyah-sub">Talbiyah · dibaca sejak niat ihram di miqat</div>
        <div className="talbiyah-cta">Mulai dari miqat {Icon.chev}</div>
      </div>
      <div className="pad stack">
        <div className="quick">
          {QUICK.map((q) => (
            <Card key={q.sub} onClick={() => go(q.sub)}>
              <div className="ic"><PhIcon name={q.icon} /></div>
              <div className="t">{q.title}</div>
              <div className="d">{q.desc}</div>
            </Card>
          ))}
        </div>
        <div className="section-label">Panduan Ibadah</div>
        <MenuCard icon="ph-map-pin" title="Miqat & Niat Ihram" desc="Tata cara niat dan talbiyah" onClick={() => go("niat")} />
        <MenuCard icon="ph-arrows-clockwise" title="Panduan Tawaf" desc="7 putaran + doa per putaran" onClick={() => go("tawaf")} />
        <MenuCard icon="ph-person-simple-walk" title="Panduan Sa'i" desc="7 lintasan Shafa-Marwah" onClick={() => go("sai")} />
        <div className="section-label">Persiapan Ibadah Umroh</div>
        {LAYANAN.map((l) => <MenuCard key={l.title} {...l} />)}
      </div>
    </div>
  );
}

// ─── EBOOK (dikosongkan dulu) ───
function EbookPage() {
  return (
    <div className="fade-up">
      <div className="page-head">
        <h2><span className="head-ico"><PhIcon name="ph-book-open-text" /></span>Ebook</h2>
        <p>Panduan lengkap umroh mandiri dalam bentuk ebook</p>
      </div>
      <div className="pad">
        <Card className="coming">
          <div className="e"><PhIcon name="ph-books" /></div>
          <h3>Segera Hadir</h3>
          <p>Ebook panduan umroh mandiri sedang disiapkan. Insya Allah akan tersedia di sini dalam waktu dekat.</p>
        </Card>
      </div>
    </div>
  );
}

// ─── PERSIAPAN ───
function ToolsPage({ go }) {
  return (
    <div className="fade-up">
      <div className="page-head">
        <h2><span className="head-ico"><PhIcon name="ph-check-square" /></span>Tools Persiapan</h2>
        <p>Siapkan semuanya dari jauh-jauh hari</p>
      </div>
      <div className="pad stack">
        <div className="section-label">Checklist</div>
        <MenuCard icon="ph-clipboard-text" title="Checklist Dokumen" desc="Paspor, visa, vaksin, dan lainnya" onClick={() => go("doc")} />
        <MenuCard icon="ph-suitcase-rolling" title="Checklist Barang Bawaan" desc="Perlengkapan ibadah, mandi, elektronik" onClick={() => go("barang")} />
        <MenuCard icon="ph-calendar-check" title="Timeline Persiapan" desc="H-6 bulan sampai H-1 hari" onClick={() => go("timeline")} />
        <MenuCard icon="ph-map-trifold" title="Itinerary Perjalanan" desc="Susun jadwal kegiatan umroh kamu" onClick={() => go("itinerary")} />
        <div className="section-label">Kalkulator & Keuangan</div>
        <MenuCard icon="ph-calculator" title="Kalkulator Biaya Umroh" desc="Estimasi total: tiket + hotel + visa + living cost" onClick={() => go("biaya")} />
        <MenuCard icon="ph-chart-line-up" title="Kalkulator Nabung" desc="Target kapan bisa berangkat" onClick={() => go("nabung")} />
        <MenuCard icon="ph-coins" title="Konversi Mata Uang" desc="SAR ↔ IDR" onClick={() => go("konversi")} />
        <MenuCard icon="ph-receipt" title="Catatan Pengeluaran" desc="Catat pengeluaran aktual umroh kamu" onClick={() => go("pengeluaran")} />
        <div className="section-label">Di Tanah Suci</div>
        <MenuCard icon="ph-compass" title="Arah Kiblat" desc="Kompas arah kiblat dari lokasi kamu" onClick={() => go("kiblat")} />
        <div className="section-label">Belanja</div>
        <MenuCard icon="ph-shopping-bag" title="Rekomendasi Produk Umroh" desc="Perlengkapan umroh mandiri pilihan" onClick={() => go("produk")} />
      </div>
    </div>
  );
}

// ─── IBADAH ───
function IbadahPage({ go }) {
  return (
    <div className="fade-up">
      <div className="page-head">
        <h2><span className="head-ico"><PhIcon name="ph-mosque" /></span>Panduan Ibadah</h2>
        <p>Panduan praktis ibadah umrah lengkap dengan doa</p>
      </div>
      <div className="pad stack">
        <Card style={{ background: "linear-gradient(135deg, var(--accent-light), transparent)" }}>
          <div className="card-title" style={{ fontSize: 12 }}>Urutan Rukun Umrah</div>
          <div className="chips" style={{ justifyContent: "center", alignItems: "center" }}>
            {["Ihram & Niat", "Tawaf", "Sa'i", "Tahallul"].map((s, i) => (
              <span key={s} className="row" style={{ gap: 4 }}>
                {i > 0 && <b style={{ color: "var(--accent)" }}>→</b>}
                <span className="chip" style={{ color: "var(--text)", fontSize: 11 }}>{s}</span>
              </span>
            ))}
          </div>
        </Card>
        <MenuCard icon="ph-map-pin" title="Miqat & Niat Ihram" desc="Tata cara, doa niat, dan talbiyah" onClick={() => go("niat")} />
        <MenuCard icon="ph-arrows-clockwise" title="Panduan Tawaf" desc="7 putaran Ka'bah + doa per putaran" onClick={() => go("tawaf")} />
        <MenuCard icon="ph-person-simple-walk" title="Panduan Sa'i" desc="7 lintasan Shafa-Marwah + dzikir" onClick={() => go("sai")} />

        <Card>
          <div className="row" style={{ marginBottom: 8 }}>
            <span className="inline-ico"><PhIcon name="ph-scissors" /></span><b>Tahallul</b><Badge>Rukun 4</Badge>
          </div>
          <p className="small muted">
            Mengakhiri ihram setelah sa'i selesai. Pria: cukur habis (lebih utama) atau potong merata. Wanita: potong ujung rambut ± 1 ruas jari.
          </p>
          <Doa d={DOA_TAHALLUL} />
        </Card>

        <Card>
          <div className="row" style={{ marginBottom: 4 }}><span className="inline-ico"><PhIcon name="ph-drop" /></span><b>Doa Minum Zamzam</b></div>
          <Doa d={DOA_ZAMZAM} size="sm" />
          <p className="xs muted" style={{ marginTop: 10, textAlign: "center", lineHeight: 1.6 }}>
            Tidak ada satu redaksi doa wajib saat meminum Zamzam. Boleh berdoa apa saja memohon kebaikan. Baca Bismillah sebelum minum.
          </p>
        </Card>

        <Card>
          <div className="row" style={{ marginBottom: 4 }}><span className="inline-ico"><PhIcon name="ph-door-open" /></span><b>Doa Keluar Masjid</b></div>
          <Doa d={DOA_KELUAR_MASJID} size="sm" />
        </Card>
      </div>
    </div>
  );
}

// ─── SAYA ───
function PersonalPage({ go, aktivasi }) {
  return (
    <div className="fade-up">
      <div className="page-head">
        <h2><span className="head-ico"><PhIcon name="ph-note-pencil" /></span>Personal</h2>
        <p>Catatan pribadi & tracking progress</p>
      </div>
      <div className="pad stack">
        <MenuCard icon="ph-notebook" title="Catatan & Doa Pribadi" desc="Simpan catatan dan doa personal kamu" onClick={() => go("catatan")} />
        <MenuCard icon="ph-chart-line-up" title="Progress Nabung" desc="Tracker tabungan umroh" onClick={() => go("tracker")} />
        <MenuCard icon="ph-receipt" title="Catatan Pengeluaran" desc="Catat pengeluaran aktual umroh" onClick={() => go("pengeluaran")} />
        <MenuCard icon="ph-gift" title="Daftar Oleh-oleh" desc="Catat oleh-oleh yang ingin dibeli" onClick={() => go("oleholeh")} />
        <p className="xs muted" style={{ textAlign: "center", marginTop: 8 }}>Semua data tersimpan di perangkat ini saja.</p>
        {aktivasi && (
          <p className="xs muted" style={{ textAlign: "center" }}>
            <PhIcon name="ph-seal-check" /> Aktif{aktivasi.nama ? ` atas nama ${aktivasi.nama}` : ""} · {aktivasi.kode}
          </p>
        )}
      </div>
    </div>
  );
}
