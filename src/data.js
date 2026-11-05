// ─────────────────────────────────────────────────────────────
// KONTEN: doa, checklist, timeline, kategori, produk
// ─────────────────────────────────────────────────────────────

// ── Sumber audio ─────────────────────────────────────────────
// Al-Qur'an : everyayah.com — Syaikh Mishary Rasyid Alafasy, per ayat
// Doa/dzikir: hisnmuslim.com — rekaman resmi kitab Hisnul Muslim (per bab)
// Rekaman sendiri: taruh file di public/audio/ lalu isi src: "/audio/nama.mp3"
const ayat = (surah, ...ayahs) =>
  ayahs.map((a) => `https://everyayah.com/data/Alafasy_128kbps/${String(surah).padStart(3, "0")}${String(a).padStart(3, "0")}.mp3`);
const QARI = "Mishary Alafasy";
const quran = (label, surah, ...ayahs) => ({ src: ayat(surah, ...ayahs), label: `${label} · ${QARI}` });
const hisn = (file, label) => ({
  src: [`https://www.hisnmuslim.com/audio/ar/ar_7esn_AlMoslem_by_Doors_${file}.mp3`],
  label: `Hisnul Muslim · ${label}`,
});
const BASMALAH = 1; // ayat 1:1, diputar sebelum surah selain Al-Fatihah

