// ─── lib/payment.js ──────────────────────────────────────────────────────────
// Razorpay integration + local subscription management
// ─────────────────────────────────────────────────────────────────────────────

// ── CONFIG ────────────────────────────────────────────────────────────────────
// Set these in your .env.local:
//   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXXXXXX
//   RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXXXXXXXX  (server-side only)

export const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_XXXXXXXXXXXXXXXX';

// ── PLANS ─────────────────────────────────────────────────────────────────────
export const PLANS = {
  monthly: {
    id:          'monthly',
    label:       'Monthly',
    price:       299,          // ₹ 299 / month
    originalPrice: 499,
    currency:    'INR',
    description: 'Full access for 30 days',
    features: [
      'Unlimited Recorded Lectures',
      'All Chapter MCQ Tests',
      'Mock Tests (unlimited)',
      'Priority Support',
      'Downloadable Notes PDF',
    ],
    badge:       null,
    durationDays: 30,
  },
  quarterly: {
    id:           'quarterly',
    label:        'Quarterly',
    price:        699,         // ₹ 699 / 3 months
    originalPrice: 1497,
    currency:     'INR',
    description:  'Full access for 90 days',
    features: [
      'Everything in Monthly',
      '1 Free Doubt Session',
      'Previous Year Question Papers',
      'Performance Analytics',
    ],
    badge:        '🔥 Most Popular',
    durationDays: 90,
  },
  yearly: {
    id:           'yearly',
    label:        'Yearly',
    price:        1999,        // ₹ 1999 / year
    originalPrice: 5988,
    currency:     'INR',
    description:  'Full access for 365 days',
    features: [
      'Everything in Quarterly',
      '3 Free 1-on-1 Mentoring Sessions',
      'Personalised Study Plan',
      'Exam Day Strategy Guide',
      'WhatsApp Group Access',
    ],
    badge:        '⭐ Best Value',
    durationDays: 365,
  },
};

// ── LOCAL STORAGE HELPERS ─────────────────────────────────────────────────────

const SUB_KEY = 'dgca_subscription';

/** Read subscription from localStorage */
export function getSubscription() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SUB_KEY);
    if (!raw) return null;
    const sub = JSON.parse(raw);
    // Auto-expire check
    if (sub.expiresAt && new Date(sub.expiresAt) < new Date()) {
      localStorage.removeItem(SUB_KEY);
      return null;
    }
    return sub;
  } catch { return null; }
}

/** Save subscription to localStorage */
export function setSubscription(sub) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SUB_KEY, JSON.stringify(sub));
}

/** Clear subscription */
export function clearSubscription() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SUB_KEY);
}

/** Check if user has an active subscription */
export function isSubscribed() {
  const sub = getSubscription();
  return !!sub && sub.status === 'active';
}

