import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.2),transparent_28rem),var(--ms-bg-page)] px-5 py-16 text-[var(--ms-heading)]">
      <section className="ms-card w-full max-w-md rounded-xl p-8 shadow-[0_24px_90px_rgba(0,0,0,0.42)]">
        <Link href="/" className="font-display text-3xl font-black tracking-[-0.04em]">
          <span className="brand-gradient">Moon Strike</span>
        </Link>
        <p className="mono mt-3 text-xs uppercase tracking-[0.22em] text-[var(--ms-gradient-end)]">
          Dominate the game
        </p>

        <div className="mt-8 grid grid-cols-2 rounded-full border border-[var(--ms-border)] bg-[var(--ms-bg-card)] p-1 mono text-xs uppercase tracking-[0.16em]">
          <span className="rounded-full bg-[var(--primary)] px-4 py-3 text-center text-[var(--ms-heading)]">Login</span>
          <Link href="/register" className="rounded-full px-4 py-3 text-center text-[var(--ms-body)] hover:text-[var(--ms-heading)]">
            Register
          </Link>
        </div>

        <form className="mt-8">
          <label className="mono text-xs uppercase tracking-[0.16em] text-[var(--ms-body)]" htmlFor="login-email">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            placeholder="player@moonstrike.gg"
            className="mt-2 h-13 w-full rounded-md border border-[var(--ms-border)] bg-[var(--ms-field)] px-4 outline-none focus:border-[var(--ms-gradient-end)]"
          />

          <label className="mono mt-6 block text-xs uppercase tracking-[0.16em] text-[var(--ms-body)]" htmlFor="login-password">
            Password
          </label>
          <div className="mt-2 flex h-13 items-center rounded-md border border-[var(--ms-border)] bg-[var(--ms-field)] px-4 focus-within:border-[var(--ms-gradient-end)]">
            <input id="login-password" type="password" placeholder="Password" className="w-full bg-transparent outline-none" />
            <button type="button" className="mono text-xs uppercase text-[var(--ms-body)]">
              Show
            </button>
          </div>

          <div className="mt-4 flex justify-end">
            <button type="button" className="text-sm text-[var(--ms-gradient-end)] hover:underline">
              Forgot Password?
            </button>
          </div>

          <Link href="/profile" className="ms-button mt-7 flex h-13 w-full items-center justify-center mono text-sm uppercase tracking-[0.16em]">
            Login
          </Link>
        </form>

        <div className="my-8 flex items-center gap-4">
          <span className="h-px flex-1 bg-[var(--ms-border)]" />
          <span className="mono text-xs uppercase tracking-[0.18em] text-[var(--ms-body)]">Google OAuth</span>
          <span className="h-px flex-1 bg-[var(--ms-border)]" />
        </div>

        <button type="button" className="h-13 w-full rounded-md border border-[var(--ms-border)] bg-[var(--ms-bg-card)] mono text-sm uppercase tracking-[0.14em] text-[var(--ms-heading)] hover:border-[var(--ms-gradient-end)]">
          Continue with Google
        </button>
      </section>
    </main>
  );
}