export const TAWAF_DUAS = [
  { putaran: 1, tema: "Ampunan dan taubat", doa: "رَبَّنَا ظَلَمۡنَا أَنۡفُسَنَا وَإِنۡ لَمۡ تَغۡفِرۡ لَنَا وَتَرۡحَمۡنَا لَنَكُونَنَّ مِنَ الۡخَاسِرِينَ", latin: "Rabbanaa zhalamnaa anfusanaa wa illam taghfir lanaa wa tarhamnaa lanakuunanna minal-khaasiriin", arti: "Ya Rabb kami, kami telah menzalimi diri kami sendiri. Jika Engkau tidak mengampuni dan merahmati kami, sungguh kami termasuk orang-orang yang merugi.", sumber: "QS. Al-A'raf: 23", tambahan: "Ya Allah, ampunilah dosaku yang dahulu dan sekarang, yang kusadari maupun tidak. Terimalah taubatku dan bersihkan hatiku.", audio: quran("QS. Al-A'raf: 23 (ayat lengkap)", 7, 23) },
  { putaran: 2, tema: "Keimanan dan keteguhan hati", doa: "رَبَّنَا لَا تُزِغۡ قُلُوبَنَا بَعۡدَ إِذۡ هَدَيۡتَنَا وَهَبۡ لَنَا مِنۡ لَدُنۡكَ رَحۡمَةً إِنَّكَ أَنۡتَ الۡوَهَّابُ", latin: "Rabbanaa laa tuzigh quluubanaa ba'da idz hadaitanaa wa hab lanaa mil ladunka rahmah, innaka antal-wahhaab", arti: "Ya Rabb kami, jangan Engkau condongkan hati kami kepada kesesatan setelah Engkau memberi kami petunjuk. Karuniakanlah rahmat dari sisi-Mu. Sesungguhnya Engkau Maha Pemberi.", sumber: "QS. Ali Imran: 8", tambahan: "Ya Allah, teguhkan hati kami dalam tauhid dan ketaatan. Lindungilah keluarga kami dari fitnah dan perbuatan yang menjauhkan kami dari-Mu.", audio: quran("QS. Ali Imran: 8", 3, 8) },
  { putaran: 3, tema: "Pasangan, anak dan keluarga", doa: "رَبَّنَا هَبۡ لَنَا مِنۡ أَزۡوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعۡيُنٍ وَاجۡعَلۡنَا لِلۡمُتَّقِينَ إِمَامًا", latin: "Rabbanaa hab lanaa min azwaajinaa wa dzurriyyaatinaa qurrata a'yunin waj'alnaa lil-muttaqiina imaamaa", arti: "Ya Rabb kami, anugerahkan kepada kami pasangan dan keturunan sebagai penyejuk mata, dan jadikanlah kami teladan bagi orang-orang yang bertakwa.", sumber: "QS. Al-Furqan: 74", tambahan: "Ya Allah, jagalah pasangan, anak-anak, dan kedua orang tua kami. Jadikan anak-anak kami saleh dan salehah, mencintai Al-Qur'an, dan menjaga salat.", audio: quran("QS. Al-Furqan: 74 (ayat lengkap)", 25, 74) },
  { putaran: 4, tema: "Kesehatan dan perlindungan", doa: "اَللّٰهُمَّ إِنِّي أَسۡأَلُكَ الۡعَفۡوَ وَالۡعَافِيَةَ فِي الدُّنۡيَا وَالۡآخِرَةِ", latin: "Allaahumma innii as'alukal-'afwa wal-'aafiyata fid-dunyaa wal-aakhirah", arti: "Ya Allah, sesungguhnya aku memohon ampunan dan keselamatan kepada-Mu di dunia dan akhirat.", sumber: "HR. Abu Dawud no. 5074", tambahan: "Ya Allah, berikan kesehatan dan keselamatan kepada kami sekeluarga. Lindungilah kami dari penyakit, musibah, dan segala keburukan yang tampak maupun tersembunyi." },
  { putaran: 5, tema: "Rezeki halal dan keberkahan", doa: "رَبِّ إِنِّي لِمَا أَنۡزَلۡتَ إِلَيَّ مِنۡ خَيۡرٍ فَقِيرٌ", latin: "Rabbi innii limaa anzalta ilayya min khairin faqiir", arti: "Ya Rabbku, sesungguhnya aku sangat memerlukan kebaikan apa pun yang Engkau turunkan kepadaku.", sumber: "QS. Al-Qashash: 24", tambahan: "Ya Allah, karuniakanlah rezeki yang halal dan berkah. Berkahilah usaha kami, jauhkan kami dari riba dan kezaliman, dan jadikan harta sarana untuk taat kepada-Mu.", audio: quran("QS. Al-Qashash: 24 (ayat lengkap)", 28, 24) },
  { putaran: 6, tema: "Kemudahan segala urusan", doa: "رَبِّ اشۡرَحۡ لِي صَدۡرِي وَيَسِّرۡ لِي أَمۡرِي", latin: "Rabbisyrah lii shadrii, wa yassir lii amrii", arti: "Ya Rabbku, lapangkanlah dadaku dan mudahkanlah urusanku.", sumber: "QS. Thaha: 25-26", tambahan: "Ya Allah, mudahkanlah ibadah, pekerjaan, keluarga dan semua tanggung jawab kami. Bimbinglah kami memilih yang terbaik dan menjadi hamba yang bersyukur.", audio: quran("QS. Thaha: 25-26 (ayat lengkap)", 20, 25, 26) },
  { putaran: 7, tema: "Surga dan perlindungan dari neraka", doa: "اَللّٰهُمَّ إِنِّي أَسۡأَلُكَ الۡجَنَّةَ وَأَعُوذُ بِكَ مِنَ النَّارِ", latin: "Allaahumma innii as'alukal-jannata wa a'uudzu bika minan-naar", arti: "Ya Allah, aku memohon surga kepada-Mu dan berlindung kepada-Mu dari neraka.", sumber: "HR. Abu Dawud no. 792", tambahan: "Ya Allah, terimalah umrah kami, ampunilah kedua orang tua kami, berikan akhir kehidupan yang baik, dan kumpulkan keluarga kami di surga Firdaus." },
];

export const DOA_MASUK_MASJID = {
  doa: "بِسۡمِ اللّٰهِ وَالصَّلَاةُ وَالسَّلَامُ عَلَى رَسُولِ اللّٰهِ اَللّٰهُمَّ افۡتَحۡ لِي أَبۡوَابَ رَحۡمَتِكَ",
  latin: "Bismillāh, waṣ-ṣalātu was-salāmu 'alā Rasūlillāh, Allāhumma iftaḥ lī abwāba raḥmatik.",
  arti: "Dengan nama Allah, shalawat dan salam atas Rasulullah. Ya Allah, bukakanlah untukku pintu-pintu rahmat-Mu.", audio: hisn("014", "bab doa masuk masjid") };

