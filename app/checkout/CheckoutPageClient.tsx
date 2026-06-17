'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Lock, CreditCard, Check, AlertCircle, Loader2 } from 'lucide-react';
import { OrderSummary } from '@/components/order-summary';
import { SiteFooter } from '@/components/site-footer';
import { useCart } from '@/context/CartContext';
import { calculateOrderTotals } from '@/lib/catalog';

type PaymentMethod = 'credit_card' | 'paypal' | 'crypto';

type FormErrors = {
  cardName?: string;
  cardNumber?: string;
  expiryDate?: string;
  cvc?: string;
};

export function CheckoutPageClient() {
  const { items, subtotal, clearCart } = useCart();
  const totals = calculateOrderTotals(subtotal);

  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('credit_card');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    cardName: '',
    cardNumber: '',
    expiryDate: '',
    cvc: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = useCallback((name: string, value: string): string | undefined => {
    switch (name) {
      case 'cardName':
        if (!value.trim()) return 'Name on card is required';
        if (value.trim().length < 2) return 'Please enter a valid name';
        return undefined;

      case 'cardNumber':
        const digitsOnly = value.replace(/\s/g, '');
        if (!digitsOnly) return 'Card number is required';
        if (!/^\d+$/.test(digitsOnly)) return 'Card number must contain only digits';
        if (digitsOnly.length < 13 || digitsOnly.length > 19) return 'Please enter a valid card number';
        return undefined;

      case 'expiryDate':
        if (!value) return 'Expiry date is required';
        const [month, year] = value.split('/');
        if (!month || !year) return 'Use MM/YY format';
        const monthNum = parseInt(month, 10);
        if (monthNum < 1 || monthNum > 12) return 'Invalid month';
        const yearNum = parseInt('20' + year, 10);
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        if (yearNum < currentYear || (yearNum === currentYear && monthNum < currentMonth)) {
          return 'Card has expired';
        }
        return undefined;

      case 'cvc':
        if (!value) return 'CVC is required';
        if (!/^\d{3,4}$/.test(value)) return 'CVC must be 3 or 4 digits';
        return undefined;

      default:
        return undefined;
    }
  }, []);

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target;

    if (name === 'cardNumber') {
      value = value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').trim();
      if (value.length > 19) value = value.slice(0, 19);
    }

    if (name === 'expiryDate') {
      value = value.replace(/\D/g, '');
      if (value.length >= 2) {
        value = value.slice(0, 2) + '/' + value.slice(2, 4);
      }
    }

    if (name === 'cvc') {
      value = value.replace(/\D/g, '').slice(0, 4);
    }

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (touched[name]) {
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let hasErrors = false;

    (['cardName', 'cardNumber', 'expiryDate', 'cvc'] as const).forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
        hasErrors = true;
      }
    });

    setErrors(newErrors);
    setTouched({ cardName: true, cardNumber: true, expiryDate: true, cvc: true });
    return !hasErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      const firstError = document.querySelector('[aria-invalid="true"]');
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setIsSubmitting(true);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsSubmitting(false);
    setIsSubmitted(true);
    clearCart();
  };

  if (isSubmitted) {
    return (
      <main className="min-h-screen bg-[var(--ms-bg-page)] text-[var(--ms-heading)]">
        <header className="border-b border-[var(--ms-border)]">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-10">
            <Link href="/" className="text-2xl font-black">
              <span className="brand-gradient">Moon Strike</span>
            </Link>
            <span />
          </div>
        </header>

        <section className="mx-auto max-w-2xl px-10 py-20 text-center">
          <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--ms-success)]/20 mx-auto">
            <Check className="h-10 w-10 text-[var(--ms-success)]" />
          </div>
          <h1 className="font-display text-4xl font-black">Order Confirmed!</h1>
          <p className="mt-4 text-[var(--ms-body)]">
            Your order <span className="font-bold text-[var(--ms-heading)]">MS-2401</span> has been placed successfully.
            Our team will start working on it shortly.
          </p>
          <div
            role="alert"
            aria-live="polite"
            className="mt-6 rounded-lg border border-[var(--ms-success)]/30 bg-[var(--ms-success)]/10 p-4 text-left"
          >
            <p className="text-sm text-[var(--ms-body)]">
              A confirmation email has been sent. You can track your order progress in your profile dashboard.
            </p>
          </div>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/profile/orders/MS-2401"
              className="ms-button flex h-14 items-center justify-center rounded-md px-8 text-lg font-black"
            >
              View Order Details
            </Link>
            <Link
              href="/games"
              className="flex h-14 items-center justify-center rounded-md border border-[var(--ms-border)] px-8 font-bold transition-colors hover:bg-[var(--ms-hover-bg)]"
            >
              Continue Shopping
            </Link>
          </div>
        </section>
        <SiteFooter />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--ms-bg-page)] text-[var(--ms-heading)]">
      <header className="border-b border-[var(--ms-border)]">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-10">
          <Link href="/cart" className="text-[var(--ms-body)] hover:text-[var(--ms-heading)] transition-colors">
            Back to Cart
          </Link>
          <Link href="/" className="text-2xl font-black">
            <span className="brand-gradient">Moon Strike</span>
          </Link>
          <span />
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-12 px-10 py-20 lg:grid-cols-[1fr_450px]">
        <div>
          <h1 className="font-display text-4xl font-black">Secure Checkout</h1>
          <p className="mt-4 text-[var(--ms-body)]">Complete your transaction to dominate the game.</p>

          <h2 className="mt-12 text-2xl font-black">Payment Method</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {(
              [
                { id: 'credit_card', label: 'Credit Card', icon: CreditCard },
                { id: 'paypal', label: 'PayPal', icon: CreditCard },
                { id: 'crypto', label: 'Crypto', icon: CreditCard },
              ] as const
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSelectedPayment(id)}
                aria-pressed={selectedPayment === id}
                className={`flex h-24 flex-col items-center justify-center gap-2 rounded-md border mono text-sm uppercase transition-all ${
                  selectedPayment === id
                    ? 'border-[var(--ms-gradient-end)] bg-[var(--ms-hover-bg)] shadow-[0_0_22px_rgba(165,97,202,0.35)]'
                    : 'border-[var(--ms-border)] bg-[var(--ms-bg-card)] text-[var(--ms-body)] hover:border-[var(--ms-body)]'
                }`}
              >
                <Icon className="h-6 w-6" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {selectedPayment === 'credit_card' && (
            <form onSubmit={handleSubmit} className="ms-card mt-12 rounded-xl p-8" noValidate>
              <h2 className="text-xl font-medium">Card Details</h2>

              <div className="mt-8">
                <label htmlFor="cardName" className="block mono text-xs uppercase text-[var(--ms-body)]">
                  Name on Card
                </label>
                <input
                  type="text"
                  id="cardName"
                  name="cardName"
                  value={formData.cardName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="John Doe"
                  autoComplete="cc-name"
                  aria-describedby={errors.cardName ? 'cardName-error' : undefined}
                  aria-invalid={touched.cardName && !!errors.cardName}
                  className={`mt-2 h-13 w-full rounded-md border bg-[var(--ms-field)] px-4 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ms-primary)] ${
                    touched.cardName && errors.cardName
                      ? 'border-[var(--ms-danger)]'
                      : 'border-[var(--ms-border)]'
                  }`}
                />
                {touched.cardName && errors.cardName && (
                  <p id="cardName-error" role="alert" className="mt-2 flex items-center gap-2 text-sm text-[var(--ms-danger)]">
                    <AlertCircle className="h-4 w-4" />
                    {errors.cardName}
                  </p>
                )}
              </div>

              <div className="mt-6">
                <label htmlFor="cardNumber" className="block mono text-xs uppercase text-[var(--ms-body)]">
                  Card Number
                </label>
                <input
                  type="text"
                  id="cardNumber"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="0000 0000 0000 0000"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  aria-describedby={errors.cardNumber ? 'cardNumber-error' : undefined}
                  aria-invalid={touched.cardNumber && !!errors.cardNumber}
                  className={`mt-2 h-13 w-full rounded-md border bg-[var(--ms-field)] px-4 font-mono tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ms-primary)] ${
                    touched.cardNumber && errors.cardNumber
                      ? 'border-[var(--ms-danger)]'
                      : 'border-[var(--ms-border)]'
                  }`}
                />
                {touched.cardNumber && errors.cardNumber && (
                  <p id="cardNumber-error" role="alert" className="mt-2 flex items-center gap-2 text-sm text-[var(--ms-danger)]">
                    <AlertCircle className="h-4 w-4" />
                    {errors.cardNumber}
                  </p>
                )}
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div>
                  <label htmlFor="expiryDate" className="block mono text-xs uppercase text-[var(--ms-body)]">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    id="expiryDate"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="MM/YY"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    aria-describedby={errors.expiryDate ? 'expiryDate-error' : undefined}
                    aria-invalid={touched.expiryDate && !!errors.expiryDate}
                    className={`mt-2 h-13 w-full rounded-md border bg-[var(--ms-field)] px-4 text-center font-mono transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ms-primary)] ${
                      touched.expiryDate && errors.expiryDate
                        ? 'border-[var(--ms-danger)]'
                        : 'border-[var(--ms-border)]'
                    }`}
                  />
                  {touched.expiryDate && errors.expiryDate && (
                    <p id="expiryDate-error" role="alert" className="mt-2 flex items-center gap-2 text-sm text-[var(--ms-danger)]">
                      <AlertCircle className="h-4 w-4" />
                      {errors.expiryDate}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="cvc" className="block mono text-xs uppercase text-[var(--ms-body)]">
                    CVC
                  </label>
                  <input
                    type="text"
                    id="cvc"
                    name="cvc"
                    value={formData.cvc}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="123"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    aria-describedby={errors.cvc ? 'cvc-error' : undefined}
                    aria-invalid={touched.cvc && !!errors.cvc}
                    className={`mt-2 h-13 w-full rounded-md border bg-[var(--ms-field)] px-4 text-center font-mono transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ms-primary)] ${
                      touched.cvc && errors.cvc ? 'border-[var(--ms-danger)]' : 'border-[var(--ms-border)]'
                    }`}
                  />
                  {touched.cvc && errors.cvc && (
                    <p id="cvc-error" role="alert" className="mt-2 flex items-center gap-2 text-sm text-[var(--ms-danger)]">
                      <AlertCircle className="h-4 w-4" />
                      {errors.cvc}
                    </p>
                  )}
                </div>
              </div>

              {submitError && (
                <div role="alert" className="mt-6 rounded-lg border border-[var(--ms-danger)] bg-[var(--ms-danger)]/10 p-4">
                  <p className="flex items-center gap-2 text-[var(--ms-danger)]">
                    <AlertCircle className="h-5 w-5" />
                    {submitError}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="ms-button mt-8 flex h-14 w-full items-center justify-center gap-3 rounded-md text-lg font-black disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Lock className="h-5 w-5" />
                    Complete Purchase
                  </>
                )}
              </button>
            </form>
          )}

          {(selectedPayment === 'paypal' || selectedPayment === 'crypto') && (
            <div className="ms-card mt-12 rounded-xl p-8 text-center">
              <p className="text-[var(--ms-body)]">
                {selectedPayment === 'paypal'
                  ? 'You will be redirected to PayPal to complete your payment.'
                  : 'You will be redirected to complete your cryptocurrency payment.'}
              </p>
              <button
                onClick={() => {
                  setIsSubmitting(true);
                  setTimeout(() => {
                    setIsSubmitting(false);
                    setIsSubmitted(true);
                    clearCart();
                  }, 2000);
                }}
                disabled={isSubmitting}
                className="ms-button mt-6 flex h-14 w-full items-center justify-center gap-3 rounded-md text-lg font-black disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Redirecting...
                  </>
                ) : (
                  <>
                    <Lock className="h-5 w-5" />
                    Continue to {selectedPayment === 'paypal' ? 'PayPal' : 'Payment'}
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <OrderSummary
          ctaHref="/profile/orders/MS-2401"
          ctaLabel="Complete Purchase"
          rows={[
            { label: 'Subtotal', value: `$${totals.subtotal.toFixed(2)}` },
            { label: 'Service Fee', value: `$${totals.serviceFee.toFixed(2)}` },
            { label: 'Discount', value: `-$${totals.discount.toFixed(2)}` },
            { label: 'Taxes', value: `$${totals.taxes.toFixed(2)}` },
          ]}
          serviceName={`${items.length} configured service${items.length !== 1 ? 's' : ''}`}
          serviceMeta="Immediate Start"
          total={`$${totals.total.toFixed(2)}`}
        />
      </section>
      <SiteFooter />
    </main>
  );
}