/** Days remaining in subscription */
export function daysRemaining() {
  const sub = getSubscription();
  if (!sub || !sub.expiresAt) return 0;
  const diff = new Date(sub.expiresAt) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// ── RAZORPAY LOADER ───────────────────────────────────────────────────────────

let razorpayLoaded = false;

function loadRazorpay() {
  return new Promise((resolve) => {
    if (razorpayLoaded || window.Razorpay) { resolve(true); return; }
    const script   = document.createElement('script');
    script.src     = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload  = () => { razorpayLoaded = true; resolve(true); };
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// ── MAIN PAYMENT FUNCTION ─────────────────────────────────────────────────────

/**
 * Opens Razorpay checkout for a given plan.
 *
 * @param {object}   params
 * @param {string}   params.planId          - 'monthly' | 'quarterly' | 'yearly'
 * @param {object}   params.user            - { name, email }
 * @param {Function} params.onSuccess       - called with subscription object on payment success
 * @param {Function} [params.onFailure]     - called with error message on failure
 * @param {Function} [params.onDismiss]     - called when modal is closed without paying
 */
export async function openPayment({ planId, user, onSuccess, onFailure, onDismiss }) {
  const plan = PLANS[planId];
  if (!plan) { onFailure?.('Invalid plan selected.'); return; }

  // 1. Load Razorpay SDK
  const loaded = await loadRazorpay();
  if (!loaded) {
    onFailure?.('Payment gateway failed to load. Please check your internet connection.');
    return;
  }

  // 2. Create order on your backend  →  POST /api/payment/create-order
  let order;
  try {
    const res = await fetch('/api/payment/create-order', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ planId, email: user.email }),
    });
    if (!res.ok) throw new Error('Order creation failed');
    order = await res.json();
  } catch (err) {
    // ─── DEMO / TEST MODE (no backend) ──────────────────────────────────────
    // If no backend is wired up yet, we simulate a successful payment locally.
    // Remove this block once your /api/payment/create-order is live.
    console.warn('[payment.js] No backend — running in DEMO mode');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + plan.durationDays);
    const mockSub = {
      status:      'active',
      planId,
      planLabel:   plan.label,
      price:       plan.price,
      email:       user.email,
      paymentId:   'demo_' + Date.now(),
      orderId:     'order_demo_' + Date.now(),
      activatedAt: new Date().toISOString(),
      expiresAt:   expiresAt.toISOString(),
      durationDays: plan.durationDays,
    };
    setSubscription(mockSub);
    onSuccess?.(mockSub);
    return;
    // ────────────────────────────────────────────────────────────────────────
  }

  // 3. Open Razorpay checkout
  const rzpOptions = {
    key:          RAZORPAY_KEY_ID,
    amount:       plan.price * 100,   // paise
    currency:     plan.currency,
    name:         'DGCA Prep',
    description:  plan.description,
    image:        '/logo.png',        // your logo (optional)
    order_id:     order.id,
    prefill: {
      name:  user.name,
      email: user.email,
    },
    theme:  { color: '#1D4ED8' },
    modal: {
      ondismiss: () => onDismiss?.(),
    },
    handler: async (response) => {
      // 4. Verify payment on backend  →  POST /api/payment/verify
      try {
        const verifyRes = await fetch('/api/payment/verify', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            razorpay_order_id:   response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature:  response.razorpay_signature,
            planId,
            email: user.email,
          }),
        });
        if (!verifyRes.ok) throw new Error('Verification failed');
        const verified = await verifyRes.json();

        // 5. Save subscription locally
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + plan.durationDays);
        const sub = {
          status:       'active',
          planId,
          planLabel:    plan.label,
          price:        plan.price,
          email:        user.email,
          paymentId:    response.razorpay_payment_id,
          orderId:      response.razorpay_order_id,
          activatedAt:  new Date().toISOString(),
          expiresAt:    expiresAt.toISOString(),
          durationDays: plan.durationDays,
          ...verified,
        };
        setSubscription(sub);
        onSuccess?.(sub);
      } catch (err) {
        onFailure?.(err.message || 'Payment verification failed. Please contact support.');
      }
    },
  };

  const rzp = new window.Razorpay(rzpOptions);
  rzp.on('payment.failed', (response) => {
    onFailure?.(response.error?.description || 'Payment failed. Please try again.');
  });
  rzp.open();
}

// ── ADMIN HELPERS ─────────────────────────────────────────────────────────────

/** Manually grant subscription (admin use) */
export function grantSubscription(email, planId = 'yearly') {
  const plan      = PLANS[planId] || PLANS.yearly;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + plan.durationDays);
  const sub = {
    status:       'active',
    planId,
    planLabel:    plan.label,
    price:        0,
    email,
    paymentId:    'admin_grant_' + Date.now(),
    orderId:      'admin_' + Date.now(),
    activatedAt:  new Date().toISOString(),
    expiresAt:    expiresAt.toISOString(),
    durationDays: plan.durationDays,
    isAdmin:      true,
  };
  setSubscription(sub);
  return sub;
}