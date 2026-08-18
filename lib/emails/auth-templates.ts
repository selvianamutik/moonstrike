// MoonStrike auth email templates for Supabase Auth (GoTrue).
// Paste the HTML into: Supabase Dashboard → Authentication → Email Templates.
// - "Confirm signup"  → MOONSTRIKE_CONFIRM_SIGNUP_HTML  (subject: "Confirm your email address")
// - "Reset Password"  → MOONSTRIKE_RESET_PASSWORD_HTML  (subject: "Reset your password")
// GoTrue variables: {{ .ConfirmationURL }}, {{ .Email }}, {{ .SiteURL }}, {{ .Token }}
// Keep the layout identical to renderMoonStrikeEmail() in lib/email.ts.

const SHELL_HEAD = `
<!doctype html>
<html lang="en">
  <body style="margin:0;background:#070b16;padding:36px 16px;font-family:Arial,Helvetica,sans-serif">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;border-collapse:collapse;border:1px solid #1f2937;border-radius:14px;overflow:hidden;background:#0f172a">
            <tr>
              <td style="background:#8b5cf6;background:linear-gradient(90deg,#4735A5,#A561CA);padding:2px 0;font-size:0;line-height:0">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:32px 32px 8px">
                <div style="font-size:12px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#22d3ee">Moon&nbsp;Strike</div>
                <div style="margin-top:2px;font-size:11px;letter-spacing:0.10em;text-transform:uppercase;color:#64748b">Dominate the game</div>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 32px 10px">
                <h1 style="margin:0;color:#f1f5f9;font-size:24px;line-height:1.3;font-weight:800">{TITLE}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 12px">
                <p style="margin:0;color:#94a3b8;font-size:15px;line-height:1.75">{BODY}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 32px 8px">
                <a href="{CTA_URL}" style="display:inline-block;border-radius:8px;background:#8b5cf6;color:#ffffff;font-size:14px;font-weight:700;line-height:1;text-decoration:none;padding:15px 20px">{CTA_LABEL}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:4px 32px 24px">
                <p style="margin:0;color:#64748b;font-size:12px;line-height:1.7">
                  Button not working? Open this link in your browser:<br/>
                  <a href="{CTA_URL}" style="color:#22d3ee;word-break:break-all">{CTA_URL_DISPLAY}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="border-top:1px solid #1f2937;padding:18px 32px">
                <p style="margin:0 0 6px;color:#94a3b8;font-size:12px;line-height:1.6">
                  You received this message because it was requested for the email address {EMAIL}.
                  If you did not request it, you can safely ignore this email.
                </p>
                <p style="margin:0;color:#64748b;font-size:11px;line-height:1.6">Moon Strike &middot; Help &amp; support at {SITE_URL}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`.trim()

export const MOONSTRIKE_CONFIRM_SIGNUP_HTML = SHELL_HEAD.replace(
  '{TITLE}',
  'Confirm your email address'
)
  .replace(
    '{BODY}',
    `Welcome to Moon Strike. To finish creating your account and unlock your profile, confirm that this email address belongs to you.`
  )
  .replace('{CTA_LABEL}', 'Confirm Email')
  .replaceAll('{CTA_URL}', '{{ .ConfirmationURL }}')
  .replaceAll('{CTA_URL_DISPLAY}', '{{ .ConfirmationURL }}')
  .replace('{EMAIL}', '{{ .Email }}')
  .replace('{SITE_URL}', '{{ .SiteURL }}')

export const MOONSTRIKE_RESET_PASSWORD_HTML = SHELL_HEAD.replace(
  '{TITLE}',
  'Reset your password'
)
  .replace(
    '{BODY}',
    `We received a request to change the password for your Moon Strike account. Click the button below to choose a new password. If you did not make this request, your password stays unchanged.`
  )
  .replace('{CTA_LABEL}', 'Change Password')
  .replaceAll('{CTA_URL}', '{{ .ConfirmationURL }}')
  .replaceAll('{CTA_URL_DISPLAY}', '{{ .ConfirmationURL }}')
  .replace('{EMAIL}', '{{ .Email }}')
  .replace('{SITE_URL}', '{{ .SiteURL }}')

export const MOONSTRIKE_CONFIRM_SIGNUP_TEXT = [
  'Moon Strike',
  'Dominate the game',
  '',
  'Confirm your email address',
  '',
  'Welcome to Moon Strike. To finish creating your account and unlock your profile, confirm that this email address belongs to you.',
  '',
  'Confirm Email: {{ .ConfirmationURL }}',
  '',
  'You received this message because it was requested for the email address {{ .Email }}. If you did not request it, you can safely ignore this email.',
  '',
  'Moon Strike - {{ .SiteURL }}',
].join('\n')

export const MOONSTRIKE_RESET_PASSWORD_TEXT = [
  'Moon Strike',
  'Dominate the game',
  '',
  'Reset your password',
  '',
  'We received a request to change the password for your Moon Strike account. Click the link below to choose a new password. If you did not make this request, your password stays unchanged.',
  '',
  'Change Password: {{ .ConfirmationURL }}',
  '',
  'You received this message because it was requested for the email address {{ .Email }}. If you did not request it, you can safely ignore this email.',
  '',
  'Moon Strike - {{ .SiteURL }}',
].join('\n')