export const DOA_KELUAR_MASJID = {
  doa: "بِسۡمِ اللّٰهِ وَالصَّلَاةُ وَالسَّلَامُ عَلَى رَسُولِ اللّٰهِ اَللّٰهُمَّ إِنِّي أَسۡأَلُكَ مِنۡ فَضۡلِكَ",
  latin: "Bismillāh, waṣ-ṣalātu was-salāmu 'alā Rasūlillāh, Allāhumma innī as'aluka min faḍlik",
  arti: "Dengan nama Allah, shalawat dan salam atas Rasulullah. Ya Allah, aku memohon karunia-Mu.", audio: hisn("015", "bab doa keluar masjid") };

export const TAKBIR = { doa: "اَللّٰهُ أَكۡبَرُ", latin: "Allahu Akbar", arti: "Allah Maha Besar", audio: hisn("117", "takbir di Hajar Aswad") };

export const DOA_RUKUN_YAMANI = {
  doa: "رَبَّنَا آتِنَا فِي الدُّنۡيَا حَسَنَةً وَفِي الۡآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
  latin: "Rabbanaa aatinaa fid-dunyaa hasanah, wa fil-aakhirati hasanah, wa qinaa 'adzaaban-naar",
  arti: "Ya Rabb kami, berilah kami kebaikan di dunia dan kebaikan di akhirat, serta lindungilah kami dari azab neraka.",
  sumber: "QS. Al-Baqarah: 201; HR. Abu Dawud no. 1892", audio: hisn("118", "antara Rukun Yamani & Hajar Aswad") };

export const DOA_MENUJU_MAQAM = {
  doa: "وَاتَّخِذُوا مِنۡ مَقَامِ إِبۡرَاهِيمَ مُصَلًّى",
  latin: "Wattakhidzuu mim maqaami Ibraahiima mushallaa",
  arti: "Dan jadikanlah sebagian Maqam Ibrahim sebagai tempat salat.",
  sumber: "QS. Al-Baqarah: 125; HR. Muslim no. 1218", audio: quran("QS. Al-Baqarah: 125 (ayat lengkap)", 2, 125) };

