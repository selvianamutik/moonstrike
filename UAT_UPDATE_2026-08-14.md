# UAT MoonStrike — Update 14 Agustus 2026

**Versi Dokumen:** 1.0
**Tanggal:** 2026-08-14
**Status:** Draft — Siap Untuk Pengujian
**Tipe Pengujian:** User Acceptance Testing (UAT)
**Cakupan:** Hanya fitur yang diperbaiki / ditambahkan pada update ini

---

## RINGKASAN

Dokumen ini berisi skenario UAT terfokus pada tiga area yang baru ditambahkan:

1. **Option Builder — Custom Range (Dual-Thumb Slider):** Tipe option baru `range_pair` di mana customer memilih rentang awal–akhir (contoh: 5-10, 2-8, 5-7) dengan satu slider ber 2 thumb yang bisa digeser kiri/kanan. Harga dihitung `(end − start) × harga/unit`.
2. **Email Automation:** Email invoice reminder (6 jam), email payment confirmed, dan email order completed ke customer.
3. **Admin Test Payment Tool:** Alat simulasi pembayaran untuk super admin tanpa gateway asli (memanggil jalur fulfillment yang sama dengan payment asli).

Area di luar tiga modul ini **tidak** termasuk cakupan UAT kali ini (kecuali tes regresi dasar).

---

## KONVENSI DOKUMEN

| Simbol | Arti |
|--------|------|
| [P] | Pass — fitur berfungsi sesuai ekspektasi |
| [F] | Fail — fitur tidak berfungsi |
| [B] | Blocked — tidak bisa ditest karena dependensi lain |
| [S] | Skip — tidak relevan untuk environment ini |

Kolom **Status** diisi dengan simbol di atas setelah pengujian dilakukan. Kolom **Catatan** opsional untuk detail temuan (screenshot, error message, langkah reproduksi).

---

## LINGKUNGAN & PRASYARAT

| # | Prasyarat | Keterangan |
|---|-----------|------------|
| P1 | Akun Super Admin | Login `/admin/login` dengan akun super admin (untuk Test Payment & setup service) |
| P2 | Akun admin non-super-admin (opsional) | Untuk tes kontrol akses Test Payment |
| P3 | Akun customer aktif dengan email valid | Untuk menerima email automation & test payment |
| P4 | Minimal 2 service aktif | Satu di antaranya dikonfigurasi dengan option `range_pair` |
| P5 | Konfigurasi email | SMTP/Resend terpasang di environment; gunakan email penerima yang bisa dicek (mis. mailbox pribadi) |
| P6 | `CRON_SECRET` tersedia di env | Untuk tes invoice reminder manual via endpoint cron |
| P7 | Akses Supabase (opsional) | Untuk menyiapkan data checkout lama agar reminder bisa dites tanpa menunggu 6 jam |
| P8 | Browser | Chrome desktop + DevTools mobile view (375px) |
| P9 | Fitur Test Payment aktif di environment | Di production fitur ini disembunyikan; UAT dilakukan di staging/local |

---

## MODUL 1 — OPTION BUILDER: CUSTOM RANGE (range_pair)

### UAT-R01: Konfigurasi Admin (Option Builder)

**Prasyarat:** Login super admin, buka `/admin/services/new` atau edit service yang sudah ada.

| No | Skenario | Langkah | Hasil Ekspektasi | Status | Catatan |
|----|----------|---------|-----------------|--------|---------|
| R01-01 | Tipe option baru tersedia | Tambah option, buka dropdown Type | Muncul pilihan **"Custom Range (Two Sliders)"** | [ ] | |
| R01-02 | Field editor muncul | Pilih tipe Custom Range | Muncul field Minimum, Maximum, Step, USD / Unit | [ ] | |
| R01-03 | Validasi min = max | Isi Minimum 5, Maximum 5, simpan | Error: "must allow a range wider than a single value" | [ ] | |
| R01-04 | Validasi max < min | Isi Minimum 10, Maximum 5, simpan | Error: "maximum must be greater than or equal to minimum" | [ ] | |
| R01-05 | Preview | Set min 2, max 10, USD/Unit 5 | Preview menampilkan `range 2-10, USD 5/unit` | [ ] | |
| R01-06 | Simpan & reload | Simpan service, buka kembali halaman edit | Nilai min, max, step, USD/Unit tetap tersimpan | [ ] | |
| R01-07 | EUR auto-convert | Simpan dengan USD/Unit 5 | Di DB/API `pricePerUnitEUR` terisi hasil konversi otomatis | [ ] | |
| R01-08 | Step tersimpan | Set Step 2, simpan, reload | Step tetap 2 (bukan kembali ke 1) | [ ] | |
| R01-09 | Ganti tipe membersihkan field lama | Ubah tipe dari Custom Range ke Dropdown lalu ke Text | Field min/max/step/unit tidak tersisa di data | [ ] | |

