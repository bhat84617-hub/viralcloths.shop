const BaseGateway = require('./BaseGateway');

class PayPalGateway extends BaseGateway {
  constructor() {
    super();
    this.name = 'paypal';
    this.displayName = 'PayPal';
    this.countries = []; // Available everywhere except India for primary
    this.isActive = true;
  }

  _getClient() {
    const paypal = require('@paypal/checkout-server-sdk');
    const environment = process.env.PAYPAL_MODE === 'live'
      ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET)
      : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET);
    return new paypal.core.PayPalHttpClient(environment);
  }

  async createPayment(orderData) {
    const { items, total, currency = 'USD' } = orderData;
    const paypal = require('@paypal/checkout-server-sdk');
    const client = this._getClient();
    const request = new paypal.orders.OrdersCreateRequest();
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: { currency_code: currency, value: total.toFixed(2) },
        items: (items || []).map(i => ({
          name: i.name || 'Item',
          unit_amount: { currency_code: currency, value: (i.price || 0).toFixed(2) },
          quantity: i.quantity.toString()
        }))
      }]
    });
    const order = await client.execute(request);
    return {
      success: true,
      gateway: this.name,
      transactionId: order.result.id,
      approvalUrl: order.result.links?.find(l => l.rel === 'approve')?.href || '',
      metadata: { orderID: order.result.id }
    };
  }

  async confirmPayment(paymentData) {
    const { transactionId } = paymentData;
    const paypal = require('@paypal/checkout-server-sdk');
    const client = this._getClient();
    const request = new paypal.orders.OrdersCaptureRequest(transactionId);
    request.requestBody({});
    const capture = await client.execute(request);
    if (capture.result.status === 'COMPLETED') {
      return { success: true, status: 'completed', transactionId, gateway: this.name, raw: capture.result };
    }
    return { success: false, status: 'failed', transactionId, gateway: this.name, error: 'PayPal payment not completed' };
  }

  async processRefund(transaction, amount) {
    const paypal = require('@paypal/checkout-server-sdk');
    const client = this._getClient();
    const request = new paypal.payments.CapturesRefundRequest(transaction.transactionId);
    request.requestBody({ amount: { value: (amount || transaction.amount).toFixed(2), currency_code: 'USD' } });
    const refund = await client.execute(request);
    return { success: true, refundId: refund.result.id, amount: parseFloat(refund.result.amount?.value || amount), status: refund.result.status };
  }

  async verifyWebhook(payload, signature) {
    try {
      const paypal = require('@paypal/checkout-server-sdk');
      const client = this._getClient();
      const webhookId = process.env.PAYPAL_WEBHOOK_ID;
      if (!webhookId) {
        return { success: false, error: 'PAYPAL_WEBHOOK_ID not configured' };
      }
      const request = new paypal.notifications.webhooks.VerifyWebhookSignature();
      request.requestBody({
        auth_algo: signature?.['PAYPAL-AUTH-ALGO'] || '',
        cert_url: signature?.['PAYPAL-CERT-URL'] || '',
        transmission_id: signature?.['PAYPAL-TRANSMISSION-ID'] || '',
        transmission_sig: signature?.['PAYPAL-TRANSMISSION-SIG'] || '',
        transmission_time: signature?.['PAYPAL-TRANSMISSION-TIME'] || '',
        webhook_id: webhookId,
        webhook_event: payload
      });
      const res = await client.execute(request);
      if (res.result?.verification_status === 'SUCCESS') {
        return { success: true, event: payload };
      }
      return { success: false, error: 'PayPal webhook verification failed' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  getClientConfig() {
    return {
      ...super.getClientConfig(),
      clientId: process.env.PAYPAL_CLIENT_ID || ''
    };
  }
}

module.exports = PayPalGateway;
