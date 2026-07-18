const BaseGateway = require('./BaseGateway');

class StripeGateway extends BaseGateway {
  constructor() {
    super();
    this.name = 'stripe';
    this.displayName = 'Credit/Debit Card (Stripe)';
    this.countries = []; // Available in all countries except India for primary
    this.isActive = true;
    this.stripe = null;
  }

  _getStripe() {
    if (!this.stripe) {
      const stripe = require('stripe');
      this.stripe = stripe(process.env.STRIPE_SECRET_KEY);
    }
    return this.stripe;
  }

  async createPayment(orderData) {
    const { items, subtotal, shippingCost, taxAmount, discountAmount, total, currency = 'usd' } = orderData;
    const amountInCents = Math.round(total * 100);
    const stripe = this._getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      metadata: {
        gateway: 'stripe',
        items_count: (items || []).length.toString(),
        order_total: total.toString()
      },
      automatic_payment_methods: { enabled: true }
    });
    return {
      success: true,
      gateway: this.name,
      transactionId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      metadata: { paymentIntentId: paymentIntent.id }
    };
  }

  async confirmPayment(paymentData) {
    const { transactionId } = paymentData;
    const stripe = this._getStripe();
    const paymentIntent = await stripe.paymentIntents.retrieve(transactionId);
    if (paymentIntent.status === 'succeeded') {
      return { success: true, status: 'completed', transactionId, gateway: this.name, raw: paymentIntent };
    }
    if (paymentIntent.status === 'processing') {
      return { success: true, status: 'pending', transactionId, gateway: this.name, raw: paymentIntent };
    }
    return { success: false, status: 'failed', transactionId, gateway: this.name, error: paymentIntent.last_payment_error?.message || 'Payment failed' };
  }

  async processRefund(transaction, amount) {
    const stripe = this._getStripe();
    const refund = await stripe.refunds.create({
      payment_intent: transaction.transactionId,
      amount: amount ? Math.round(amount * 100) : undefined
    });
    return { success: true, refundId: refund.id, amount: refund.amount / 100, status: refund.status };
  }

  async verifyWebhook(payload, signature) {
    const stripe = this._getStripe();
    try {
      const event = stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);
      return { success: true, event };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  getClientConfig() {
    return {
      ...super.getClientConfig(),
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || ''
    };
  }
}

module.exports = StripeGateway;