### UAT-R02: Customer — Dual-Thumb Slider

**Prasyarat:** Service dengan option `range_pair` berstatus active. Buka halaman service-nya.

| No | Skenario | Langkah | Hasil Ekspektasi | Status | Catatan |
|----|----------|---------|-----------------|--------|---------|
| R02-01 | Tampilan satu slider 2 thumb | Buka configurator service | Satu track slider dengan **2 thumb** (kiri = start, kanan = end) + input angka start/end | [ ] | |
| R02-02 | Drag thumb kiri | Geser thumb kiri ke kanan/kiri | Nilai start berubah, harga live ikut berubah | [ ] | |
| R02-03 | Drag thumb kanan | Geser thumb kanan | Nilai end berubah, harga live ikut berubah | [ ] | |
| R02-04 | Clamp start ≤ end | Geser thumb kiri melewati posisi end | Start berhenti di nilai end (tidak bisa melebihi) | [ ] | |
| R02-05 | Clamp end ≥ start | Geser thumb kanan melewati posisi start | End berhenti di nilai start (tidak bisa kurang) | [ ] | |
| R02-06 | Input angka start | Ketik angka di input start | Value slider ikut berubah, tetap dalam batas min dan ≤ end | [ ] | |
| R02-07 | Input angka end | Ketik angka di input end | Value slider ikut berubah, tetap ≥ start dan ≤ max | [ ] | |
| R02-08 | Harga live | Set min 2, max 10, USD/Unit 5, pilih 5-8 | Tampil `+ $15.00` (3 unit × $5) di samping option | [ ] | |
| R02-09 | Default selection | Buka halaman tanpa mengubah apa pun | Default terisi full range (start = min, end = max) | [ ] | |
| R02-10 | Step berfungsi | Set step 2, geser thumb | Nilai melompat 2, 4, 6, ... (tidak ada nilai ganjil) | [ ] | |
| R02-11 | Aksesibilitas keyboard | Fokus thumb, tekan tombol panah | Nilai berubah sesuai step | [ ] | |
| R02-12 | Label & nilai terlihat jelas | Lihat bagian bawah slider | Ada input "start ... to ... end" dan label option "Custom Range" | [ ] | |

### UAT-R03: Alur Data — Cart, Checkout, Order

| No | Skenario | Langkah | Hasil Ekspektasi | Status | Catatan |
|----|----------|---------|-----------------|--------|---------|
| R03-01 | Add to cart harga benar | Pilih rentang 5-8 (3 unit × $5), Add to Cart | Di cart harga option $15.00, snapshot menampilkan **"5 - 8"** | [ ] | |
| R03-02 | Total cart | Tambahkan beberapa item | Total = base price + $15.00 (+ item lain) | [ ] | |
| R03-03 | Checkout USD | Lanjut checkout, bayar | Total USD sesuai perhitungan | [ ] | |
| R03-04 | Checkout EUR | Ganti mata uang EUR sebelum checkout | Harga option terkonversi EUR (dari pricePerUnitEUR) | [ ] | |
| R03-05 | Order confirmed page | Setelah bayar sukses, buka `/order-confirmed` | Nilai option tampil sebagai "5 - 8" | [ ] | |
| R03-06 | Profile order detail | Login customer, buka order tsb di `/profile/orders` | Nilai option tampil sebagai "5 - 8" | [ ] | |
| R03-07 | Admin order detail | Super admin buka order di `/admin/orders/[id]` | Nilai option tampil "5 - 8", bukan "[object Object]" | [ ] | |
| R03-08 | Google Sheets sync | Jalankan sync sheets untuk order tsb | Kolom Selected Options berisi nilai rentang (contoh: `Label: 5 - 8`) | [ ] | |
| R03-09 | Required services modal | Buat service lain yang mewajibkan service ber-option range_pair | Modal Required Services menambahkan service tsb dengan default range_pair terisi benar | [ ] | |

### UAT-R04: Regresi Option Lain