export const SALAT_TAWAF = {
  fatihah: { judul: "Surah Al-Fatihah (dibaca pada kedua rakaat)", doa: "بِسۡمِ اللَّهِ الرَّحۡمٰنِ الرَّحِيمِ ۝ الۡحَمۡدُ لِلَّهِ رَبِّ الۡعَالَمِينَ ۝ الرَّحۡمٰنِ الرَّحِيمِ ۝ مَالِكِ يَوۡمِ الدِّينِ ۝ إِيَّاكَ نَعۡبُدُ وَإِيَّاكَ نَسۡتَعِينُ ۝ اهۡدِنَا الصِّرَاطَ الۡمُسۡتَقِيمَ ۝ صِرَاطَ الَّذِينَ أَنۡعَمۡتَ عَلَيۡهِمۡ غَيۡرِ الۡمَغۡضُوبِ عَلَيۡهِمۡ وَلَا الضَّالِّينَ", latin: "Bismillaahir-rahmaanir-rahiim. Alhamdu lillaahi rabbil-'aalamiin. Ar-rahmaanir-rahiim. Maaliki yaumid-diin. Iyyaaka na'budu wa iyyaaka nasta'iin. Ihdinash-shiraathal-mustaqiim. Shiraathal-ladziina an'amta 'alaihim, ghairil-maghdhuubi 'alaihim wa ladh-dhaalliin.", arti: "Dengan nama Allah Yang Maha Pengasih, Maha Penyayang. Segala puji bagi Allah, Tuhan seluruh alam; Yang Maha Pengasih, Maha Penyayang; Pemilik hari pembalasan. Hanya kepada-Mu kami menyembah dan hanya kepada-Mu kami memohon pertolongan. Tunjukilah kami jalan yang lurus; jalan orang-orang yang Engkau beri nikmat, bukan jalan mereka yang dimurkai dan bukan pula jalan mereka yang sesat.", sumber: "QS. Al-Fatihah: 1-7", audio: quran("QS. Al-Fatihah: 1-7", 1, 1, 2, 3, 4, 5, 6, 7) },
  kafirun: { judul: "Rakaat 1: Surah Al-Kafirun", doa: "بِسۡمِ اللَّهِ الرَّحۡمٰنِ الرَّحِيمِ ۝ قُلۡ يَا أَيُّهَا الۡكَافِرُونَ ۝ لَا أَعۡبُدُ مَا تَعۡبُدُونَ ۝ وَلَا أَنۡتُمۡ عَابِدُونَ مَا أَعۡبُدُ ۝ وَلَا أَنَا عَابِدٌ مَا عَبَدۡتُمۡ ۝ وَلَا أَنۡتُمۡ عَابِدُونَ مَا أَعۡبُدُ ۝ لَكُمۡ دِينُكُمۡ وَلِيَ دِينِ", latin: "Bismillaahir-rahmaanir-rahiim. Qul yaa ayyuhal-kaafiruun. Laa a'budu maa ta'buduun. Wa laa antum 'aabiduuna maa a'bud. Wa laa ana 'aabidun maa 'abadtum. Wa laa antum 'aabiduuna maa a'bud. Lakum diinukum wa liya diin.", arti: "Katakanlah: Wahai orang-orang kafir! Aku tidak akan menyembah apa yang kamu sembah. Kamu bukan penyembah apa yang aku sembah. Aku tidak pernah menjadi penyembah apa yang kamu sembah. Kamu tidak pernah menjadi penyembah apa yang aku sembah. Untukmu agamamu, dan untukku agamaku.", sumber: "QS. Al-Kafirun: 1-6", audio: { src: [...ayat(1, BASMALAH), ...ayat(109, 1, 2, 3, 4, 5, 6)], label: `QS. Al-Kafirun · ${QARI}` } },
  ikhlas: { judul: "Rakaat 2: Surah Al-Ikhlas", doa: "بِسۡمِ اللَّهِ الرَّحۡمٰنِ الرَّحِيمِ ۝ قُلۡ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمۡ يَلِدۡ وَلَمۡ يُولَدۡ ۝ وَلَمۡ يَكُنۡ لَهُ كُفُوًا أَحَدٌ", latin: "Bismillaahir-rahmaanir-rahiim. Qul huwallahu ahad. Allaahush-shamad. Lam yalid wa lam yuulad. Wa lam yakul lahuu kufuwan ahad.", arti: "Katakanlah: Dialah Allah Yang Maha Esa. Allah tempat meminta segala sesuatu. Dia tidak beranak dan tidak pula diperanakkan. Tidak ada sesuatu yang setara dengan-Nya.", sumber: "QS. Al-Ikhlas: 1-4", audio: { src: [...ayat(1, BASMALAH), ...ayat(112, 1, 2, 3, 4)], label: `QS. Al-Ikhlas · ${QARI}` } },
  doaSetelahSalat: { doa: "رَبَّنَا تَقَبَّلۡ مِنَّا إِنَّكَ أَنۡتَ السَّمِيعُ الۡعَلِيمُ", latin: "Rabbanaa taqabbal minnaa innaka antas-samii'ul-'aliim", arti: "Ya Rabb kami, terimalah amal dari kami. Sesungguhnya Engkaulah Yang Maha Mendengar, Yang Maha Mengetahui.", sumber: "QS. Al-Baqarah: 127", audio: quran("QS. Al-Baqarah: 127 (ayat lengkap)", 2, 127) },
};

