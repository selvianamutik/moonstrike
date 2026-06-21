type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

type TransactionalEmailInput = {
  eyebrow?: string;
  title: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
  footer?: string;
};

type SendEmailResult =
  | { sent: true }
  | {
      sent: false;
      skippedReason: string;
    };

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export function appBaseUrl() {
  const explicitUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicitUrl) return explicitUrl.replace(/\/$/, "");

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) return `https://${vercelUrl}`.replace(/\/$/, "");

  return "http://localhost:3000";
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function renderMoonStrikeEmail(input: TransactionalEmailInput) {
  const safeEyebrow = escapeHtml(input.eyebrow ?? "MoonStrike");
  const safeTitle = escapeHtml(input.title);
  const safeBody = escapeHtml(input.body);
  const safeFooter = escapeHtml(input.footer ?? "Need help? Open your order chat or contact MoonStrike support.");
  const safeCtaLabel = input.ctaLabel ? escapeHtml(input.ctaLabel) : "";
  const safeCtaHref = input.ctaHref ? escapeHtml(input.ctaHref) : "";

  const textParts = [input.title, "", input.body];
  if (input.ctaHref) textParts.push("", `${input.ctaLabel ?? "Open MoonStrike"}: ${input.ctaHref}`);
  textParts.push("", input.footer ?? "Need help? Open your order chat or contact MoonStrike support.");

  const ctaHtml =
    input.ctaHref && input.ctaLabel
      ? `
          <tr>
            <td style="padding:0 32px 32px">
              <a href="${safeCtaHref}" style="display:inline-block;border-radius:8px;background:#8b5cf6;color:#ffffff;font-size:14px;font-weight:700;line-height:1;text-decoration:none;padding:14px 18px">
                ${safeCtaLabel}
              </a>
            </td>
          </tr>
        `
      : "";

  return {
    text: textParts.join("\n"),
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
                      <div style="font-size:12px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#22d3ee">${safeEyebrow}</div>
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
                  ${ctaHtml}
                  <tr>
                    <td style="border-top:1px solid #1f2937;padding:18px 32px">
                      <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6">${safeFooter}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  };
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();

  if (!apiKey) {
    return { sent: false, skippedReason: "RESEND_API_KEY is not configured." };
  }

  if (!from) {
    return { sent: false, skippedReason: "RESEND_FROM_EMAIL is not configured." };
  }

  if (!input.to.trim()) {
    return { sent: false, skippedReason: "Recipient email is empty." };
  }

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error(`Email provider rejected request: ${response.status} ${detail}`);
      return { sent: false, skippedReason: "Email provider rejected the request." };
    }

    return { sent: true };
  } catch (error) {
    console.error("Email provider request failed", error);
    return { sent: false, skippedReason: "Email provider request failed." };
  }
}
