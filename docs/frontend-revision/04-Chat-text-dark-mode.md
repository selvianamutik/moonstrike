# Revisi 04 - Perbaikan Kontras Warna Teks Chat (Dark Mode)

## Problem
Teks pada bubble chat admin (pihak lawan bicara) sangat redup dan sulit dibaca di dark mode karena warna abu-abu redup bertemu dengan background biru gelap.

## Root Cause
Penggunaan class `text-[var(--ms-body)]` pada background `bg-[var(--ms-hover-bg)]` yang memiliki kontras rasio rendah. Pada dark mode, variabel `--ms-body` me-resolve ke warna `#94a3b8` (abu-abu), sedangkan `--ms-hover-bg` adalah biru dongker gelap. Perpaduan ini membuat teks menyatu dengan warna background.

## Solution
Class warna teks pada bubble admin diubah dari `text-[var(--ms-body)]` menjadi `text-white` untuk meningkatkan visibilitas dan kontras secara signifikan. Teks kini sangat jelas terbaca dan memiliki format konsistensi warna yang sama dengan teks bubble milik pengguna.

**Sebelum:**
```tsx
                      className={`max-w-[82%] rounded-xl px-4 py-3 text-sm leading-6 ${
                        mine
                          ? "bg-[linear-gradient(135deg,var(--ms-gradient-start),var(--ms-gradient-end))] text-white"
                          : "border border-[var(--ms-border)] bg-[var(--ms-hover-bg)] text-[var(--ms-body)]"
                      }`}
```

**Sesudah:**
```tsx
                      className={`max-w-[82%] rounded-xl px-4 py-3 text-sm leading-6 ${
                        mine
                          ? "bg-[linear-gradient(135deg,var(--ms-gradient-start),var(--ms-gradient-end))] text-white"
                          : "border border-[var(--ms-border)] bg-[var(--ms-hover-bg)] text-white"
                      }`}
```