export const SAI_STEPS = [
  { step: "1. Menuju Bukit Shafa", doa: "إِنَّ الصَّفَا وَالۡمَرۡوَةَ مِنۡ شَعَائِرِ اللّٰهِ", latin: "Innaṣ-ṣafā wal-marwata min sya'ā'irillāh", arti: "Sesungguhnya Shafa dan Marwah adalah sebagian dari syi'ar Allah.", sumber: "QS. Al-Baqarah: 158", detail: "Dibaca saat pertama kali mendekati Bukit Shafa, sebagai pembuka sa'i. Bacaan ini hanya dibaca sekali di awal.", audio: quran("QS. Al-Baqarah: 158 (ayat lengkap)", 2, 158) },
  { step: "2. Dzikir di Shafa & Marwah", doa: "لَا إِلٰهَ إِلَّا اللّٰهُ وَحۡدَهُ لَا شَرِيكَ لَهُ لَهُ الۡمُلۡكُ وَلَهُ الۡحَمۡدُ يُحۡيِي وَيُمِيتُ وَهُوَ عَلَى كُلِّ شَيۡءٍ قَدِيرٌ", latin: "Lā ilāha illallāhu waḥdahū lā syarīka lah, lahul mulku walahul ḥamdu, yuḥyī wa yumītu, wa huwa 'alā kulli syai'in qadīr", arti: "Tiada Tuhan selain Allah semata, tidak ada sekutu bagi-Nya. Milik-Nya kerajaan dan segala puji. Dia menghidupkan dan mematikan, dan Dia Maha Kuasa atas segala sesuatu.", sumber: "HR. Muslim", detail: "Menghadap Ka'bah, angkat tangan, baca dzikir ini 3 kali diselingi doa pribadi. Ulangi setiap kali sampai di Shafa maupun Marwah.", audio: hisn("119", "bacaan di Shafa & Marwah (lengkap)") },
  { step: "3. Doa Sepanjang Perjalanan", doa: "رَبِّ اغۡفِرۡ وَارۡحَمۡ إِنَّكَ أَنۡتَ الۡأَعَزُّ الۡأَكۡرَمُ", latin: "Rabbighfir warḥam innaka antal a'azzul akram", arti: "Ya Tuhanku, ampunilah dan rahmatilah. Sesungguhnya Engkau Maha Mulia dan Maha Pemurah.", sumber: "", detail: "Boleh berdoa bebas, berzikir, atau membaca Al-Qur'an di sepanjang perjalanan antara Shafa dan Marwah. Pria berlari kecil di area lampu hijau." },
  { step: "4. Setelah Sa'i Selesai", doa: "رَبَّنَا تَقَبَّلۡ مِنَّا إِنَّكَ أَنۡتَ السَّمِيعُ الۡعَلِيمُ", latin: "Rabbanā taqabbal minnā innaka antas-samī'ul 'alīm", arti: "Ya Tuhan kami, terimalah dari kami, sesungguhnya Engkau Maha Mendengar lagi Maha Mengetahui.", sumber: "QS. Al-Baqarah: 127", detail: "Dibaca setelah selesai lintasan ke-7 di Marwah. Lanjutkan dengan tahallul (cukur/potong rambut).", audio: quran("QS. Al-Baqarah: 127 (ayat lengkap)", 2, 127) },
];

export const NIAT_UMRAH = {
  doa: "لَبَّيۡكَ اللّٰهُمَّ عُمۡرَةً",
  latin: "Labbaika Allāhumma 'umratan",
  arti: "Aku penuhi panggilan-Mu, ya Allah, untuk melaksanakan umrah.",
};

export const TALBIYAH = {
  doa: "لَبَّيۡكَ اللَّهُمَّ لَبَّيۡكَ لَبَّيۡكَ لَا شَرِيكَ لَكَ لَبَّيۡكَ إِنَّ الۡحَمۡدَ وَالنِّعۡمَةَ لَكَ وَالۡمُلۡكَ لَا شَرِيكَ لَكَ",
  latin: "Labbaikallahumma labbaik, labbaika laa syarīka laka labbaik. Innal ḥamda wan ni'mata laka wal mulk, laa syarīka lak.",
  arti: "Aku datang memenuhi panggilan-Mu, ya Allah, tiada sekutu bagi-Mu. Segala puji, nikmat, dan kekuasaan hanya milik-Mu.", audio: hisn("116", "talbiyah") };

export const LANGKAH_IHRAM = [
  "Mandi besar (niat ihram), wudhu, potong kuku",
  "Pria: kain ihram putih (tanpa pakaian dalam). Wanita: pakaian syar'i longgar",
  "Shalat sunnah 2 rakaat (niat safar/ihram)",
  "Niat umrah setelah shalat",
];

export const DOA_TAHALLUL = {
  doa: "اَللّٰهُمَّ تَقَبَّلۡ مِنِّي",
  latin: "Allāhumma taqabbal minnī",
  arti: "Ya Allah, terimalah (ibadah) dariku.",
};

