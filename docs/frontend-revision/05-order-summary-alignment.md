# Revisi 05 - Penyejajaran Kotak Order Summary (Final)

## Problem
Kotak "Order Summary" di halaman Checkout tidak sejajar dengan form pilihan metode pembayaran ("Payment Method") di kolom sebelah kiri.

## Root Cause — Dua Lapisan Kesalahan

### 1. File yang Salah (Primary Cause)
Seluruh percobaan perbaikan sebelumnya (mt-[184px], pt-[230px], mt-[232px], inline style, Red Border) dilakukan pada file **`app/checkout/CheckoutPageClient.tsx`** — yang merupakan **dead code** dan tidak pernah di-render oleh browser.

File yang sesungguhnya aktif dan di-render oleh halaman `/checkout` adalah:
👉 **`components/checkout-page-client.tsx`** (huruf kecil, di folder `components/`)

Bukti konfirmasnya ada di `app/checkout/page.tsx` baris 1:
```tsx
import { CheckoutPageClient } from "@/components/checkout-page-client";
```

### 2. Arsitektur DOM yang Salah (Secondary Cause)
Pada file aktif tersebut, elemen `<h1>Secure Checkout</h1>` dan subtitle-nya bersarang di dalam kolom kiri Grid. Hal ini menyebabkan tepi atas `<OrderSummary>` (kolom kanan) selalu sejajar dengan `<h1>`, bukan dengan form pembayaran di bawahnya.

## Solution — DOM Structural Refactor (The Clean Way)

Elemen `<h1>` dan subtitle dikeluarkan dari dalam Grid dan dijadikan elemen mandiri di atas Grid. Grid dua kolom hanya membungkus konten yang secara semantik sejajar: **Payment Methods** (kiri) vs **Order Summary** (kanan). Alignment terjadi secara natural tanpa margin buatan.

**File yang diubah:** `components/checkout-page-client.tsx`

**Struktur Sebelum (bermasalah):**
```tsx
<section class="grid lg:grid-cols-[1fr_450px]">     {/* Grid langsung */}
  <div>
    <h1>Secure Checkout</h1>                         {/* ← Di dalam grid */}
    <p>Subtitle</p>
    <h2>Payment Method</h2>
    {/* forms... */}
  </div>
  <OrderSummary />
</section>
```

**Struktur Sesudah (clean):**
```tsx
<section class="max-w-7xl px-10 py-20">             {/* Section sebagai container */}
  <h1>Secure Checkout</h1>                           {/* ← Berdiri sendiri */}
  <p>Subtitle</p>

  <div class="mt-12 grid gap-12 lg:grid-cols-[1fr_450px] lg:items-start">
    <div>
      <h2>Payment Method</h2>                        {/* Grid kiri mulai dari sini */}
      {/* forms... */}
    </div>
    <OrderSummary />                                 {/* Sejajar natural ✅ */}
  </div>
</section>
```

## Post-Script: Resolusi Merge Conflict
Setelah *refactor* ini diimplementasikan, terjadi *merge conflict* dengan `origin/development` yang membawa fitur **PayPal Checkout**. Konflik telah diselesaikan secara struktural dengan:
1. **Mempertahankan** arsitektur DOM lokal (`HEAD`): Kerangka Grid tetap bersih, `<h1>` tetap di luar, dan `<h2>Payment Method</h2>` tetap di dalam container *card*.
2. **Mengadopsi** UI/Logika dari server: Sistem grid form pembayaran diubah menjadi susunan vertikal 3 kotak (`md:grid-rows-3`) untuk merangkul Stripe, PayPal, dan Crypto tanpa merusak layout responsif.

