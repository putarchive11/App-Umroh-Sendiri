import { useEffect, useMemo, useState } from "react";
import { Card, SubPage, Badge, Progress, CheckBox, Icon } from "../ui";
import { usePersisted } from "../hooks";
import { TIMELINE_PREP, PRODUK } from "../data";

// ─── Checklist (dokumen / barang) ───
export function ChecklistView({ title, data, storageKey, allowCustom, onBack }) {
  const [checked, setChecked] = usePersisted(storageKey, {});
  const [custom, setCustom] = usePersisted(`${storageKey}-custom`, {});
  const [addingTo, setAddingTo] = useState(null);
  const [text, setText] = useState("");

  const itemsOf = (c) => [...c.items, ...(allowCustom ? custom[c.cat] || [] : [])];
  const all = data.flatMap((c) => itemsOf(c).map((i) => `${c.cat}-${i}`));
  const count = all.filter((k) => checked[k]).length;
  const pct = all.length ? Math.round((count / all.length) * 100) : 0;

  const add = (cat) => {
    const t = text.trim();
    if (!t) return;
    setCustom({ ...custom, [cat]: [...(custom[cat] || []), t] });
    setText(""); setAddingTo(null);
  };
  const remove = (cat, idx) => {
    const list = [...(custom[cat] || [])];
    const [item] = list.splice(idx, 1);
    const next = { ...custom, [cat]: list };
    if (!list.length) delete next[cat];
    setCustom(next);
    const nc = { ...checked };
    delete nc[`${cat}-${item}`];
    setChecked(nc);
  };

  return (
    <SubPage title={title} onBack={onBack} right={<Badge green={pct === 100}>{pct}%</Badge>}>
      <div>
        <Progress pct={pct} />
        <div className="xs muted" style={{ marginTop: 6 }}>{count} dari {all.length} item selesai</div>
      </div>
      {data.map((c) => {
        const items = itemsOf(c);
        return (
          <Card key={c.cat}>
            <div className="between">
              <div className="card-title" style={{ marginBottom: 0 }}>{c.cat}</div>
              {allowCustom && (
                <button className="btn sm ghost" onClick={() => { setAddingTo(addingTo === c.cat ? null : c.cat); setText(""); }}>+ Tambah</button>
              )}
            </div>
            {addingTo === c.cat && (
              <div className="row" style={{ marginTop: 10 }}>
                <input className="input" autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="Nama item baru..."
                  onKeyDown={(e) => e.key === "Enter" && add(c.cat)} />
                <button className="btn" onClick={() => add(c.cat)}>+</button>
              </div>
            )}
            <div style={{ marginTop: 6 }}>
              {items.map((item, i) => {
                const k = `${c.cat}-${item}`;
                const isCustom = allowCustom && i >= c.items.length;
                return (
                  <div key={k + i} className="row">
                    <button className="check-row" onClick={() => setChecked({ ...checked, [k]: !checked[k] })}>
                      <CheckBox on={checked[k]} />
                      <span className={checked[k] ? "done" : ""}>{item}</span>
                    </button>
                    {isCustom && (
                      <button className="icon-btn" onClick={() => remove(c.cat, i - c.items.length)} aria-label="Hapus">{Icon.trash}</button>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}
      <button className="btn ghost" onClick={() => setChecked({})}>Reset Semua Checklist</button>
    </SubPage>
  );
}

// ─── Timeline Persiapan ───
export function TimelineView({ onBack }) {
  const [done, setDone] = usePersisted("timeline-done", {});
  return (
    <SubPage title="Timeline Persiapan" onBack={onBack}>
      {TIMELINE_PREP.map((tp) => (
        <Card key={tp.period}>
          <Badge>{tp.period}</Badge>
          <div style={{ marginTop: 6 }}>
            {tp.tasks.map((t) => {
              const k = `${tp.period}-${t}`;
              return (
                <button key={k} className="check-row" onClick={() => setDone({ ...done, [k]: !done[k] })}>
                  <CheckBox on={done[k]} />
                  <span className={done[k] ? "done" : ""}>{t}</span>
                </button>
              );
            })}
          </div>
        </Card>
      ))}
    </SubPage>
  );
}

// ─── Itinerary ───
export function ItineraryPlanner({ onBack }) {
  const [items, setItems] = usePersisted("itinerary-data", []);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const NONE = "Belum dijadwalkan";

  const add = () => {
    if (!name.trim()) return;
    setItems([...items, { id: Date.now(), name: name.trim(), date: date || null, time: time || null }]);
    setName(""); setTime("");
  };
  const groups = items.reduce((acc, it) => {
    const k = it.date || NONE;
    (acc[k] = acc[k] || []).push(it);
    return acc;
  }, {});
  const keys = Object.keys(groups).sort((a, b) => (a === NONE ? 1 : b === NONE ? -1 : a.localeCompare(b)));
  const label = (d) => (d === NONE ? d : new Date(d + "T00:00:00").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));

  return (
    <SubPage title="Itinerary Perjalanan" onBack={onBack}>
      <Card>
        <div className="card-title">Tambah Kegiatan</div>
        <div className="stack">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Tawaf Qudum, Check-in Hotel..." />
          <div className="row">
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          <button className="btn" onClick={add}>+ Tambah Kegiatan</button>
        </div>
      </Card>
      {items.length === 0 && <div className="empty"><div className="e">🗓</div>Belum ada jadwal. Mulai susun itinerary perjalanan umroh kamu.</div>}
      {keys.map((k) => (
        <div key={k} className="stack">
          <div className="section-label">📅 {label(k)}</div>
          {groups[k].sort((a, b) => (a.time || "").localeCompare(b.time || "")).map((it) => (
            <Card key={it.id} className="row" style={{ padding: 12 }}>
              {it.time && <Badge>{it.time}</Badge>}
              <div className="small" style={{ flex: 1, fontWeight: 600 }}>{it.name}</div>
              <button className="icon-btn" onClick={() => setItems(items.filter((x) => x.id !== it.id))} aria-label="Hapus">×</button>
            </Card>
          ))}
        </div>
      ))}
    </SubPage>
  );
}

// ─── Arah Kiblat ───
const KAABA = { lat: 21.4225, lng: 39.8262 };

export function ArahKiblat({ onBack }) {
  const [loc, setLoc] = useState(null);
  const [err, setErr] = useState(null);
  const [heading, setHeading] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) { setErr("Geolocation tidak didukung di browser ini"); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => setLoc({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setErr("Aktifkan lokasi untuk menentukan arah kiblat"),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, []);

  useEffect(() => {
    const h = (e) => {
      const hd = e.webkitCompassHeading ?? (e.alpha != null ? 360 - e.alpha : null);
      if (hd != null) setHeading(hd);
    };
    window.addEventListener("deviceorientationabsolute", h);
    window.addEventListener("deviceorientation", h);
    return () => {
      window.removeEventListener("deviceorientationabsolute", h);
      window.removeEventListener("deviceorientation", h);
    };
  }, []);

  const qibla = useMemo(() => {
    if (!loc) return 0;
    const r = Math.PI / 180;
    const dLng = (KAABA.lng - loc.lng) * r;
    const x = Math.sin(dLng) * Math.cos(KAABA.lat * r);
    const y = Math.cos(loc.lat * r) * Math.sin(KAABA.lat * r) - Math.sin(loc.lat * r) * Math.cos(KAABA.lat * r) * Math.cos(dLng);
    return ((Math.atan2(x, y) / r) + 360) % 360;
  }, [loc]);

  const enableCompass = async () => {
    try {
      if (typeof DeviceOrientationEvent !== "undefined" && DeviceOrientationEvent.requestPermission) {
        await DeviceOrientationEvent.requestPermission();
      }
    } catch { /* izin ditolak */ }
  };

  const rotate = heading != null ? qibla - heading : qibla;

  return (
    <SubPage title="Arah Kiblat" onBack={onBack}>
      {err ? (
        <Card style={{ textAlign: "center" }}><div style={{ fontSize: 32 }}>📍</div><p className="small muted">{err}</p></Card>
      ) : (
        <>
          <Card style={{ textAlign: "center" }}>
            <div className="card-title">Arah Kiblat dari Lokasimu</div>
            <div className="compass" style={{ transform: heading != null ? `rotate(${-heading}deg)` : "none" }}>
              <span className="dir" style={{ top: 8, left: "50%", transform: "translateX(-50%)" }}>U</span>
              <span className="dir" style={{ bottom: 8, left: "50%", transform: "translateX(-50%)" }}>S</span>
              <span className="dir" style={{ right: 10, top: "50%", transform: "translateY(-50%)" }}>T</span>
              <span className="dir" style={{ left: 10, top: "50%", transform: "translateY(-50%)" }}>B</span>
              <div className="needle" style={{ transform: `rotate(${qibla}deg)` }}><span className="kaaba" style={{ transform: `translateX(-50%) rotate(${-qibla}deg)` }}>🕋</span></div>
            </div>
            <div className="big-num">{loc ? `${Math.round(qibla)}°` : "…"}</div>
            <div className="xs muted">dari arah Utara (searah jarum jam)</div>
            {heading == null && (
              <button className="btn sm ghost" style={{ marginTop: 10 }} onClick={enableCompass}>Aktifkan kompas HP</button>
            )}
            {heading != null && <div className="tip">Putar badan sampai ikon 🕋 berada tepat di atas. Arah relatif: {Math.round(((rotate % 360) + 360) % 360)}°</div>}
          </Card>
          {loc && (
            <Card className="small">
              <div>📍 Lokasimu: {loc.lat.toFixed(4)}°, {loc.lng.toFixed(4)}°</div>
              <div>🕋 Ka'bah: {KAABA.lat}°, {KAABA.lng}°</div>
            </Card>
          )}
        </>
      )}
    </SubPage>
  );
}

// ─── Rekomendasi Produk ───
export function RekomendasiProduk({ onBack }) {
  const [tab, setTab] = useState(0);
  const g = PRODUK[tab];
  return (
    <SubPage title="Rekomendasi Produk" onBack={onBack}>
      <div className="scroll-x">
        {PRODUK.map((p, i) => (
          <button key={p.kategori} className={`chip ${i === tab ? "on" : ""}`} onClick={() => setTab(i)}>{p.icon} {p.kategori}</button>
        ))}
      </div>
      <div className="tip" style={{ marginTop: 0 }}>🛒 Link mengarah ke Shopee. Harga & stok bisa berubah sewaktu-waktu.</div>
      <div className="grid2">
        {g.items.map((it) => (
          <Card key={it.url} className="product">
            <div className="ic">{it.icon}</div>
            <div className="n">{it.name}</div>
            <a href={it.url} target="_blank" rel="noopener noreferrer">Lihat di Shopee →</a>
          </Card>
        ))}
      </div>
      <div className="xs muted" style={{ textAlign: "center" }}>{g.items.length} produk di kategori ini</div>
    </SubPage>
  );
}
