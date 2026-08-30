import Stripe from 'stripe';
import { getUsdExchangeRate } from './fx-service.js';

/**
 * Lazy Stripe Client Getter
 */
let stripeInstance = null;
export function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY no está configurada en las variables de entorno (.env).');
  }
  if (!stripeInstance) {
    stripeInstance = new Stripe(secretKey);
  }
  return stripeInstance;
}

/**
 * Builds dynamic Stripe line items based on selected modules, environments, billing cycle, and FX rate.
 */
export function buildSubscriptionLineItems({
  environmentsCount = 1,
  selectedOptionalModules = {},
  newsletterEmailTier = '500_included',
  storageTier = 'included',
  billingCycle = 'monthly',
  currency = 'usd',
  fxRate = 1
}) {
  const isAnnual = billingCycle === 'annual';
  const multiplier = isAnnual ? 10 : 1;
  const interval = isAnnual ? 'year' : 'month';
  const curr = (currency || 'usd').toLowerCase();
  const rate = typeof fxRate === 'number' && fxRate > 0 ? fxRate : 1;

  const toCents = (usdAmount) => Math.round(usdAmount * multiplier * rate * 100);

  const lineItems = [];

  // 1. Core Platform Base ($14 / mo base in USD)
  const coreBaseMonthlyUsd = 14;
  lineItems.push({
    price_data: {
      currency: curr,
      product_data: {
        name: 'Membresía Base Montessori Nexus (Core Platform)',
        description: 'Incluye Lista de Espera, Portal Familias, Portal Guías, Seguimiento Montessori y Asistencia.'
      },
      unit_amount: toCents(coreBaseMonthlyUsd),
      recurring: { interval }
    },
    quantity: 1
  });

  // 2. Environments Tiered Calculation ($25 1st, $10 each additional)
  const count = Math.max(1, environmentsCount);
  if (count === 1) {
    lineItems.push({
      price_data: {
        currency: curr,
        product_data: {
          name: 'Ambiente Montessori Principal (1er Salón)',
          description: 'Licencia activa para el primer ambiente Montessori.'
        },
        unit_amount: toCents(25),
        recurring: { interval }
      },
      quantity: 1
    });
  } else {
    lineItems.push({
      price_data: {
        currency: curr,
        product_data: {
          name: 'Ambiente Montessori Principal (1er Salón)',
          description: 'Licencia activa para el primer ambiente Montessori.'
        },
        unit_amount: toCents(25),
        recurring: { interval }
      },
      quantity: 1
    });
    lineItems.push({
      price_data: {
        currency: curr,
        product_data: {
          name: 'Ambientes Montessori Adicionales (50% Desc.)',
          description: 'Salones adicionales con tarifa reducida de $10 USD/mes cada uno.'
        },
        unit_amount: toCents(10),
        recurring: { interval }
      },
      quantity: count - 1
    });
  }

  // 3. Optional Modules (Prices in USD)
  if (selectedOptionalModules.finances) {
    lineItems.push({
      price_data: {
        currency: curr,
        product_data: {
          name: 'Módulo: Finanzas Escolares & Facturación',
          description: 'Gestión de colegiaturas, planes de pago, recibos y reportes financieros.'
        },
        unit_amount: toCents(12),
        recurring: { interval }
      },
      quantity: 1
    });
  }

  if (selectedOptionalModules.websiteBuilder) {
    lineItems.push({
      price_data: {
        currency: curr,
        product_data: {
          name: 'Módulo: Creador de Sitio Web Escolar',
          description: 'Página web pública personalizada con SEO optimizado y dominio propio.'
        },
        unit_amount: toCents(18),
        recurring: { interval }
      },
      quantity: 1
    });
  }

  if (selectedOptionalModules.forms) {
    lineItems.push({
      price_data: {
        currency: curr,
        product_data: {
          name: 'Módulo: Formularios Dinámicos & Encuestas',
          description: 'Constructor visual de cuestionarios, inscripciones y consentimientos.'
        },
        unit_amount: toCents(9),
        recurring: { interval }
      },
      quantity: 1
    });
  }

  if (selectedOptionalModules.pipelines) {
    lineItems.push({
      price_data: {
        currency: curr,
        product_data: {
          name: 'Módulo: CRM & Pipelines de Admisión',
          description: 'Embudo de conversión de aspirantes, seguimiento de prospectos y etapas.'
        },
        unit_amount: toCents(9),
        recurring: { interval }
      },
      quantity: 1
    });
  }

  if (selectedOptionalModules.newsletterSmtp) {
    const tierExtraUnits = {
      '500_included': 0,
      '1000_emails': 1,
      '2000_emails': 3,
      '3000_emails': 5,
      'byo_smtp': 0
    }[newsletterEmailTier] || 0;

    const baseNewsletterPrice = 3.99;
    const newsletterTotalMonthlyUsd = baseNewsletterPrice + (tierExtraUnits * 3.99);

    lineItems.push({
      price_data: {
        currency: curr,
        product_data: {
          name: `Módulo: Boletines & Newsletters (${newsletterEmailTier})`,
          description: 'Envío de comunicados escolares vía correo electrónico y gestión de audiencias.'
        },
        unit_amount: toCents(newsletterTotalMonthlyUsd),
        recurring: { interval }
      },
      quantity: 1
    });
  }

  // 4. Cloud Storage Tiers (USD)
  let storageCostMonthlyUsd = 0;
  let storageLabel = '';
  if (storageTier === '12gb') {
    storageCostMonthlyUsd = 5;
    storageLabel = '+10 GB Adicionales (Total 12 GB)';
  } else if (storageTier === '22gb') {
    storageCostMonthlyUsd = 10;
    storageLabel = '+20 GB Adicionales (Total 22 GB)';
  } else if (storageTier === '52gb') {
    storageCostMonthlyUsd = 25;
    storageLabel = '+50 GB Adicionales (Total 52 GB)';
  }

  if (storageCostMonthlyUsd > 0) {
    lineItems.push({
      price_data: {
        currency: curr,
        product_data: {
          name: `Almacenamiento Cloud ${storageLabel}`,
          description: 'Espacio dedicado en la nube para documentos escolares y galerías fotográficas.'
        },
        unit_amount: toCents(storageCostMonthlyUsd),
        recurring: { interval }
      },
      quantity: 1
    });
  }

  return lineItems;
}

