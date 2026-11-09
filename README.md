# Umroh Sendiri

Aplikasi web (PWA) panduan **umroh mandiri**: panduan ibadah lengkap dengan doa berharokat (khat Utsman Taha), checklist persiapan, kalkulator biaya, konversi SAR ↔ IDR, pencatat pengeluaran, arah kiblat, dan lainnya.

Dibuat dengan **React + Vite**. Semua data pengguna disimpan di perangkat (localStorage) — tanpa server, tanpa database.

## Fitur

| Menu | Isi |
|---|---|
| **Beranda** | Akses cepat, panduan ibadah, kontak layanan (transport, muthowif, visa) via WhatsApp |
| **Ebook** | *Segera hadir* (masih kosong) |
| **Persiapan** | Checklist dokumen & barang, timeline H-6 bulan s/d H-1, itinerary, kalkulator biaya, kalkulator nabung, konversi SAR, catatan pengeluaran, arah kiblat, rekomendasi produk |
| **Ibadah** | Miqat & niat ihram, talbiyah, tawaf (doa 7 putaran, Rukun Yamani, Maqam Ibrahim, salat 2 rakaat), sa'i + penghitung lintasan, tahallul, doa Zamzam, doa keluar masjid |
| **Saya** | Catatan & doa pribadi, progress nabung, pengeluaran, daftar oleh-oleh |

## Menjalankan di komputer

```bash
npm install
npm run dev      # buka http://localhost:5173
npm run build    # hasil di folder dist/
```

## Deploy ke Vercel

1. Buka [vercel.com/new](https://vercel.com/new) → **Import Git Repository** → pilih repo ini.
2. Vercel otomatis mendeteksi **Vite**. Biarkan pengaturan bawaan:
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Klik **Deploy**. Setiap `git push` ke branch `main` akan otomatis ter-deploy ulang.

## Mengubah konten

- **Nomor WhatsApp (`NOMOR_WA`) & pesan layanan, nama aplikasi, kurs default** → `src/config.js`
- **Doa, checklist, timeline, kategori pengeluaran, link produk** → `src/data.js`
- **Ebook** → halaman `EbookPage` di `src/App.jsx` (sekarang berisi "Segera Hadir")
- **Warna & tampilan** → `src/styles.css` (variabel di bagian `:root`)

## Font Arab

Teks Arab memakai **KFGQPC Uthmanic Script HAFS** (khat Utsman Taha, mushaf Madinah) yang dimuat dari CDN jsDelivr, dengan cadangan *Amiri Quran* dari Google Fonts. Semua teks Arab ditulis lengkap dengan harokat dan ditampilkan kanan-ke-kiri (`dir="rtl"`).

## Kode aktivasi (lisensi)

Aplikasi terkunci sampai pembeli memasukkan kode aktivasi. Pengecekan kode dilakukan di server (`api/aktivasi.js`), daftar kode disimpan di Upstash Redis dan tidak pernah dikirim ke browser.

- Admin membuat kode di `https://<alamat-aplikasi>/#admin`.
- Satu kode untuk maksimal 2 perangkat (atur dengan env `MAX_PERANGKAT`).
- Setelah aktif, aplikasi tetap bisa dibuka offline. Saat online, aplikasi mengecek ulang diam-diam; kode yang dicabut akan mengunci aplikasi.

Variabel lingkungan di Vercel:

| Nama | Isi |
|---|---|
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Otomatis terisi saat Upstash Redis dihubungkan lewat menu Storage |
| `ADMIN_PASSWORD` | Kata sandi halaman admin |
| `MAX_PERANGKAT` | (opsional) batas perangkat per kode, bawaan 2 |
