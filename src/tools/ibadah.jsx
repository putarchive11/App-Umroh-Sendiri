import { useState } from "react";
import { Card, Doa, SubPage, Badge } from "../ui";
import {
  TAWAF_DUAS, DOA_MASUK_MASJID, TAKBIR, DOA_RUKUN_YAMANI, DOA_MENUJU_MAQAM, SALAT_TAWAF,
  SAI_STEPS, NIAT_UMRAH, TALBIYAH, LANGKAH_IHRAM,
} from "../data";

export function PanduanNiat({ onBack }) {
  return (
    <SubPage title="Miqat & Niat Ihram" onBack={onBack}>
      <Card>
        <div className="card-title">📍 Apa itu Miqat?</div>
        <p className="small muted">
          Miqat adalah titik mulai niat ihram. Kalau berangkat dari Madinah, maka miqatnya adalah Masjid Dzul Hulaifah (Bir Ali).
          Kalau terbang langsung ke Jeddah, miqat diambil saat di udara — pramugari biasanya memberi pengumuman.
        </p>
      </Card>
      <Card>
        <div className="card-title">✅ Langkah-langkah Ihram</div>
        <div className="stack">
          {LANGKAH_IHRAM.map((s, i) => (
            <div key={i} className="row" style={{ alignItems: "flex-start" }}>
              <span className="badge" style={{ minWidth: 24, textAlign: "center" }}>{i + 1}</span>
              <p className="small">{s}</p>
            </div>
          ))}
        </div>
      </Card>
      <Card style={{ textAlign: "center" }}>
        <div className="card-title">Doa Niat Umrah</div>
        <Doa d={NIAT_UMRAH} size="lg" boxed={false} />
      </Card>
      <Card style={{ textAlign: "center" }}>
        <div className="card-title">Talbiyah</div>
        <Doa d={TALBIYAH} boxed={false} />
        <div className="tip">💡 Dibaca berulang-ulang sepanjang perjalanan dari miqat menuju Makkah. Berhenti dibaca saat mulai tawaf.</div>
      </Card>
    </SubPage>
  );
}

export function PanduanTawaf({ onBack }) {
  const [active, setActive] = useState(0);
  const [showSurah, setShowSurah] = useState(false);
  const d = TAWAF_DUAS[active];
  return (
    <SubPage title="Panduan Tawaf" onBack={onBack}>
      <Card className="warn">
        <div className="card-title">⚠️ Yang perlu diketahui</div>
        <p className="small">
          <b>Tidak ada doa tertentu yang ditetapkan untuk setiap nomor putaran tawaf.</b> Tujuh kelompok doa di bawah ini adalah <b>pilihan</b> agar
          mudah diikuti. Boleh berdoa dengan bahasa Indonesia, membaca Al-Qur'an dan berzikir selama tawaf.
        </p>
        <p className="small" style={{ marginTop: 8 }}>
          📐 <b>Rangkaian:</b> Hajar Aswad → mengitari Ka'bah (Ka'bah di sebelah kiri) → Rukun Yamani → Hajar Aswad = 1 putaran. Lakukan 7 kali.
        </p>
      </Card>

      <Card>
        <div className="card-title">🚪 Doa Masuk Masjidil Haram</div>
        <Doa d={DOA_MASUK_MASJID} size="sm" />
      </Card>

      <Card>
        <div className="card-title">1. Memulai dari Hajar Aswad</div>
        <p className="small muted">
          Ketika sejajar Hajar Aswad, bertakbirlah. Jika tidak dapat menyentuh atau menciumnya tanpa berdesakan, cukup memberi isyarat dengan tangan
          kanan dan bertakbir.
        </p>
        <Doa d={TAKBIR} />
      </Card>

      <Card>
        <div className="card-title">2. Antara Rukun Yamani → Hajar Aswad</div>
        <p className="small muted">
          Jika memungkinkan, Rukun Yamani disentuh dengan tangan kanan, tanpa dicium. Jika tidak memungkinkan, terus berjalan tanpa isyarat dan tanpa
          takbir khusus. Bacalah doa ini <b>setiap kali</b> di antara Rukun Yamani dan Hajar Aswad:
        </p>
        <Doa d={DOA_RUKUN_YAMANI} />
      </Card>

      <div className="section-label">🕋 3. Pilihan Doa 7 Putaran</div>
      <div className="chips" style={{ justifyContent: "space-between" }}>
        {TAWAF_DUAS.map((x, i) => (
          <button key={i} className={`chip ${i === active ? "on" : ""}`} style={{ width: 40, padding: "10px 0" }} onClick={() => setActive(i)}>
            {x.putaran}
          </button>
        ))}
      </div>
      <Card key={active} className="fade-up" style={{ textAlign: "center" }}>
        <Badge>Putaran {d.putaran}</Badge>
        <div style={{ fontWeight: 700, fontSize: 15, margin: "8px 0 4px" }}>{d.tema}</div>
        <Doa d={d} boxed={false} />
        {d.tambahan && (
          <p className="small" style={{ marginTop: 10, textAlign: "left" }}>💭 <b>Doa tambahan:</b> {d.tambahan}</p>
        )}
        <div className="tip" style={{ textAlign: "left" }}>
          🔄 Saat sampai antara Rukun Yamani dan Hajar Aswad: baca kembali "Rabbanaa aatinaa fid-dunyaa hasanah..."
        </div>
      </Card>

      <Card>
        <div className="card-title">4. Sesudah Putaran Ketujuh</div>
        <p className="small muted">
          Ketika tiba kembali di Hajar Aswad, tujuh putaran tawaf telah selesai. Tidak ada doa penutup tawaf khusus yang wajib. Ada pendapat ulama yang
          menganjurkan takbir saat sejajar Hajar Aswad di akhir putaran ketujuh.
        </p>
      </Card>

      <Card>
        <div className="card-title">5. Menuju Maqam Ibrahim</div>
        <p className="small muted">Ketika menuju tempat salat dua rakaat, bacalah:</p>
        <Doa d={DOA_MENUJU_MAQAM} />
      </Card>

      <Card>
        <div className="between">
          <div className="card-title" style={{ marginBottom: 0 }}>6. Salat 2 Rakaat Setelah Tawaf</div>
          <button className="btn sm ghost" onClick={() => setShowSurah(!showSurah)}>{showSurah ? "Tutup" : "Lihat Surah"}</button>
        </div>
        <p className="small muted" style={{ marginTop: 10 }}>
          Salat dua rakaat di belakang Maqam Ibrahim jika memungkinkan. Bila ramai, boleh salat di bagian Masjidil Haram lain tanpa menghalangi yang
          sedang tawaf.
        </p>
        <p className="small" style={{ marginTop: 8 }}>
          <b>Rakaat pertama:</b> Al-Fatihah + Al-Kafirun<br />
          <b>Rakaat kedua:</b> Al-Fatihah + Al-Ikhlas
        </p>
        {showSurah &&
          ["fatihah", "kafirun", "ikhlas"].map((k) => (
            <div key={k} className="doa-box fade-up">
              <div className="xs" style={{ fontWeight: 700, marginBottom: 6 }}>{SALAT_TAWAF[k].judul}</div>
              <Doa d={{ ...SALAT_TAWAF[k], arti: "" }} size="sm" boxed={false} />
            </div>
          ))}
      </Card>

      <Card>
        <div className="card-title">7. Doa Setelah Salat</div>
        <p className="small muted">Tidak ada doa tertentu yang ditetapkan khusus. Berikut doa Al-Qur'an sebagai permohonan umum:</p>
        <Doa d={SALAT_TAWAF.doaSetelahSalat} />
      </Card>

      <Card>
        <div className="card-title">8. Minum Air Zamzam & Lanjut Sa'i</div>
        <p className="small muted">
          Jika memungkinkan, minum air Zamzam dengan membaca Bismillah, lalu berdoa memohon kebaikan. Contoh:{" "}
          <i>"Ya Allah, jadikan air Zamzam ini sebab kesehatan, keberkahan, ilmu yang bermanfaat, dan rezeki yang halal."</i>
        </p>
        <div className="tip">Setelah itu, lanjutkan sa'i Safa-Marwah. Jika memungkinkan, dapat kembali mengusap Hajar Aswad sebelum menuju Safa.</div>
      </Card>
    </SubPage>
  );
}

