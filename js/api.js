const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:5000/api'
  : '/api';

let authToken = localStorage.getItem('vc_token');
let currentUser = JSON.parse(localStorage.getItem('vc_user') || 'null');

const api = {
  async request(path, options = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
    try {
      const res = await fetch(`${API_URL}${path}`, { ...options, headers: { ...headers, ...options.headers } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Request failed');
      return data;
    } catch (err) {
      if (err.message.includes('token') || err.message.includes('Not authorized')) this.logout();
      throw err;
    }
  },

  // Auth
  async register(name, email, password) {
    const data = await this.request('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
    return data;
  },
  async login(email, password) {
    const data = await this.request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    authToken = data.token; currentUser = data.user;
    localStorage.setItem('vc_token', data.token); localStorage.setItem('vc_user', JSON.stringify(data.user));
    return data;
  },
  async logout() {
    try { await this.request('/auth/logout', { method: 'POST' }); } catch (e) {}
    authToken = null; currentUser = null;
    localStorage.removeItem('vc_token'); localStorage.removeItem('vc_user');
  },
  getToken() { return authToken; },
  getUser() { return currentUser; },
  isLoggedIn() { return !!authToken; },
  isAdmin() { return currentUser && ['admin', 'manager'].includes(currentUser.role); },
  async getProfile() {
    const data = await this.request('/auth/profile');
    currentUser = data.user; localStorage.setItem('vc_user', JSON.stringify(data.user));
    return data.user;
  },
  async updateProfile(updates) {
    const data = await this.request('/auth/profile', { method: 'PUT', body: JSON.stringify(updates) });
    return data.user;
  },

  // Products
  async getProducts(params = {}) { return this.request(`/products?${new URLSearchParams(params)}`); },
  async getProduct(id) { return this.request(`/products/${id}`); },
  async getFeaturedProducts() { return this.request('/products/featured'); },
  async getBestSellers() { return this.request('/products/best-sellers'); },
  async getNewArrivals() { return this.request('/products/new-arrivals'); },
  async getTrendingProducts() { return this.request('/products/trending'); },
  async searchProducts(q) { return this.request(`/products/search?q=${encodeURIComponent(q)}`); },
  async getCategories() { return this.request('/categories'); },
  async getProductReviews(productId) { return this.request(`/reviews/product/${productId}`); },
  async getRelatedProducts(productId) { return this.request(`/products/${productId}/related`); },

  // Orders
  async createOrder(orderData) { return this.request('/orders', { method: 'POST', body: JSON.stringify(orderData) }); },
  async getOrders(params = '') { return this.request(`/orders?${params}`); },
  async getOrder(id) { return this.request(`/orders/${id}`); },
  async getOrderByNumber(number) { return this.request(`/orders/number/${number}`); },
  async getOrderInvoice(id) { return this.request(`/orders/${id}/invoice`); },
  async cancelOrder(id) { return this.request(`/orders/${id}/cancel`, { method: 'PUT' }); },
  async returnOrder(id, reason) { return this.request(`/orders/${id}/return`, { method: 'PUT', body: JSON.stringify({ reason }) }); },

  // Reviews
  async createReview(productId, data) { return this.request(`/reviews/product/${productId}`, { method: 'POST', body: JSON.stringify(data) }); },

  // Coupons
  async validateCoupon(code, subtotal) { return this.request('/coupons/validate', { method: 'POST', body: JSON.stringify({ code, subtotal }) }); },

  // Payments
  async createPaymentIntent(data) { return this.request('/payments/create-intent', { method: 'POST', body: JSON.stringify(data) }); },
  async confirmPayment(data) { return this.request('/payments/confirm', { method: 'POST', body: JSON.stringify(data) }); },
  async createPayPalOrder(data) { return this.request('/payments/paypal/create', { method: 'POST', body: JSON.stringify(data) }); },
  async capturePayPalOrder(data) { return this.request('/payments/paypal/capture', { method: 'POST', body: JSON.stringify(data) }); },
  async getStripeKey() { return this.request('/payments/stripe-key'); },

  // Shipping Methods
  async getShippingMethods() { return this.request('/shipping-methods'); },
  async calculateShipping(data) { return this.request('/shipping-methods/calculate', { method: 'POST', body: JSON.stringify(data) }); },

  // Gift Cards
  async validateGiftCard(code) { return this.request('/gift-cards/validate', { method: 'POST', body: JSON.stringify({ code }) }); },
  async getMyGiftCards() { return this.request('/gift-cards/my'); },

  // Addresses
  async getAddresses() { return this.request('/addresses'); },
  async createAddress(data) { return this.request('/addresses', { method: 'POST', body: JSON.stringify(data) }); },
  async updateAddress(id, data) { return this.request(`/addresses/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
  async deleteAddress(id) { return this.request(`/addresses/${id}`, { method: 'DELETE' }); },

  // Multi-Gateway Payments
  async getAvailableGateways(country) { return this.request(`/payments/gateways?country=${country}`); },
  async initiatePayment(data) { return this.request('/payments/initiate', { method: 'POST', body: JSON.stringify(data) }); },
  async completePayment(data) { return this.request('/payments/complete', { method: 'POST', body: JSON.stringify(data) }); },
  async createRazorpayOrder(data) { return this.request('/payments/razorpay/create-order', { method: 'POST', body: JSON.stringify(data) }); },
  async confirmRazorpayPayment(data) { return this.request('/payments/razorpay/confirm', { method: 'POST', body: JSON.stringify(data) }); },
  async getPaymentHistory(params) { return this.request(`/payments/history?${new URLSearchParams(params)}`); },
  async getPaymentTransaction(id) { return this.request(`/payments/history/${id}`); }
};
