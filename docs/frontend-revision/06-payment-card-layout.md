# Revisi 06 - Repositioning Payment Method & Spacing Adjustment

## Problem
Berdasarkan referensi desain visual terbaru, jarak vertikal antara judul utama "Secure Checkout" dengan bagian area opsi pembayaran dan *order summary* terlalu jauh. Selain itu, tulisan "Payment Method" berada bebas di luar area kotak form, yang membuat desain secara hierarki visual terasa kurang menyatu (terpisah dari daftar opsi pembayarannya).

## Solution
Melakukan *semantic refactoring* pada struktur DOM di file `components/checkout-page-client.tsx`:

1. **Header Enclosure:** Judul `<h2>Payment Method</h2>` yang sebelumnya merupakan elemen mandiri di luar container `ms-card`, kini dipindahkan (repositioning) ke bagian dalam container tersebut. Dengan begitu, judul kini berbagi *enclosure* border yang sama dengan tombol-tombol opsi pembayaran, menciptakan pengelompokan visual (grup kartu) yang jauh lebih rapi dan premium. Untuk mempertahankan jarak, class `mt-6` pada container dihapus, dan margin diserahkan kepada elemen judul menjadi `mb-6`.
2. **Global Spacing:** Margin atas dari Grid utama (pembungkus dua kolom) diturunkan secara drastis dari `mt-12` menjadi `mt-6`. Penyesuaian class utilitas ini menarik seluruh blok pembayaran dan *order summary* merapat ke arah header "Secure Checkout" di atasnya, menuntaskan masalah ruang kosong (whitespace) berlebih.
