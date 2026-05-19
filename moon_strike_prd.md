# Product Requirements Document (PRD): Moon Strike

**Nama Proyek:** Moon Strike (Overgear Clone)
**Status:** Draft / Initial
**Versi:** 1.0

---

## 1. Pendahuluan
### 1.1 Tujuan Proyek
Membangun platform marketplace untuk layanan game (boosting, coaching, items) yang efisien, aman, dan memiliki estetika visual modern bertema "Cosmic/Nebula". Proyek ini bertujuan untuk menghubungkan pelanggan dengan penyedia layanan profesional.

### 1.2 Target Audiens
* Gamer sibuk yang ingin progres cepat (Skip the grind).
* Pemain kompetitif yang ingin naik peringkat (Rank boosting).
* Gamer yang mencari item langka atau penyelesaian dungeon sulit.

---

## 2. Fitur Utama (Core Features)

### 2.1 Landing Page & Navigasi
* **Hero Section:** Headline dinamis, sub-headline, dan tombol CTA "Order Now".
* **Trust Metrics:** Statistik real-time (Jumlah pengguna, tingkat penyelesaian).
* **Game Directory:** Daftar game yang didukung (WoW, Destiny 2, Valorant, dll) dengan filter pencarian.

### 2.2 Sistem Katalog & Produk
* **Product Page:** Deskripsi detail layanan, opsi kustomisasi (misal: pilih rank saat ini vs rank target).
* **Price Calculator:** Kalkulator otomatis berdasarkan parameter yang dipilih pengguna.
* **Tier Selection:** Pilihan kualitas layanan (Standard, Express, Premium).

### 2.3 Sistem Pengguna (User System)
* **User Dashboard:** Melacak status pesanan, riwayat pembelian, dan tiket dukungan.
* **Pro-Player/Booster Dashboard:** Manajemen tugas, laporan progres, dan penarikan pendapatan.

### 2.4 Transaksi & Keamanan
* **Escrow Payment:** Dana ditahan oleh platform dan hanya dilepaskan ke booster setelah pelanggan mengonfirmasi penyelesaian.
* **Integrasi Payment Gateway:** Mendukung kartu kredit, PayPal, dan Crypto (Opsional).

---

## 3. Spesifikasi Teknis

### 3.1 Tech Stack (Rekomendasi)
* **Frontend:** React.js atau Next.js (untuk SEO yang lebih baik).
* **Styling:** Tailwind CSS (untuk implementasi tema gelap Moon Strike dengan mudah).
* **Backend:** Node.js (Express) atau Python (Django).
* **Database:** PostgreSQL atau MongoDB.

### 3.2 Keamanan
* Enkripsi SSL/TLS.
* Autentikasi dua faktor (2FA) untuk akun pengguna dan booster.
* Sistem chat internal untuk mencegah transaksi di luar platform.

---

## 4. Persyaratan Desain (UI/UX)
* **Tema:** Dark Mode (Deep Space Black & Nebula Purple).
* **Responsivitas:** Harus Mobile-First (mengingat trafik gamer banyak dari perangkat mobile).
* **Interaksi:** Animasi transisi yang halus pada setiap perubahan status pesanan.

---

## 5. Rencana Rilis (Roadmap)
* **Fase 1 (MVP):** Landing page, sistem katalog statis, dan integrasi WhatsApp untuk pemesanan manual.
* **Fase 2:** Sistem login, dashboard pengguna, dan integrasi payment gateway.
* **Fase 3:** Sistem tracking progres real-time dan fitur chat internal.

---
*Dibuat oleh Tim Pengembangan Moon Strike.*