| No | Skenario | Langkah | Hasil Ekspektasi | Status | Catatan |
|----|----------|---------|-----------------|--------|---------|
| R04-01 | Range biasa | Buka service dengan option "Range Slider" | Slider single berfungsi normal seperti sebelum update | [ ] | |
| R04-02 | Number Stepper | Buka service dengan Number Stepper | Tombol +/− dan harga normal | [ ] | |
| R04-03 | Dropdown/Radio/Checkbox/Toggle/Text | Buka service dengan kombinasi tipe lain | Semua tipe lama berfungsi normal, tidak terpengaruh | [ ] | |

---

## MODUL 2 — EMAIL AUTOMATION

### UAT-E01: Payment Confirmed Email

**Prasyarat:** Akun customer dengan email dapat diakses; gunakan Test Payment tool (Modul 3) sebagai cara cepat memicu payment tanpa bayar sungguhan.

| No | Skenario | Langkah | Hasil Ekspektasi | Status | Catatan |
|----|----------|---------|-----------------|--------|---------|
| E01-01 | Email terkirim (NOWPayments) | Jalankan Test Payment dengan status sukses | Customer menerima email "Payment received" berisi order ref + amount | [ ] | |
| E01-02 | Email terkirim (PayPal) | Selesaikan checkout PayPal sungguhan (mode sandbox) | Email payment confirmed terkirim ke customer | [ ] | |
| E01-03 | Konten email | Buka email yang diterima | Subject, jumlah, dan order ref benar dan sesuai mata uang (USD/EUR) | [ ] | |
| E01-04 | Tidak ada email duplikat | Lihat inbox customer | Hanya 1 email payment confirmed per order (tidak terkirim 2x) | [ ] | |

### UAT-E02: Order Completed Email

| No | Skenario | Langkah | Hasil Ekspektasi | Status | Catatan |
|----|----------|---------|-----------------|--------|---------|
| E02-01 | Email saat order completed | Admin menandai order selesai (`/admin/orders/[id]`) | Customer menerima email order completed | [ ] | |
| E02-02 | Konten email | Buka email | Berisi order ref dan status selesai, tanpa error | [ ] | |
| E02-03 | Order auto-complete cron | Buat order lama yang lolos auto-complete | Order selesai otomatis & email terkirim (opsional, jika cron aktif) | [ ] | |

### UAT-E03: Invoice Reminder (6 Jam)

**Catatan teknis:** Reminder menyasar `checkout_sessions` status `created` yang berumur ≥ 6 jam. Untuk mempercepat tes, siapkan data lama via Supabase (ubah `created_at` session tes menjadi > 6 jam lalu) atau tunggu 6 jam.

| No | Skenario | Langkah | Hasil Ekspektasi | Status | Catatan |
|----|----------|---------|-----------------|--------|---------|
| E03-01 | Reminder terkirim | Jalankan endpoint `GET /api/cron/invoice-reminders` dengan header `x-vercel-cron: 1` + `CRON_SECRET` valid | Email reminder terkirim ke customer dengan CTA ke `/checkout` | [ ] | |
| E03-02 | Tidak untuk session baru | Buat checkout session baru (< 6 jam), jalankan cron | Tidak ada email reminder untuk session tersebut | [ ] | |
| E03-03 | Hanya status created | Set session berstatus paid/completed, jalankan cron | Tidak ada reminder untuk session paid/completed | [ ] | |
| E03-04 | Dedupe | Jalankan cron 2x berturut-turut | Email hanya terkirim 1x per session | [ ] | |
| E03-05 | Otentikasi gagal | Panggil endpoint tanpa header `x-vercel-cron` / `CRON_SECRET` salah | Respon 401, tidak ada email terkirim | [ ] | |
| E03-06 | CTA benar | Buka email reminder | Tombol/link "Checkout" mengarah ke `/checkout` | [ ] | |
| E03-07 | Cron terjadwal (opsional) | Cek `vercel.json` | Jadwal `0 * * * *` terdaftar di Vercel | [ ] | |

---

## MODUL 3 — ADMIN TEST PAYMENT TOOL

### UAT-P01: Kontrol Akses

| No | Skenario | Langkah | Hasil Ekspektasi | Status | Catatan |
|----|----------|---------|-----------------|--------|---------|
| P01-01 | Menu di sidebar | Login super admin | Sidebar admin menampilkan menu **"Test Payment"** (di bawah Transactions) | [ ] | |
| P01-02 | Non-super-admin tidak melihat menu | Login admin biasa | Menu Test Payment tidak muncul di sidebar | [ ] | |
| P01-03 | Non-super-admin dilarang akses URL | Login admin biasa, buka `/admin/test-payment` | Redirect/ditolak (tidak bisa membuka halaman) | [ ] | |
| P01-04 | API ditolak | Panggil `POST /api/admin/test-payment` tanpa session/tanpa super admin | Respon 401/403, tidak ada data dibuat | [ ] | |