export const DOA_ZAMZAM = {
  doa: "اَللّٰهُمَّ إِنِّي أَسۡأَلُكَ عِلۡمًا نَافِعًا وَرِزۡقًا وَاسِعًا وَشِفَاءً مِنۡ كُلِّ دَاءٍ",
  latin: "Allāhumma innī as'aluka 'ilman nāfi'an, wa rizqan wāsi'an, wa syifā'an min kulli dā'",
  arti: "Ya Allah, aku memohon ilmu yang bermanfaat, rezeki yang luas, dan kesembuhan dari segala penyakit.",
};

export const CHECKLIST_DOKUMEN = [
  { cat: "Dokumen Wajib", items: ["Paspor (masa berlaku >6 bulan)", "Visa umrah digital", "Tiket pesawat (e-ticket)", "Bukti booking hotel (PDF/screenshot)", "Buku kuning vaksin meningitis & polio", "Surat nikah (kalau bawa istri)", "Akte lahir anak (kalau bawa anak)", "Kartu keluarga (KK)", "KTP"] },
  { cat: "Keuangan", items: ["Kartu debit VISA (Jago/Jenius)", "Uang cash Riyal (SAR)", "Cadangan darurat 500-1000 SAR"] },
  { cat: "Booking & Transport", items: ["Konfirmasi hotel Madinah", "Konfirmasi hotel Makkah", "Booking transport bandara-hotel", "Tafweej (ijin kendaraan)", "Kontak driver WhatsApp"] },
];

export const CHECKLIST_BARANG = [
  { cat: "Pakaian & Ibadah", items: ["Kain ihram (pria)", "Mukena (wanita)", "Gamis / jubah", "Baju koko & celana longgar", "Sandal jepit nyaman", "Kaos kaki", "Pakaian tidur", "Sajadah travel"] },
  { cat: "Perlengkapan Mandi & Kesehatan", items: ["Mesin cukur", "Sabun & sampo travel", "Sunblock", "Lip balm / pelembab bibir", "Tisu basah & kering", "Masker cadangan", "Vitamin harian", "Obat pribadi (paracetamol, obat flu, dll)"] },
  { cat: "Elektronik", items: ["Power bank", "Travel adaptor universal (kaki tiga)", "Charger HP", "Kabel USB cadangan"] },
  { cat: "Masak & Hemat", items: ["Rice cooker mini (opsional)", "Bumbu instan vacuum", "Mie instan / makanan kering", "Alat laundry portable (opsional)"] },
  { cat: "Koper & Tas", items: ["Koper besar 32 inci", "Koper kabin 21 inci", "Tas selempang kecil (dokumen + HP)", "Tas dokumen khusus", "Gembok TSA", "Kantong sandal", "Payung kecil", "Kacamata hitam"] },
];

export const TIMELINE_PREP = [
  { period: "H-6 Bulan", tasks: ["Urus paspor baru / perpanjang", "Vaksin meningitis & polio", "Riset waktu terbaik berangkat", "Mulai nabung intensif"] },
  { period: "H-4 Bulan", tasks: ["Cari & booking tiket pesawat", "Pilih rute: Madinah dulu atau Makkah dulu", "Mulai bandingkan harga hotel"] },
  { period: "H-3 Bulan", tasks: ["Booking hotel Madinah & Makkah", "Pastikan hotel terdaftar di Nusuk", "Booking transport (HHR/sewa mobil)"] },
  { period: "H-2 Bulan", tasks: ["Urus visa umrah via provider", "Upload paspor + tiket + hotel", "Aktifkan kartu debit untuk luar negeri"] },
  { period: "H-1 Bulan", tasks: ["Tukar uang Riyal (SAR)", "Beli perlengkapan yang belum ada", "Scan & simpan digital semua dokumen", "Cek berat & isi koper"] },
  { period: "H-1 Minggu", tasks: ["Konfirmasi hotel & transport", "Chat driver 3 hari sebelum (minta Tafweej)", "Isi arrival card Saudi", "Print visa, tiket, bukti hotel"] },
  { period: "H-1 Hari", tasks: ["Final packing", "Charge semua gadget", "Hubungi driver 24 jam sebelum", "Pastikan dokumen di tas selempang"] },
];

