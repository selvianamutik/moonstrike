const FRANKFURTER_URL = "https://api.frankfurter.app/latest?from=USD&to=EUR";

type FrankfurterResponse = {
  amount: number;
  base: string;
  date: string;
  rates: {
    EUR: number;
  };
};

let lastRate: { rate: number; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 menit cache in-memory

export class CurrencyConversionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CurrencyConversionError";
  }
}

export async function usdToEur(usdAmount: number): Promise<number> {
  if (!usdAmount || usdAmount <= 0) return 0;

  const rate = await fetchUsdToEurRate();
  const eur = usdAmount * rate;

  return Math.round(eur * 100) / 100;
}

async function fetchUsdToEurRate(): Promise<number> {
  if (lastRate && Date.now() - lastRate.fetchedAt < CACHE_TTL_MS) {
    return lastRate.rate;
  }

  const response = await fetch(FRANKFURTER_URL, {
    next: { revalidate: 600 },
  });

  if (!response.ok) {
    throw new CurrencyConversionError(
      `Failed to fetch exchange rate: ${response.status} ${response.statusText}`,
    );
  }

  const data: FrankfurterResponse = await response.json();

  if (!data?.rates?.EUR) {
    throw new CurrencyConversionError(
      "Invalid exchange rate response: missing EUR rate",
    );
  }

  lastRate = { rate: data.rates.EUR, fetchedAt: Date.now() };

  return data.rates.EUR;
}

export function convertServicePrices(priceUSD: number, schema?: Record<string, unknown>) {
  return {
    priceUSD,
    schema: schema ? convertOptionPrices(schema) : undefined,
  };
}

export function convertOptionPrices(schema: Record<string, unknown>): Record<string, unknown> {
  const converted: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(schema)) {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      converted[key] = convertOptionPrices(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      converted[key] = value.map((item) => {
        if (typeof item === "object" && item !== null) {
          return convertOptionPrices(item as Record<string, unknown>);
        }
        return item;
      });
    } else {
      converted[key] = value;
    }
  }

  return converted;
}
