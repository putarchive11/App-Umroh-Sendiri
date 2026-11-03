import { useState } from "react";
import { Card, SubPage, Badge, CheckBox, Icon } from "../ui";
import { usePersisted } from "../hooks";

export function CatatanPribadi({ onBack }) {
  const [notes, setNotes] = usePersisted("catatan", []);
  const [text, setText] = useState("");
  const add = () => {
    if (!text.trim()) return;
    setNotes([{ id: Date.now(), text: text.trim(), date: new Date().toISOString() }, ...notes]);
    setText("");
  };
  return (
    <SubPage title="Catatan & Doa Pribadi" onBack={onBack}>
      <Card>
        <textarea className="input" rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="Tulis catatan, doa, atau refleksi kamu..." style={{ resize: "vertical" }} />
        <button className="btn block" style={{ marginTop: 10 }} onClick={add}>Simpan Catatan</button>
      </Card>
      {notes.length === 0 && <div className="empty"><div className="e">📓</div>Belum ada catatan. Mulai tulis catatan atau doa pribadimu.</div>}
      {notes.map((n) => (
        <Card key={n.id}>
          <div className="between">
            <div className="xs muted">
              {new Date(n.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </div>
            <button className="icon-btn" onClick={() => setNotes(notes.filter((x) => x.id !== n.id))} aria-label="Hapus">×</button>
          </div>
          <p className="small" style={{ whiteSpace: "pre-wrap", marginTop: 6 }}>{n.text}</p>
        </Card>
      ))}
    </SubPage>
  );
}

export function OlehOlehList({ onBack }) {
  const [items, setItems] = usePersisted("oleholeh-data", []);
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");
  const bought = items.filter((i) => i.bought).length;
  const add = () => {
    if (!name.trim()) return;
    setItems([...items, { id: Date.now(), name: name.trim(), qty: qty || "1", note, bought: false }]);
    setName(""); setQty(""); setNote("");
  };
  return (
    <SubPage title="Daftar Oleh-Oleh" onBack={onBack}
      right={items.length > 0 ? <Badge green={bought === items.length}>{bought}/{items.length}</Badge> : null}>
      <Card>
        <div className="card-title">🎁 Tambah Oleh-oleh</div>
        <div className="stack">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama oleh-oleh (contoh: Kurma Ajwa)" />
          <div className="row">
            <input className="input" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Jumlah (mis: 3 kg)" />
            <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Catatan (opsional)" />
          </div>
          <button className="btn" onClick={add}>+ Tambah Oleh-oleh</button>
        </div>
      </Card>
      {items.length === 0 ? (
        <div className="empty"><div className="e">🎁</div>Belum ada daftar oleh-oleh. Tambahkan barang yang ingin dibeli.</div>
      ) : (
        <Card>
          {items.map((it) => (
            <div key={it.id} className="list-row">
              <button className="check-row" style={{ flex: 1, padding: 0 }} onClick={() => setItems(items.map((x) => (x.id === it.id ? { ...x, bought: !x.bought } : x)))}>
                <CheckBox on={it.bought} />
                <div>
                  <div className={it.bought ? "done" : ""} style={{ fontWeight: 600 }}>{it.name}</div>
                  <div className="xs muted">{[it.qty && `Jumlah: ${it.qty}`, it.note].filter(Boolean).join(" · ")}</div>
                </div>
              </button>
              <button className="icon-btn" onClick={() => setItems(items.filter((x) => x.id !== it.id))} aria-label="Hapus">{Icon.trash}</button>
            </div>
          ))}
        </Card>
      )}
    </SubPage>
  );
}
