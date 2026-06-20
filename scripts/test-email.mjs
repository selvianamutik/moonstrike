import fs from 'node:fs'
import path from 'node:path'

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

function loadLocalEnv() {
  const envPath = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) return

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/)

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const equalsIndex = trimmed.indexOf('=')
    if (equalsIndex === -1) continue

    const key = trimmed.slice(0, equalsIndex).trim()
    let value = trimmed.slice(equalsIndex + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    process.env[key] ??= value
  }
}

function required(value, name) {
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

function appBaseUrl() {
  const explicitUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (explicitUrl) return explicitUrl.replace(/\/$/, '')

  const vercelUrl = process.env.VERCEL_URL?.trim()
  if (vercelUrl) return `https://${vercelUrl}`.replace(/\/$/, '')

  return 'http://localhost:3000'
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function renderMoonStrikeEmail({ title, body, ctaLabel, ctaHref }) {
  const safeTitle = escapeHtml(title)
  const safeBody = escapeHtml(body)
  const safeCtaLabel = escapeHtml(ctaLabel)
  const safeCtaHref = escapeHtml(ctaHref)
  const footer = 'This is a MoonStrike email delivery test. No order or refund was changed.'

  return {
    text: `${title}\n\n${body}\n\n${ctaLabel}: ${ctaHref}\n\n${footer}`,
    html: `
      <!doctype html>
      <html>
        <body style="margin:0;background:#070b16;padding:32px 16px;font-family:Arial,sans-serif;color:#e5e7eb">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;border-collapse:collapse;border:1px solid #1f2937;border-radius:14px;overflow:hidden;background:#0f172a">
                  <tr>
                    <td style="padding:28px 32px 10px">
                      <div style="font-size:12px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#22d3ee">MoonStrike</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0 32px 12px">
                      <h1 style="margin:0;color:#ffffff;font-size:24px;line-height:1.25;font-weight:800">${safeTitle}</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0 32px 28px">
                      <p style="margin:0;color:#cbd5e1;font-size:15px;line-height:1.7">${safeBody}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0 32px 32px">
                      <a href="${safeCtaHref}" style="display:inline-block;border-radius:8px;background:#8b5cf6;color:#ffffff;font-size:14px;font-weight:700;line-height:1;text-decoration:none;padding:14px 18px">
                        ${safeCtaLabel}
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style="border-top:1px solid #1f2937;padding:18px 32px">
                      <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6">${escapeHtml(footer)}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  }
}

loadLocalEnv()

const apiKey = required(process.env.RESEND_API_KEY?.trim(), 'RESEND_API_KEY')
const from = required(process.env.RESEND_FROM_EMAIL?.trim(), 'RESEND_FROM_EMAIL')
const to = required(
  (process.env.EMAIL_TEST_TO || process.env.RESEND_TEST_TO)?.trim(),
  'EMAIL_TEST_TO'
)

const content = renderMoonStrikeEmail({
  title: 'MoonStrike email test',
  body: 'Your Resend configuration is working. This test does not create an order, refund, or notification.',
  ctaLabel: 'Open MoonStrike',
  ctaHref: appBaseUrl(),
})

const response = await fetch(RESEND_ENDPOINT, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from,
    to,
    subject: 'MoonStrike email test',
    text: content.text,
    html: content.html,
  }),
})

if (!response.ok) {
  const detail = await response.text().catch(() => '')
  throw new Error(`Email test failed: ${response.status} ${detail}`)
}

const payload = await response.json().catch(() => ({}))
console.log(`Sent MoonStrike test email to ${to}.`)
if (payload.id) console.log(`Resend email id: ${payload.id}`)
