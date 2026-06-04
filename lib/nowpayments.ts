import crypto from "crypto";

const DEFAULT_NOWPAYMENTS_API_BASE_URL = "https://api.nowpayments.io/v1";

function cleanEnvValue(value: string | undefined) {
  const cleaned = value?.replace(/\s+(\/\/|#).*$/, "").trim();

  if (!cleaned) return cleaned;

  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    return cleaned.slice(1, -1).trim();
  }

  return cleaned;
}

export function getNowPaymentsApiKey() {
  const key = cleanEnvValue(process.env.NOWPAYMENTS_API_KEY);

  if (!key) {
    throw new Error("Missing NOWPAYMENTS_API_KEY");
  }

  return key;
}

export function getNowPaymentsIpnSecret() {
  const secret = cleanEnvValue(process.env.NOWPAYMENTS_IPN_SECRET);

  if (!secret) {
    throw new Error("Missing NOWPAYMENTS_IPN_SECRET");
  }

  return secret;
}

export function getNowPaymentsApiBaseUrl() {
  const configuredUrl = cleanEnvValue(process.env.NOWPAYMENTS_API_BASE_URL);
  return (configuredUrl ?? DEFAULT_NOWPAYMENTS_API_BASE_URL).replace(/\/+$/, "");
}

export type NowPaymentsInvoice = {
  id: string;
  invoice_url: string;
};

type CreateNowPaymentsInvoiceInput = {
  priceAmount: number;
  priceCurrency: "usd" | "eur";
  orderId: string;
  orderDescription: string;
  ipnCallbackUrl: string;
  successUrl: string;
  cancelUrl: string;
};

function sortObject(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortObject);
  if (!value || typeof value !== "object") return value;

  return Object.keys(value)
    .sort()
    .reduce<Record<string, unknown>>((result, key) => {
      result[key] = sortObject((value as Record<string, unknown>)[key]);
      return result;
    }, {});
}

export async function createNowPaymentsInvoice(input: CreateNowPaymentsInvoiceInput) {
  const baseUrl = getNowPaymentsApiBaseUrl();
  let response: Response;

  try {
    response = await fetch(`${baseUrl}/invoice`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": getNowPaymentsApiKey(),
      },
      body: JSON.stringify({
        price_amount: input.priceAmount.toFixed(2),
        price_currency: input.priceCurrency,
        order_id: input.orderId,
        order_description: input.orderDescription,
        ipn_callback_url: input.ipnCallbackUrl,
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "network request failed";
    throw new Error(`NOWPayments request failed for ${baseUrl}: ${message}`);
  }

  const payload = (await response.json().catch(() => null)) as
    | (Partial<NowPaymentsInvoice> & { message?: string; error?: string })
    | null;

  if (!response.ok || !payload?.invoice_url || !payload.id) {
    const providerMessage = payload?.message ?? payload?.error ?? "NOWPayments did not return an invoice URL.";
    throw new Error(`NOWPayments ${response.status} from ${baseUrl}: ${providerMessage}`);
  }

  return {
    id: String(payload.id),
    invoice_url: payload.invoice_url,
  } satisfies NowPaymentsInvoice;
}

export function verifyNowPaymentsIpnSignature(body: unknown, signature: string | null) {
  if (!signature) return false;

  const hmac = crypto.createHmac("sha512", getNowPaymentsIpnSecret());
  hmac.update(JSON.stringify(sortObject(body)));
  const expected = hmac.digest("hex");

  if (expected.length !== signature.length) return false;

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