### UAT-P02: Fungsionalitas Tool

**Prasyarat:** Login super admin, siapkan email customer yang akan dipakai (email di database user).

| No | Skenario | Langkah | Hasil Ekspektasi | Status | Catatan |
|----|----------|---------|-----------------|--------|---------|
| P02-01 | Halaman load | Buka `/admin/test-payment` | Form tampil: email customer, pilihan service (dropdown), jumlah | [ ] | |
| P02-02 | Dropdown service terisi | Klik dropdown service | Berisi daftar service (judul + nama game) yang ada | [ ] | |
| P02-03 | Test 1 service | Pilih 1 service + isi email + jumlah, submit | Sukses: order terbuat, transaksi test tercatat | [ ] | |
| P02-04 | Tambah baris service | Klik "Add another service" | Baris dropdown baru muncul | [ ] | |
| P02-05 | Test 2 service sekaligus | Isi 2 baris berbeda, submit | Kedua service masuk sebagai item dalam 1 order test | [ ] | |
| P02-06 | Hapus baris | Klik ikon trash pada baris | Baris terhapus; baris terakhir tidak bisa dihapus | [ ] | |
| P02-07 | Service tidak valid | Pilih/ketik service yang tidak ada di daftar | Muncul error yang jelas, tidak ada data rusak | [ ] | |
| P02-08 | Jumlah invalid | Isi jumlah 0 / kosong / bukan angka | Muncul error validasi | [ ] | |
| P02-09 | Email tidak ditemukan | Isi email yang tidak terdaftar | Muncul error "user not found" yang jelas | [ ] | |

### UAT-P03: Verifikasi Hasil Test Payment

| No | Skenario | Langkah | Hasil Ekspektasi | Status | Catatan |
|----|----------|---------|-----------------|--------|---------|
| P03-01 | Status transaksi | Setelah submit, buka `/admin/transactions` | Transaksi test muncul (ref/ID berawalan `test_`), status sukses | [ ] | |
| P03-02 | Order terbentuk | Buka `/admin/orders` | Order test muncul dengan items & total sesuai input | [ ] | |
| P03-03 | Email payment confirmed | Cek inbox email customer yang dipakai | Email payment confirmed terkirim (sama seperti payment asli) | [ ] | |
| P03-04 | Audit log | Buka `/admin/logs` | Ada catatan aksi test payment (user, timestamp, status) | [ ] | |
| P03-05 | Jalur fulfillment sama dengan asli | Bandingkan dengan payment sungguhan (opsional) | Test tool memakai fungsi fulfillment yang sama → perilaku identik | [ ] | |
| P03-06 | Regresi payment asli | Lakukan checkout sungguhan (mis. PayPal sandbox) | Checkout normal tetap berfungsi, tidak terpengaruh test tool | [ ] | |

---

## MODUL 4 — REGRESI DASAR (SCOPE MINIMAL)

Hanya area yang bersentuhan langsung dengan perubahan.

| No | Skenario | Langkah | Hasil Ekspektasi | Status | Catatan |
|----|----------|---------|-----------------|--------|---------|
| G01-01 | Checkout normal | Checkout service biasa (tanpa range_pair) dengan payment | Alur lengkap berfungsi | [ ] | |
| G01-02 | Notifikasi in-app | Lakukan test payment | Notifikasi in-app (bell) muncul untuk order terkonfirmasi | [ ] | |
| G01-03 | Cart & badge | Tambah/hapus item cart | Badge cart update normal | [ ] | |

---

## SIGN-OFF

| Nama | Peran | Tanggal | Keputusan (Approve / Conditional / Reject) | Catatan |
|------|-------|---------|-------------------------------------------|---------|
|      |       |         |                                           |         |
|      |       |         |                                           |         |

**Catatan sign-off:**
- **Approve:** Semua kriteria UAT lulus / defect minor non-blokir.
- **Conditional:** Approve dengan syarat defect tertentu diperbaiki (sebutkan No skenario).
- **Reject:** Ada defect blokir (sebutkan No skenario) — harus diulang setelah perbaikan.

---

## LAMPIRAN — DEFECT LOG

| No | Referensi Skenario | Deskripsi | Prioritas (High/Med/Low) | Status (Open/Fixed/Closed) | Tanggal |
|----|--------------------|-----------|--------------------------|----------------------------|---------|
|    |                    |           |                          |                            |         |
|    |                    |           |                          |                            |         |
