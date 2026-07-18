const StripeGateway = require('./StripeGateway');
const PayPalGateway = require('./PayPalGateway');
const RazorpayGateway = require('./RazorpayGateway');

const INDIAN_SUBREGIONS = ['IN'];

class GatewayFactory {
  constructor() {
    this.gateways = {};
    this._registerDefaults();
  }

  _registerDefaults() {
    this.register('stripe', new StripeGateway());
    this.register('paypal', new PayPalGateway());
    this.register('razorpay', new RazorpayGateway());
  }

  register(name, gatewayInstance) {
    this.gateways[name] = gatewayInstance;
    return this;
  }

  get(name) {
    return this.gateways[name] || null;
  }

  getAll() {
    return Object.values(this.gateways).filter(g => g.isActive);
  }

  getAvailableForCountry(countryCode) {
    const code = (countryCode || '').toUpperCase();
    return this.getAll().filter(g => g.isAvailableForCountry(code));
  }

  getPrimaryForCountry(countryCode) {
    const code = (countryCode || '').toUpperCase();
    const available = this.getAvailableForCountry(code);
    if (INDIAN_SUBREGIONS.includes(code)) {
      const rzp = available.find(g => g.name === 'razorpay');
      if (rzp) return rzp;
    }
    const preferred = available.filter(g => g.name !== 'razorpay');
    return preferred[0] || available[0] || null;
  }

  getPrioritizedForCountry(countryCode) {
    const code = (countryCode || '').toUpperCase();
    const available = this.getAvailableForCountry(code);
    if (INDIAN_SUBREGIONS.includes(code)) {
      const rzpIndex = available.findIndex(g => g.name === 'razorpay');
      if (rzpIndex > -1) {
        const rzp = available.splice(rzpIndex, 1)[0];
        available.unshift(rzp);
      }
    } else {
      const rzpIndex = available.findIndex(g => g.name === 'razorpay');
      if (rzpIndex > -1) {
        available.splice(rzpIndex, 1);
      }
    }
    return available;
  }

  getAllClientConfig(countryCode) {
    const gateways = this.getPrioritizedForCountry(countryCode);
    return {
      primary: gateways[0]?.getClientConfig() || null,
      gateways: gateways.map(g => g.getClientConfig()),
      country: countryCode
    };
  }
}

module.exports = new GatewayFactory();