export function PanduanSai({ onBack }) {
  const [n, setN] = useState(0);
  const status =
    n === 0 ? "Belum dimulai" : n < 7 ? `Sekarang di ${n % 2 === 1 ? "Marwah" : "Shafa"} — lintasan ke-${n}` : "Sa'i selesai! Alhamdulillah ✨";
  return (
    <SubPage title="Panduan Sa'i" onBack={onBack}>
      <Card style={{ textAlign: "center" }}>
        <p className="small muted">7 lintasan antara Bukit Shafa dan Marwah</p>
        <div className="between" style={{ margin: "14px 0" }}>
          <div>
            <div style={{ fontWeight: 800, color: "var(--accent)" }}>SHAFA</div>
            <div className="xs muted">Mulai (1,3,5,7)</div>
          </div>
          <div style={{ flex: 1, height: 2, background: "var(--card-2)" }} />
          <div>
            <div style={{ fontWeight: 800, color: "var(--accent)" }}>MARWAH</div>
            <div className="xs muted">Selesai (2,4,6)</div>
          </div>
        </div>
        <p className="xs muted">Pria berlari kecil (raml) antara dua lampu hijau</p>
      </Card>

      <Card style={{ textAlign: "center" }}>
        <div className="card-title">Penghitung Lintasan</div>
        <div className="big-num" style={{ fontSize: 48 }}>
          {n}<span className="muted" style={{ fontSize: 20 }}>/7</span>
        </div>
        <div className="chips" style={{ justifyContent: "center", margin: "10px 0" }}>
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <span key={i} style={{ width: 12, height: 12, borderRadius: 6, background: i <= n ? "var(--green)" : "var(--card-2)" }} />
          ))}
        </div>
        <p className="small">{status}</p>
        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn block" onClick={() => setN((c) => Math.min(c + 1, 7))}>+1 Lintasan</button>
          <button className="btn ghost" onClick={() => setN(0)}>Reset</button>
        </div>
      </Card>

      {SAI_STEPS.map((s, i) => (
        <Card key={i}>
          <div className="card-title">{s.step}</div>
          <Doa d={s} />
          <p className="small muted" style={{ marginTop: 10 }}>{s.detail}</p>
        </Card>
      ))}
    </SubPage>
  );
}
