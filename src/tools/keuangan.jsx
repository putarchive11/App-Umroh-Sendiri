import { useState } from "react";
import { Card, SubPage, Progress } from "../ui";
import { usePersisted } from "../hooks";
import { fmt } from "../store";
import { DEFAULT_KURS } from "../config";
import { EXPENSE_CATEGORIES } from "../data";

const NumInput = ({ value, onChange, placeholder }) => (
  <input className="input num" type="number" inputMode="numeric" value={value} placeholder={placeholder}
    onChange={(e) => onChange(Number(e.target.value) || 0)} />
);

const Field = ({ label, rp, value, onChange }) => (
  <div className="field">
    <span>{label}</span>
    <div className="row">
      {rp && <span className="xs muted">Rp</span>}
      <NumInput value={value} onChange={onChange} />
    </div>
  </div>
);

// ─── Kalkulator Biaya ───
const BIAYA_DEFAULT = { pax: 2, tiket: 8000000, hotel_mdn: 700000, malam_mdn: 7, hotel_mkh: 1200000, malam_mkh: 5, visa: 650000, transport: 3500000, makan: 150000, oleh: 3000000 };

export function KalkulatorBiaya({ onBack }) {
  const [v, setV] = usePersisted("kalkulator-biaya", BIAYA_DEFAULT);
  const u = (k) => (val) => setV((p) => ({ ...p, [k]: val }));
  const pax = Math.max(1, v.pax);
  const malam = v.malam_mdn + v.malam_mkh;
  const totalHotel = v.hotel_mdn * v.malam_mdn + v.hotel_mkh * v.malam_mkh;
  const totalMakan = v.makan * malam * pax;
  const grand = v.tiket * pax + totalHotel + v.visa * pax + v.transport + totalMakan + v.oleh;
  const rows = [
    ["Tiket pesawat", v.tiket * pax], ["Hotel total", totalHotel], ["Visa", v.visa * pax],
    ["Transport", v.transport], ["Makan", totalMakan], ["Oleh-oleh", v.oleh],
  ];
  return (
    <SubPage title="Kalkulator Biaya Umroh" onBack={onBack}>
      <Card>
        <div className="card-title">👥 Jumlah Jamaah</div>
        <div className="chips">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <button key={n} className={`chip ${v.pax === n ? "on" : ""}`} onClick={() => u("pax")(n)}>{n}</button>
          ))}
        </div>
      </Card>
      <Card>
        <div className="card-title">✈️ Tiket Pesawat (per orang)</div>
        <Field label="Harga tiket PP" rp value={v.tiket} onChange={u("tiket")} />
      </Card>
      <Card>
        <div className="card-title">🏨 Hotel (harga per kamar/malam)</div>
        <Field label="Hotel Madinah" rp value={v.hotel_mdn} onChange={u("hotel_mdn")} />
        <Field label="Jumlah malam" value={v.malam_mdn} onChange={u("malam_mdn")} />
        <Field label="Hotel Makkah" rp value={v.hotel_mkh} onChange={u("hotel_mkh")} />
        <Field label="Jumlah malam" value={v.malam_mkh} onChange={u("malam_mkh")} />
      </Card>
      <Card>
        <div className="card-title">📄 Lainnya</div>
        <Field label="Visa (per orang)" rp value={v.visa} onChange={u("visa")} />
        <Field label="Transport total" rp value={v.transport} onChange={u("transport")} />
        <Field label="Makan/hari/orang" rp value={v.makan} onChange={u("makan")} />
        <Field label="Oleh-oleh total" rp value={v.oleh} onChange={u("oleh")} />
      </Card>
      <Card style={{ background: "linear-gradient(135deg, var(--accent-light), var(--card))" }}>
        <div className="card-title">📊 Estimasi Biaya</div>
        {rows.map(([l, a]) => (
          <div key={l} className="field"><span className="muted">{l}</span><span>Rp {fmt(a)}</span></div>
        ))}
        <div className="between" style={{ marginTop: 12 }}>
          <b>GRAND TOTAL</b><span className="big-num" style={{ fontSize: 22 }}>Rp {fmt(grand)}</span>
        </div>
        <div className="between xs muted" style={{ marginTop: 4 }}>
          <span>Per orang</span><span>Rp {fmt(grand / pax)}</span>
        </div>
      </Card>
      <button className="btn ghost" onClick={() => setV(BIAYA_DEFAULT)}>Kembalikan ke angka contoh</button>
    </SubPage>
  );
}

