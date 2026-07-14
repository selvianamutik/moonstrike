# Revisi 03 - Penyesuaian Simetri Layout Footer

## Problem
Tampilan footer tidak simetris; menu navigasi menumpuk di tengah dan menyisakan banyak ruang kosong di sebelah kanan.

## Root Cause
Pembagian fraksi kolom grid utama yang berat sebelah (`1.25fr_1fr`) membuat bagian kiri (Logo) mengambil ruang lebih banyak daripada bagian kanan. Selain itu, terdapat pemesanan 3 kolom pada nested grid di sebelah kanan (`md:grid-cols-3`) padahal satu kolom menu ("Genres") telah disembunyikan/di-comment out, sehingga menyisakan satu ruang kosong (kolom hantu) yang tidak terpakai di sisi paling kanan.

## Solution
1. **Grid Utama:** Class `lg:grid-cols-[1.25fr_1fr]` diubah menjadi `lg:grid-cols-2` agar ruang dibagi secara merata (50/50) antara elemen kiri dan elemen menu di kanan.
2. **Nested Grid:** Class `md:grid-cols-3` dihapus menjadi hanya `grid-cols-2` agar 2 kolom menu yang tersisa (Sitemap & Legal) didistribusikan ke dalam ruang yang ada dengan seimbang dan tidak lagi menyediakan kolom kosong.

**Sebelum:**
```tsx
        <div className="grid gap-12 lg:grid-cols-[1.25fr_1fr]">
          {/* ... */}
          <div className="grid grid-cols-2 gap-8 md:grid-cols-3">
```

**Sesudah:**
```tsx
        <div className="grid gap-12 lg:grid-cols-2">
          {/* ... */}
          <div className="grid grid-cols-2 gap-8">
```
