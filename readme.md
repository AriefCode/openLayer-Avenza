# OpenLayers × Avenza: Peta Banjir & Walkability Riau

Peta web interaktif hasil praktikum **Bengkel Sistem Informasi Geografis, Politeknik Caltex Riau**. Aplikasi ini menampilkan data GeoJSON dengan [OpenLayers](https://openlayers.org/). Datanya ada tiga: wilayah kabupaten/kota di Provinsi Riau, titik kejadian banjir, dan **56 titik survei fasilitas pejalan kaki** (halte, zebra cross, trotoar) yang direkam kelompok di Pekanbaru memakai aplikasi Avenza Maps.

<!-- Tambahkan screenshot di sini, misalnya: ![Tampilan peta](docs/screenshot.png) -->

## ✨ Fitur

- **Peta kabupaten/kota Riau** dengan warna bergradasi otomatis (style expression `interpolate` berdasarkan `FID`)
- **Highlight saat hover**: kabupaten yang ditunjuk kursor diberi garis putih, dan namanya tampil di panel *Info*
- **Titik banjir** dengan ikon dan popup berisi nama daerah dan jumlah korban
- **56 titik survei walkability** dengan ikon pin berbeda untuk tiap kategori
- **Popup survei bergambar**: nama titik, kategori, waktu survei, dan foto lapangan
- **Lightbox foto**: klik foto untuk membukanya di tengah layar, lalu geser dengan tombol ‹ › atau panah keyboard
- **Kontrol layer**: checkbox untuk tiap layer, plus sub-checkbox per kategori survei yang sekaligus berfungsi sebagai legenda
- **Zoom otomatis** ke area survei setelah data selesai dimuat

## 🧰 Teknologi

| | |
|---|---|
| Peta | [OpenLayers](https://openlayers.org/) (paket `ol`) |
| Dev server & build | [Vite](https://vite.dev/) |
| UI (modal, tipografi) | Bootstrap 5.2 (via CDN) |
| Format data | GeoJSON (EPSG:4326) |
| Peta dasar | OpenStreetMap |

## 🚀 Cara Clone dan Menjalankan

**Prasyarat:** [Node.js](https://nodejs.org/) versi **20.19+ atau 22.12+** (dites dengan v24) dan [Git](https://git-scm.com/).

```bash
# 1. Clone repo
git clone https://github.com/AriefCode/openLayer-Avenza.git
cd openLayer-Avenza

# 2. Pasang dependensi (membuat folder node_modules)
npm install

# 3. Jalankan server pengembangan
npm start
```

Buka **http://localhost:5173** di browser. Setiap perubahan file yang disimpan akan langsung terlihat tanpa perlu restart server.

> Folder `node_modules` sengaja tidak ikut di-upload (sudah diatur di `.gitignore`). Isinya dibuat ulang oleh `npm install` berdasarkan `package.json`.

### Build untuk publikasi

```bash
npm run build     # hasil di folder dist/
npm run serve     # pratinjau hasil build
```

⚠️ **Penting sebelum build:** Vite hanya menyalin isi folder `public/` dan file yang di-`import` ke dalam `dist/`. Folder `data/`, `icon/`, dan `foto/` dipanggil lewat URL, jadi **pindahkan ketiganya ke dalam `public/`** sebelum menjalankan `npm run build`. Alamat di kode tidak perlu diubah (tetap `'data/...'`, `'icon/...'`, `'foto/...'`).

## 📁 Struktur Proyek

```
openLayer-Avenza/
├── index.html          kerangka halaman: peta, popup, panel checkbox, modal foto
├── main.js             seluruh logika peta (layer, style, popup, hover, checkbox, lightbox)
├── style.css           ukuran peta, popup, panel checkbox, lightbox
├── package.json        daftar paket dan perintah npm
├── vite.config.js
├── data/
│   ├── kab_riau.json       polygon kabupaten/kota Riau
│   ├── polygon_riau.json   batas wilayah Riau
│   ├── banjir.json         titik kejadian banjir
│   └── avenza.json         56 titik survei walkability
├── icon/               ikon banjir dan ikon pin per kategori survei
└── foto/               61 foto lapangan hasil survei
```

## 🗺️ Data

| File | Isi | Atribut utama | Sumber |
|---|---|---|---|
| `kab_riau.json` | Polygon kabupaten/kota | `FID`, `Kabupaten`, `PROVINCE` | Shapefile `riau_adm`, dikonversi dengan ArcMap (*Features To JSON*) |
| `polygon_riau.json` | Batas wilayah Riau | | Modul praktikum |
| `banjir.json` | Titik banjir | `Nama_Pemetaan`, `Jumlah_Korban` | Modul praktikum |
| `avenza.json` | Titik survei walkability | `name`, `timestamp`, `foto` | Survei lapangan kelompok, 29 September 2026 |

### Data survei Avenza

Titik direkam dengan Avenza Maps di koridor Jalan Jenderal Sudirman dan kawasan Rumbai, Pekanbaru, lalu diekspor sebagai KMZ dan dikonversi ke GeoJSON. Kolom `foto` berisi daftar nama file foto milik titik tersebut, yang tersimpan di folder `foto/`.

Kategori ditentukan dari **awalan nama titik**:

| Awalan nama | Kategori | Jumlah | Ikon |
|---|---|---|---|
| `Zc`, `Zb`, `Zebra` | Zebra Cross | 29 | `icon/zebra.png` |
| `Tr`, `Trotoar` | Trotoar | 11 | `icon/trotoar.png` |
| `Halte`, `HT` | Halte | 10 | `icon/halte.png` |
| (lainnya) | Lainnya | 6 | `icon/lainnya.png` |

Jika ingin menambah titik baru, cukup beri nama dengan awalan yang sesuai. Ikon dan kategorinya akan mengikuti secara otomatis.

## 🖱️ Cara Pakai

| Aksi | Hasil |
|---|---|
| Arahkan kursor ke kabupaten | Kabupaten disorot dan namanya tampil di panel *Info* |
| Klik ikon banjir atau titik survei | Popup informasi muncul di atas ikon |
| Klik area kosong atau tombol ✖ | Popup tertutup |
| Klik foto di popup | Foto terbuka dalam lightbox |
| ‹ › atau panah ← → | Pindah foto (untuk titik yang punya lebih dari satu foto) |
| Esc atau klik area gelap | Lightbox tertutup |
| Checkbox di pojok kanan atas | Menampilkan atau menyembunyikan layer dan kategori survei |

## 🙏 Kredit

- Praktikum **Bengkel Sistem Informasi Geografis**, Politeknik Caltex Riau
- Disusun oleh **M. Arief**, 3 TI C
- Data survei: kelompok survei walkability
- Peta dasar © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors
