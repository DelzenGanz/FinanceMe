#  FinanceMe - Project Management Keuangan Pribadi

Halo semuanya! 👋 Selamat datang di repository **FinanceMe**.

Ini adalah project aplikasi desktop pertama saya untuk mengelola keuangan pribadi secara *offline-first*. Saya membangun aplikasi ini untuk belajar bagaimana menggabungkan **React** dengan **Electron** dan menggunakan **SQLite** sebagai database lokal. 

Tujuan utama project ini adalah membuat pencatatan keuangan jadi lebih keren, mudah dan tetap menjaga privasi karena semua data disimpan di komputer masing-masing.

Saya membuat project ini juga untuk belajar mengatur keuangan pribadi saya sendiri. dikarenakan aplikasi/softwarre serupa banyak yang berbayar, saya memutuskan membuat versi simple dan sederhananya sendiri.

---

## Fitur Utama

Aplikasi ini punya beberapa fitur yang saya buat untuk membantu kita tetap disiplin dalam mengatur uang:

- **Dashboard Keuangan**: Info cepat saldo, total pemasukan, pengeluaran, dan kalkulasi "Uang Aman" yang bisa dipakai.
- **Visualisasi Chart**: Ada grafik batang untuk melihat perbandingan uang masuk dan keluar tiap bulannya.
- **Kesehatan Finansial (Health Score)**: Gauge dinamis yang menghitung seberapa sehat keuangan kita berdasarkan persentase tabungan.
- **Pencatatan Transaksi**: Catat semua pengeluaran dan pemasukan dengan kategori yang bisa difilter. Bisa ekspor ke CSV juga lho!
- **Manajemen Budget**: Kita bisa pasang limit belanja per kategori supaya nggak "boncos". Ada indikator warna hijau, kuning, sampai merah kalau sudah mau habis.
- **Savings Goals**: Tempat buat nulis target tabungan (misal buat beli laptop atau liburan) lengkap dengan deadline-nya.
- **Keamanan PIN**: Supaya data nggak diintip orang lain, ada fitur PIN 6 digit saat aplikasi dibuka.

---

## Teknologi yang Saya Gunakan

Project ini dibangun menggunakan stack modern yang menurut saya seru banget buat dipelajari:

- **Framework**: [Electron](https://www.electronjs.org/) (supaya jadi aplikasi desktop .app atau .exe)
- **Frontend**: [React](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Database**: [SQLite](https://www.sqlite.org/) (lewat library `better-sqlite3`)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Visualisasi**: [Recharts](https://recharts.org/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) (lebih simpel dari Redux!)

---

## � Cara Menjalankan Project

Kalau teman-teman mau coba running di lokal, pastikan sudah install [Node.js](https://nodejs.org/) 
*Perlu diingat ini aplikasi yang running di MacOS ya guys

1. **Clone project ini**:
   ```bash
   git clone https://github.com/username-kamu/financeme.git
   cd financeme
   ```
2. **Install semua dependensinya**:
   ```bash
   npm install
   ```
3. **Jalankan mode pengembangan (Dev)**:
   ```bash
   npm run dev
   ```
4. **Build jadi aplikasi macOS**:
   ```bash
   npm run build:mac
   ```

---

## 📂 Struktur Project

- `electron/`: Isi kodingan untuk proses utama desktop dan pengaturan database SQLite.
- `src/`: Semua kodingan tampilan (React).
  - `components/`: UI komponen yang bisa dipakai ulang (UI Kit bikinan sendiri).
  - `pages/`: Halaman-halaman utama aplikasi.
  - `store/`: Logika penyimpanan state aplikasi.
- `public/`: Asset gambar dan icon.

---

## 📝 Catatan Penutup

Project ini masih jauh dari kata sempurna karena saya masih dalam tahap belajar. Kalau teman-teman punya saran atau masukan, silakan banget ya! Semoga project ini bisa bermanfaat atau menginspirasi.

Terima kasih sudah mampir! 🙏

---
*Dibuat dengan ❤️ oleh seorang sigma yang lagi asik ngoding lagi.*

