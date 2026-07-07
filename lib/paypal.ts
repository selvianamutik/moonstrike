/**
 * PayPal REST API integration for checkout and refunds
 * Uses OAuth 2.0 authentication and Orders v2 API
 */

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_API_BASE = process.env.PAYPAL_API_BASE_URL || "https://api-m.sandbox.paypal.com";

if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
  console.warn("PayPal credentials not configured. PayPal payments will not be available.");
}

type PayPalAccessTokenResponse = {
  scope: string;
  access_token: string;
  token_type: string;
  app_id: string;
  expires_in: number;
  nonce: string;
};

type PayPalOrderItem = {
  name: string;
  description?: string;
  quantity: string;
  unit_amount: {
    currency_code: string;
    value: string;
  };
};

type PayPalCreateOrderInput = {
  items: PayPalOrderItem[];
  currency: string;
  returnUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
};

type PayPalOrderResponse = {
  id: string;
  status: string;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
  purchase_units?: Array<{
    reference_id?: string;
    payments?: {
      captures?: Array<{
        id: string;
        status: string;
        amount: {
          currency_code: string;
          value: string;
        };
      }>;
    };
    payee?: {
      merchant_id?: string;
    };
  }>;
};

type PayPalCaptureResponse = {
  id: string;
  status: string;
  purchase_units: Array<{
    reference_id: string;
    payments: {
      captures: Array<{
        id: string;
        status: string;
        amount: {
          currency_code: string;
          value: string;
        };
      }>;
    };
  }>;
};

type PayPalRefundInput = {
  captureId: string;
  amount: {
    currency_code: string;
    value: string;
  };
  note_to_payer?: string;
};

type PayPalRefundResponse = {
  id: string;
  status: string;
  amount: {
    currency_code: string;
    value: string;
  };
};

let cachedAccessToken: string | null = null;
let tokenExpiresAt = 0;

/**
 * Get PayPal OAuth 2.0 access token with caching
 */
async function getAccessToken(): Promise<string> {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error("PayPal credentials not configured. Please set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in environment variables.");
  }

  if (cachedAccessToken && Date.now() < tokenExpiresAt) {
    return cachedAccessToken;
  }

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64");

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PayPal auth failed: ${response.status} ${response.statusText}`);
  }

  const data: PayPalAccessTokenResponse = await response.json();
  cachedAccessToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000; // Refresh 1 min early

  return cachedAccessToken;
}

/**
 * Create a PayPal order for checkout
 */
export async function createPayPalOrder(input: PayPalCreateOrderInput): Promise<PayPalOrderResponse> {
  const accessToken = await getAccessToken();

  const totalAmount = input.items.reduce((sum, item) => {
    return sum + parseFloat(item.unit_amount.value) * parseInt(item.quantity);
  }, 0);

  const requestBody = {
    intent: "CAPTURE",
    purchase_units: [
      {
        reference_id: input.metadata?.checkoutSessionId || "default",
        amount: {
          currency_code: input.currency,
          value: totalAmount.toFixed(2),
          breakdown: {
            item_total: {
              currency_code: input.currency,
              value: totalAmount.toFixed(2),
            },
          },
        },
        items: input.items,
        custom_id: input.metadata?.checkoutSessionId,
      },
    ],
    application_context: {
      return_url: input.returnUrl,
      cancel_url: input.cancelUrl,
      brand_name: "Moon Strike",
      landing_page: "NO_PREFERENCE",
      user_action: "PAY_NOW",
    },
  };

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PayPal create order failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

/**
 * Capture payment for an approved PayPal order
 */
export async function capturePayPalOrder(orderId: string): Promise<PayPalCaptureResponse> {
  const accessToken = await getAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PayPal capture failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

/**
 * Get PayPal order details
 */
export async function getPayPalOrder(orderId: string): Promise<PayPalOrderResponse> {
  const accessToken = await getAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PayPal get order failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

/**
 * Refund a captured PayPal payment
 */
export async function refundPayPalCapture(input: PayPalRefundInput): Promise<PayPalRefundResponse> {
  const accessToken = await getAccessToken();

  const requestBody = {
    amount: input.amount,
    note_to_payer: input.note_to_payer || "Refund processed by Moon Strike",
  };

  const response = await fetch(`${PAYPAL_API_BASE}/v2/payments/captures/${input.captureId}/refund`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PayPal refund failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

/**
 * Check if PayPal is properly configured
 */
export function isPayPalConfigured(): boolean {
  return Boolean(PAYPAL_CLIENT_ID && PAYPAL_CLIENT_SECRET);
}
