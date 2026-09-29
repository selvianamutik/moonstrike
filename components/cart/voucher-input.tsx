"use client"

import { useEffect, useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faTimes, faSpinner } from "@fortawesome/free-solid-svg-icons"

type AppliedVoucher = {
  code: string
  discountPercentage: number
}

type VoucherInputProps = {
  onVoucherApplied?: (voucher: AppliedVoucher) => void
  onVoucherRemoved?: (index: number) => void
  appliedVouchers?: AppliedVoucher[]
  appliedVoucher?: AppliedVoucher | null
}

export function VoucherInput({
  onVoucherApplied,
  onVoucherRemoved,
  appliedVouchers: initialVouchers = [],
  appliedVoucher: initialVoucher = null,
}: VoucherInputProps) {
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [appliedVouchers, setAppliedVouchers] = useState<AppliedVoucher[]>(
    initialVouchers.length > 0 ? initialVouchers : initialVoucher ? [initialVoucher] : []
  )

  useEffect(() => {
    setAppliedVouchers(
      initialVouchers.length > 0 ? initialVouchers : initialVoucher ? [initialVoucher] : []
    )
  }, [initialVouchers, initialVoucher])

  const handleApply = async () => {
    if (!code.trim()) return
    if (appliedVouchers.length > 0) {
      setError("Only one voucher can be applied per order")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/cart/voucher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Invalid voucher code")
        return
      }

      const voucher: AppliedVoucher = {
        code: data.voucher.code,
        discountPercentage: data.voucher.discountPercentage,
      }

      setAppliedVouchers([voucher])
      setCode("")
      onVoucherApplied?.(voucher)
    } catch (err) {
      setError("Failed to validate voucher")
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (index: number) => {
    try {
      await fetch("/api/cart/voucher", {
        method: "DELETE",
      })
    } catch (e) {
      // ignore
    }
    setAppliedVouchers((current) => current.filter((_, i) => i !== index))
    onVoucherRemoved?.(index)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleApply()
    }
  }

  return (
    <div className="rounded-xl border border-[var(--ms-border)] bg-[var(--ms-bg-card)] p-4 shadow-[0_16px_50px_rgba(0,0,0,0.2)]">
      <div className="mb-3">
        <p className="text-sm font-black text-[var(--ms-heading)]">Have a voucher?</p>
        <p className="mt-1 text-xs text-[var(--ms-body)]">Enter a promotional code to discount this order.</p>
      </div>

      {error && (
        <p className="mb-3 flex items-center gap-1 text-sm text-red-400">
          <FontAwesomeIcon icon={faTimes} className="h-3 w-3" />
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          placeholder="Enter voucher code"
          disabled={loading}
          className="flex-1 rounded-lg border border-[var(--ms-border)] bg-[var(--ms-bg)] px-3 py-2 text-sm text-[var(--ms-body)] placeholder:text-[var(--ms-muted)] focus:border-[var(--ms-gradient-end)] focus:outline-none disabled:opacity-50"
        />
        <button
          type="button"
          onClick={handleApply}
          disabled={loading || !code.trim() || appliedVouchers.length > 0}
          className="rounded-lg bg-[var(--ms-gradient-end)] px-4 py-2 text-sm font-bold text-white transition-colors hover:opacity-90 disabled:opacity-50"
        >
          {loading ? (
            <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin" />
          ) : (
            "Apply"
          )}
        </button>
      </div>
    </div>
  )
}