// ─── Kalkulator Nabung / Budgeting ───
export function KalkulatorNabung({ onBack }) {
  const [v, setV] = usePersisted("kalkulator-nabung", { target: 25000000, saved: 5000000, monthly: 2000000 });
  const sisa = Math.max(v.target - v.saved, 0);
  const bulan = v.monthly > 0 ? Math.ceil(sisa / v.monthly) : 0;
  const tgl = new Date();
  tgl.setMonth(tgl.getMonth() + bulan);
  const pct = v.target > 0 ? Math.round((v.saved / v.target) * 100) : 0;
  return (
    <SubPage title="Kalkulator Nabung" onBack={onBack}>
      <Card>
        <div className="card-title">🎯 Target & Kemampuan</div>
        <Field label="Target biaya umroh" rp value={v.target} onChange={(x) => setV({ ...v, target: x })} />
        <Field label="Sudah terkumpul" rp value={v.saved} onChange={(x) => setV({ ...v, saved: x })} />
        <Field label="Nabung per bulan" rp value={v.monthly} onChange={(x) => setV({ ...v, monthly: x })} />
      </Card>
      <Card style={{ textAlign: "center" }}>
        <div className="small muted">Estimasi bisa berangkat</div>
        <div className="big-num">{v.monthly > 0 ? `${bulan} bulan` : "—"}</div>
        {v.monthly > 0 && <div className="small">🗓 {tgl.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</div>}
        <div style={{ margin: "14px 0 6px" }}><Progress pct={pct} /></div>
        <div className="between xs muted"><span>Terkumpul: Rp {fmt(v.saved)}</span><span>{Math.min(pct, 100)}%</span></div>
        <div className="small" style={{ marginTop: 10 }}>Sisa yang perlu ditabung: <b>Rp {fmt(sisa)}</b></div>
      </Card>
    </SubPage>
  );
}

// ─── Konversi SAR ↔ IDR ───
export function KonversiMataUang({ onBack }) {
  const [kurs, setKurs] = usePersisted("kurs", DEFAULT_KURS);
  const [sar, setSar] = useState(100);
  return (
    <SubPage title="Konversi SAR ↔ IDR" onBack={onBack}>
      <Card>
        <div className="card-title">Kurs 1 SAR = ? IDR</div>
        <input className="input" type="number" inputMode="numeric" value={kurs} onChange={(e) => setKurs(Number(e.target.value) || 0)} />
        <p className="xs muted" style={{ marginTop: 6 }}>Sesuaikan dengan kurs terbaru di money changer / bank.</p>
      </Card>
      <Card>
        <div className="small" style={{ fontWeight: 600, marginBottom: 6 }}>🇸🇦 Saudi Riyal (SAR)</div>
        <input className="input" type="number" inputMode="decimal" value={Math.round(sar * 100) / 100}
          onChange={(e) => setSar(Number(e.target.value) || 0)} />
        <div style={{ textAlign: "center", fontSize: 20, color: "var(--accent)", margin: "8px 0" }}>⇅</div>
        <div className="small" style={{ fontWeight: 600, marginBottom: 6 }}>🇮🇩 Rupiah (IDR)</div>
        <input className="input" type="number" inputMode="numeric" value={Math.round(sar * kurs)}
          onChange={(e) => setSar(kurs > 0 ? (Number(e.target.value) || 0) / kurs : 0)} />
      </Card>
      <Card>
        <div className="card-title">Konversi Cepat</div>
        {[10, 50, 100, 500, 1000].map((n) => (
          <div key={n} className="field"><span>{n} SAR</span><b>Rp {fmt(n * kurs)}</b></div>
        ))}
      </Card>
    </SubPage>
  );
}

// ─── Progress Nabung (tracker) ───
export function NabungTracker({ onBack }) {
  const [data, setData] = usePersisted("nabung-data", { target: 25000000, entries: [] });
  const [amount, setAmount] = useState("");
  const [label, setLabel] = useState("");
  const total = data.entries.reduce((a, e) => a + e.amount, 0);
  const pct = data.target > 0 ? Math.min(Math.round((total / data.target) * 100), 100) : 0;
  const add = () => {
    if (!Number(amount)) return;
    setData({ ...data, entries: [...data.entries, { id: Date.now(), amount: Number(amount), label: label.trim() || "Tabungan", date: new Date().toISOString() }] });
    setAmount(""); setLabel("");
  };
  const del = (id) => setData({ ...data, entries: data.entries.filter((e) => e.id !== id) });
  return (
    <SubPage title="Progress Nabung" onBack={onBack}>
      <Card style={{ textAlign: "center" }}>
        <div className="small muted">Terkumpul</div>
        <div className="big-num">Rp {fmt(total)}</div>
        <div style={{ margin: "12px 0 6px" }}><Progress pct={pct} /></div>
        <div className="between xs muted"><span>{pct}%</span><span>Target: Rp {fmt(data.target)}</span></div>
      </Card>
      <Card>
        <div className="card-title">Target (Rp)</div>
        <input className="input" type="number" inputMode="numeric" value={data.target} onChange={(e) => setData({ ...data, target: Number(e.target.value) || 0 })} />
      </Card>
      <Card>
        <div className="card-title">Tambah Tabungan</div>
        <div className="stack">
          <input className="input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Keterangan (opsional)" />
          <div className="row">
            <input className="input" type="number" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Jumlah (Rp)"
              onKeyDown={(e) => e.key === "Enter" && add()} />
            <button className="btn" onClick={add}>+</button>
          </div>
        </div>
      </Card>
      {data.entries.length > 0 && (
        <Card>
          <div className="card-title">Riwayat</div>
          {[...data.entries].reverse().map((e) => (
            <div key={e.id} className="list-row">
              <div style={{ flex: 1 }}>
                <div className="small" style={{ fontWeight: 600 }}>{e.label}</div>
                <div className="xs muted">{new Date(e.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</div>
              </div>
              <b style={{ color: "var(--green)", fontSize: 13 }}>+Rp {fmt(e.amount)}</b>
              <button className="icon-btn" onClick={() => del(e.id)} aria-label="Hapus">×</button>
            </div>
          ))}
        </Card>
      )}
    </SubPage>
  );
}

// ─── Catatan Pengeluaran ───
const today = () => new Date().toISOString().slice(0, 10);
const catOf = (id) => EXPENSE_CATEGORIES.find((c) => c.id === id) || EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1];

export function PengeluaranTracker({ onBack }) {
  const [entries, setEntries] = usePersisted("pengeluaran-data", []);
  const [kurs, setKurs] = usePersisted("kurs", DEFAULT_KURS);
  const empty = { nama: "", jumlah: "", mata: "SAR", kategori: "lainnya", tanggal: today() };
  const [f, setF] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [filter, setFilter] = useState("semua");
  const [showKurs, setShowKurs] = useState(false);

  const total = entries.reduce((a, e) => a + e.jumlah, 0);
  const filtered = filter === "semua" ? entries : entries.filter((e) => e.kategori === filter);
  const catTotals = EXPENSE_CATEGORIES.map((c) => {
    const list = entries.filter((e) => e.kategori === c.id);
    return { ...c, total: list.reduce((a, e) => a + e.jumlah, 0), count: list.length };
  }).filter((c) => c.count > 0).sort((a, b) => b.total - a.total);

  const submit = () => {
    const raw = Number(f.jumlah);
    if (!f.nama.trim() || !raw) return;
    const rec = { nama: f.nama.trim(), jumlahAsli: raw, mataUang: f.mata, jumlah: f.mata === "SAR" ? raw * kurs : raw, kategori: f.kategori, tanggal: f.tanggal };
    if (editId) setEntries(entries.map((e) => (e.id === editId ? { ...e, ...rec } : e)));
    else setEntries([...entries, { id: Date.now(), ...rec }]);
    setF(empty); setEditId(null);
  };
  const startEdit = (e) => {
    setEditId(e.id);
    setF({ nama: e.nama, jumlah: String(e.jumlahAsli ?? e.jumlah), mata: e.mataUang || "IDR", kategori: e.kategori, tanggal: e.tanggal });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const del = (id) => {
    setEntries(entries.filter((e) => e.id !== id));
    if (editId === id) { setEditId(null); setF(empty); }
  };

  return (
    <SubPage title="Catatan Pengeluaran" onBack={onBack}>
      <Card style={{ textAlign: "center", background: "linear-gradient(135deg, var(--accent-light), var(--card))" }}>
        <div className="small muted">Total Pengeluaran</div>
        <div className="big-num">Rp {fmt(total)}</div>
        <div className="small">≈ SAR {fmt(kurs > 0 ? total / kurs : 0)}</div>
        <div className="xs muted" style={{ marginTop: 4 }}>{entries.length} transaksi · kurs 1 SAR = Rp {fmt(kurs)}</div>
        <button className="btn sm ghost" style={{ marginTop: 10 }} onClick={() => setShowKurs(!showKurs)}>{showKurs ? "Tutup" : "⚙️ Ubah kurs"}</button>
        {showKurs && (
          <div className="row" style={{ marginTop: 10, justifyContent: "center" }}>
            <span className="small">1 SAR =</span>
            <input className="input num" type="number" value={kurs} onChange={(e) => setKurs(Number(e.target.value) || 0)} />
            <span className="small">IDR</span>
          </div>
        )}
      </Card>

      {catTotals.length > 0 && (
        <Card>
          <div className="card-title">Ringkasan per Kategori</div>
          <div className="stack">
            {catTotals.map((c) => {
              const pct = total > 0 ? Math.round((c.total / total) * 100) : 0;
              return (
                <div key={c.id} className="row">
                  <span style={{ fontSize: 20 }}>{c.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div className="between small"><span>{c.label}</span><b>Rp {fmt(c.total)}</b></div>
                    <div style={{ margin: "4px 0" }}><Progress pct={pct} /></div>
                    <div className="xs muted">{c.count} item · {pct}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card>
        <div className="card-title">{editId ? "✏️ Edit Pengeluaran" : "➕ Tambah Pengeluaran"}</div>
        <div className="stack">
          <input className="input" value={f.nama} onChange={(e) => setF({ ...f, nama: e.target.value })} placeholder="Nama pengeluaran (mis: Makan siang)" />
          <div className="row">
            {["SAR", "IDR"].map((m) => (
              <button key={m} className={`chip ${f.mata === m ? "on" : ""}`} style={{ flex: 1 }} onClick={() => setF({ ...f, mata: m })}>
                {m === "SAR" ? "🇸🇦 SAR" : "🇮🇩 IDR"}
              </button>
            ))}
          </div>
          <input className="input" type="number" inputMode="decimal" value={f.jumlah} onChange={(e) => setF({ ...f, jumlah: e.target.value })}
            placeholder={f.mata === "SAR" ? "Jumlah (SAR)" : "Jumlah (Rp)"} />
          {Number(f.jumlah) > 0 && (
            <div className="xs muted">
              {f.mata === "SAR" ? `≈ Rp ${fmt(Number(f.jumlah) * kurs)}` : kurs > 0 ? `≈ SAR ${fmt(Number(f.jumlah) / kurs)}` : ""}
            </div>
          )}
          <select className="input" value={f.kategori} onChange={(e) => setF({ ...f, kategori: e.target.value })}>
            {EXPENSE_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
          </select>
          <input className="input" type="date" value={f.tanggal} onChange={(e) => setF({ ...f, tanggal: e.target.value })} />
          <div className="row">
            <button className="btn block" onClick={submit}>{editId ? "Simpan Perubahan" : "Tambah"}</button>
            {editId && <button className="btn ghost" onClick={() => { setEditId(null); setF(empty); }}>Batal</button>}
          </div>
        </div>
      </Card>

      {entries.length > 0 && (
        <div className="scroll-x">
          <button className={`chip ${filter === "semua" ? "on" : ""}`} onClick={() => setFilter("semua")}>Semua</button>
          {catTotals.map((c) => (
            <button key={c.id} className={`chip ${filter === c.id ? "on" : ""}`} onClick={() => setFilter(c.id)}>{c.icon} {c.count}</button>
          ))}
        </div>
      )}

      {filter !== "semua" && filtered.length > 0 && (
        <div className="small">
          {catOf(filter).icon} {catOf(filter).label}: <b>Rp {fmt(filtered.reduce((a, e) => a + e.jumlah, 0))}</b> ({filtered.length} item)
        </div>
      )}

      {filtered.length > 0 ? (
        <Card>
          <div className="card-title">Riwayat Pengeluaran</div>
          {[...filtered].reverse().map((e) => (
            <div key={e.id} className="list-row">
              <span style={{ fontSize: 20 }}>{catOf(e.kategori).icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="small" style={{ fontWeight: 600 }}>{e.nama}</div>
                <div className="xs muted">
                  {catOf(e.kategori).label} · {new Date(e.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="small" style={{ fontWeight: 700, color: "var(--red)" }}>-Rp {fmt(e.jumlah)}</div>
                {e.mataUang === "SAR" && <div className="xs muted">SAR {fmt(e.jumlahAsli)}</div>}
                <div className="row" style={{ gap: 6, marginTop: 4, justifyContent: "flex-end" }}>
                  <button className="btn sm ghost" onClick={() => startEdit(e)}>Edit</button>
                  <button className="btn sm ghost" onClick={() => del(e.id)} aria-label="Hapus">🗑</button>
                </div>
              </div>
            </div>
          ))}
        </Card>
      ) : (
        entries.length === 0 && (
          <div className="empty"><div className="e">🧾</div>Belum ada pengeluaran tercatat.<br />Mulai catat pengeluaran umroh kamu di atas.</div>
        )
      )}
    </SubPage>
  );
}
