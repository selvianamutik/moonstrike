# Revisi 02 - Hapus Garis Kiri pada Tombol (Dark Mode)

## Problem
Klien mengeluhkan adanya bug visual berupa garis putih tipis yang tidak diinginkan pada sisi kiri tombol (terutama tombol 'Buy Now') ketika aplikasi menggunakan tema dark mode.

## Root Cause
Masalah ini bukan disebabkan oleh class Tailwind khusus seperti `border-l` atau `ring` pada dark mode. Penyebab utamanya adalah ilusi optik dari kombinasi properti CSS berikut pada class `.ms-button`:
1. Terdapat properti `border: 1px solid rgba(255, 255, 255, 0.16);` yang menambahkan garis transparan tipis di keempat sisi tombol.
2. Background tombol menggunakan gradien `var(--ms-cta-bg)` yang warnanya bergeser dari ungu gelap di kiri ke ungu terang di kanan.

Karena sisi kiri tombol memiliki background ungu yang lebih gelap, border transparan putih ini menjadi sangat kontras terhadap background card di belakangnya (`var(--ms-bg-card)`), sehingga terlihat menonjol dan menyerupai garis pembatas (border) di sebelah kiri. Sementara di sisi kanan yang ungu terang, garis putih ini membaur dan kurang terlihat.

## Solution
Properti `border` dihapus dari class `.ms-button` agar gradien dan bayangan (shadow) tombol dapat tampil bersih menyatu dengan desain card tanpa terganggu oleh ilusi optik dari garis pembatas.

**Sebelum:**
```css
.ms-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 7px;
  background: var(--ms-cta-bg);
  box-shadow: 0 0 22px rgba(136, 82, 255, 0.45);
  color: #ffffff;
  font-weight: 700;
}
```

**Sesudah:**
```css
.ms-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  border-radius: 7px;
  background: var(--ms-cta-bg);
  box-shadow: 0 0 22px rgba(136, 82, 255, 0.45);
  color: #ffffff;
  font-weight: 700;
}
```
