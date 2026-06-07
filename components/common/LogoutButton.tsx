'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

export function LogoutButton() {
  const { signOut } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleLogout = async () => {
    setIsSigningOut(true)
    await signOut()
    window.location.replace('/login')
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isSigningOut}
      className="mt-3 flex h-11 w-full items-center justify-center rounded-md border border-[var(--ms-danger)]/60 text-sm text-[var(--ms-danger)] hover:bg-[var(--ms-danger)]/10 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isSigningOut ? 'Logging out...' : 'Logout'}
    </button>
  )
}
