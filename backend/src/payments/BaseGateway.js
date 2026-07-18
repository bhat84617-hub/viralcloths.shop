class BaseGateway {
  constructor(config) {
    this.config = config || {};
    this.name = 'base';
    this.displayName = 'Base Gateway';
    this.countries = [];
    this.isActive = true;
  }

  getSupportedCountries() { return this.countries; }

  isAvailableForCountry(countryCode) {
    return this.countries.length === 0 || this.countries.includes(countryCode);
  }

  async createPayment(orderData) {
    throw new Error(`${this.name}: createPayment not implemented`);
  }

  async confirmPayment(paymentData) {
    throw new Error(`${this.name}: confirmPayment not implemented`);
  }

  async processRefund(transaction, amount) {
    throw new Error(`${this.name}: processRefund not implemented`);
  }

  async verifyWebhook(payload, signature) {
    throw new Error(`${this.name}: verifyWebhook not implemented`);
  }

  getClientConfig() {
    return { name: this.name, displayName: this.displayName, isActive: this.isActive };
  }
}

module.exports = BaseGateway;