/**
 * Creates a Stripe Checkout Session for custom on-the-fly subscriptions with FX conversion.
 */
export async function createStripeSubscriptionCheckoutSession({
  school,
  selectedOptionalModules = {},
  newsletterEmailTier = '500_included',
  storageTier = 'included',
  billingCycle = 'monthly',
  environmentsCount = 1,
  successUrl,
  cancelUrl
}) {
  const stripe = getStripeClient();

  const targetCurrency = (school.currency || 'USD').toUpperCase();
  const fxRate = await getUsdExchangeRate(targetCurrency);

  const lineItems = buildSubscriptionLineItems({
    environmentsCount,
    selectedOptionalModules,
    newsletterEmailTier,
    storageTier,
    billingCycle,
    currency: targetCurrency.toLowerCase(),
    fxRate
  });

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: lineItems,
    client_reference_id: school.id,
    customer_email: school.email || undefined,
    billing_address_collection: 'auto',
    metadata: {
      schoolId: school.id,
      schoolSlug: school.slug,
      billingCycle,
      environmentsCount: String(environmentsCount),
      storageTier,
      newsletterEmailTier,
      currency: targetCurrency,
      fxRate: String(fxRate),
      modules: JSON.stringify(selectedOptionalModules)
    },
    subscription_data: {
      metadata: {
        schoolId: school.id,
        schoolSlug: school.slug,
        billingCycle,
        currency: targetCurrency,
        fxRate: String(fxRate)
      }
    },
    success_url: successUrl,
    cancel_url: cancelUrl
  });

  return { session, fxRate, currency: targetCurrency };
}

/**
 * Creates a Stripe Customer Billing Portal Session so schools can update their card or cancel.
 */
export async function createStripeBillingPortalSession({ customerId, returnUrl }) {
  const stripe = getStripeClient();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl
  });
  return session;
}