export const EXPENSE_CATEGORIES = [
  { id: "dokumen", label: "Dokumen & Visa", icon: "📄" },
  { id: "tiket", label: "Tiket Pesawat", icon: "✈️" },
  { id: "hotel", label: "Hotel", icon: "🏨" },
  { id: "transport", label: "Transportasi", icon: "🚗" },
  { id: "makan", label: "Makan & Minum", icon: "🍽" },
  { id: "belanja", label: "Belanja & Oleh-oleh", icon: "🛍" },
  { id: "ibadah", label: "Ibadah & Sumbangan", icon: "🕌" },
  { id: "lainnya", label: "Lainnya", icon: "📦" },
];

// Link pencarian Shopee berdasarkan nama barang.
// Untuk memakai link toko/afiliasi sendiri, ganti fungsi ini atau isi URL per barang.
const s = (name) => `https://shopee.co.id/search?keyword=${encodeURIComponent(name)}`;

export const PRODUK = [
  {
    kategori: "Masak & Dapur", icon: "🍳",
    items: [
      ["Panci Listrik Multifungsi", "906KRGHxvz", "🍳"], ["Rice Cooker Mini 1 Liter", "9APkdZHKb0", "🍚"], ["Teko Listrik Portable", "6q1prHQDKa", "☕"], ["Teko Listrik Silikon Lipat", "6fiPeyQqfZ", "☕"], ["Kompor Induksi Mini", "7AegFtOweg", "🔥"], ["Cooker Hood Mini Portable", "5q9IfU1zxA", "💨"], ["Panci Stainless Mini", "5fpsTB2dI9", "🍲"], ["Wajan Antilengket Mini", "5VWSGs3Gd8", "🍳"], ["Kotak Makan Stainless", "5LD24Z3ty7", "🥡"], ["Food Container Kedap Udara", "6VOzShzSbM", "📦"], ["Mangkok Silikon Lipat", "5AtbsHCrZH", "🥣"], ["Piring Portable", "1BVimWX3I", "🍽"], ["Sendok Garpu Travel Set & Pisau Mini", "BUvv5VtiL", "🍴"], ["Talenan Mini", "LoM7OVGNO", "🔪"], ["Botol Silikon Lipat", "W7mJhUd2R", "🧴"], ["Tumbler Tahan Panas", "5VWSGtXWY5", "🥤"], ["Botol Minum Anak Antitumpah", "5fpsTCWtD8", "🍼"], ["Tas Makanan Insulated", "5q9IfVWFsB", "🧊"], ["Plastik Ziplock Makanan", "60SiroVcXE", "🗜"], ["Klip Penutup Kemasan Makanan", "6Am947UzCH", "📎"], ["Sabun Cuci Piring Travel", "4fxLHMxFFw", "🧼"], ["Spons Cuci Piring Mini", "4qGlTfwbuz", "🧽"], ["Wadah Bumbu Mini", "50aBfyvya2", "🧂"], ["Termos Air Panas Mini", "5AtbsHvLF5", "🫖"],
    ],
  },
  {
    kategori: "Laundry & Pakaian", icon: "👕",
    items: [
      ["Tas Cuci Pakaian Manual", "8KqdeIQcZJ", "👕"], ["Mesin Cuci Portable Mini", "8VA3qbPzEK", "🫧"], ["Tali Jemuran Portable", "8AXDRzRFuI", "🧵"], ["Pengering Pakaian Portable Elektrik", "8fTU2uPLtL", "💨"], ["Hanger Baju Lipat dan Jepitan", "80DnFgRtFH", "🪝"], ["Gantungan Baju Lipat Travel", "3qOEI22RcP", "🪝"], ["Detergen Lembaran (Laundry Sheets)", "3LRxh74LdK", "🧴"], ["Kantong Laundry Waterproof", "3VlNtQ3iIN", "👜"], ["Laundry Mesh Bag", "30p7IV5cJI", "🧺"], ["Handuk Microfiber Cepat Kering", "3B8XUo4yyL", "🛁"], ["Setrika Uap Portable", "30p7IVTbpC", "♨️"], ["Penghilang Noda Pakaian Portable", "3B8XUoSyUF", "✨"],
    ],
  },
  {
    kategori: "Perlengkapan Ibadah", icon: "🕋",
    items: [
      ["Buku Panduan Manasik Umrah", "7Ky6Sb0Sli", "📖"], ["Buku Kumpulan Doa dan Zikir", "7VHWetzpQl", "📗"], ["Buku Doa Umrah Sesuai Sunnah", "8KqdeQwejw", "📘"], ["Al-Qur'an Mini", "8VA3qjw1Oz", "📕"], ["Al-Qur'an Terjemahan Ukuran Saku", "80DnFoxvPu", "📕"], ["Kain Ihram Pria Premium", "9pfRRCDYxU", "🕋"], ["Sabuk Ihram Pria", "9fM1EtECIT", "🪢"], ["Tas Pinggang Ihram", "9V2b2aEpdS", "👝"], ["Sandal Khusus Ihram Pria", "9KjAqHFSyR", "🩴"], ["Tas Sandal Lipat", "AUv8EQB1bg", "👜"], ["Kaos Kaki Wanita", "3VlNtYvkN9", "🧦"], ["Kaos Kaki Antiselip", "30p7IdxeO4", "🧦"], ["Mukena Travel", "3B8XUwx137", "🧕"], ["Sajadah Travel", "2gCGu1yv42", "🕌"], ["Tasbih Digital", "2qVh6KyHj5", "📿"], ["Botol Semprot Air Wudu", "3LRxhGJp7z", "💧"], ["Kompas Kiblat Mini", "3B8XUxKSSy", "🧭"], ["Manset Tangan Muslimah", "30p7IeL5nx", "👗"], ["Jubah Pria", "2qVh6LLj8w", "👔"], ["Peci Pria", "2gCGu2MMTv", "🎩"], ["Tas Selempang untuk ke Masjid", "AUv8EREXUx", "👜"],
    ],
  },
  {
    kategori: "Koper & Penerbangan", icon: "🧳",
    items: [
      ["Koper 24 Inci", "5fpsTezWIl", "🧳"], ["Koper 28 Inci", "6Am94ZxcHs", "🧳"], ["Koper Cabin Size", "60SisGyFcr", "🧳"], ["Packing Cubes Organizer", "6VOzTBwLby", "📦"], ["Vacuum Bag Pakaian", "6L5ZGswywx", "🗜"], ["Pompa Vakum Mini Elektrik", "9V2b2iK7nX", "💨"], ["Timbangan Koper Digital", "AKbi2FGx6i", "⚖️"], ["Cover Koper Antigores", "AUv8EYGJll", "🛡"], ["Gembok Koper TSA", "9zyrddIDmg", "🔒"], ["Tag Nama Koper", "AAIHpwHaRj", "🏷"], ["Sabuk Pengaman Koper", "2gCGuA602Q", "🪢"], ["Tas Dokumen Keluarga", "2qVh6T5MhT", "📂"], ["Passport Holder RFID", "50aBgRx7Iu", "🛂"], ["Dompet Paspor Keluarga", "5AtbskwTxx", "👛"], ["Tas Lipat untuk Oleh-Oleh", "4fxLHpyNys", "🛍"], ["Bantal Leher Pesawat", "60SisIFJBf", "🛫"], ["Penutup Mata Tidur", "7AegGRArou", "😴"], ["Earplug Tidur", "70LG48BV9t", "🔇"], ["Sandal Travel", "6q1prpC8Us", "🩴"], ["Organizer Kabel Charger", "6fiPfWClpr", "🔌"], ["Botol Toiletries Antibocor", "7fawrMUtSX", "🧴"], ["Tas Sepatu Travel", "7VHWf3VWnW", "👟"], ["Tas Ransel Travel", "7Ky6SkWA8V", "🎒"], ["Tas Kabin Multifungsi", "5q9IfzbsBE", "💼"], ["Travel Pouch Organizer", "5fpsTgcVWD", "👝"],
    ],
  },
].map((g) => ({ ...g, items: g.items.map(([name, code, icon]) => ({ name, url: s(name), icon })) }));
