import Link from "next/link";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.16),transparent_28rem),var(--ms-bg-page)] px-5 py-16 text-[var(--ms-heading)]">
      <section className="ms-card w-full max-w-md rounded-xl p-8 shadow-[0_24px_90px_rgba(0,0,0,0.42)]">
        <Link href="/" className="font-display text-3xl font-black tracking-[-0.04em]">
          <span className="brand-gradient">Moon Strike</span>
        </Link>
        <p className="mono mt-3 text-xs uppercase tracking-[0.22em] text-[var(--ms-gradient-end)]">
          Create your player profile
        </p>

        <div className="mt-8 grid grid-cols-2 rounded-full border border-[var(--ms-border)] bg-[var(--ms-bg-card)] p-1 mono text-xs uppercase tracking-[0.16em]">
          <Link href="/login" className="rounded-full px-4 py-3 text-center text-[var(--ms-body)] hover:text-[var(--ms-heading)]">
            Login
          </Link>
          <span className="rounded-full bg-[var(--primary)] px-4 py-3 text-center text-[var(--ms-heading)]">
            Register
          </span>
        </div>

        <form className="mt-8">
          {[
            { id: "register-username", label: "Username", type: "text", placeholder: "NightfallRunner" },
            { id: "register-email", label: "Email", type: "email", placeholder: "player@moonstrike.gg" },
            { id: "register-password", label: "Password", type: "password", placeholder: "Password" },
            { id: "register-confirm", label: "Confirm Password", type: "password", placeholder: "Confirm password" },
          ].map((field) => (
            <div key={field.id} className="mt-5 first:mt-0">
              <label className="mono text-xs uppercase tracking-[0.16em] text-[var(--ms-body)]" htmlFor={field.id}>
                {field.label}
              </label>
              <input
                id={field.id}
                type={field.type}
                placeholder={field.placeholder}
                className="mt-2 h-13 w-full rounded-md border border-[var(--ms-border)] bg-[var(--ms-field)] px-4 outline-none focus:border-[var(--ms-gradient-end)]"
              />
            </div>
          ))}

          <Link href="/profile" className="ms-button mt-7 flex h-13 w-full items-center justify-center mono text-sm uppercase tracking-[0.16em]">
            Create Account
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
