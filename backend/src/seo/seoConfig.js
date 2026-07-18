const description = 'Your destination for premium streetwear and fashion. Discover the latest trends in streetwear, hoodies, t-shirts, shoes and accessories.';

module.exports = {
  siteName: 'ViralClothes.Shop',
  siteUrl: process.env.SITE_URL || 'https://viralclothes.shop',
  siteDescription: description,
  siteKeywords: 'streetwear, fashion, clothing, hoodies, t-shirts, sneakers, accessories, online shopping, viral clothes',
  siteLogo: '/uploads/logo.png',
  favicon: '/favicon.ico',
  themeColor: '#1a1a2e',
  social: {
    facebook: 'https://facebook.com/viralclothes',
    twitter: '@viralclothes',
    instagram: 'https://instagram.com/viralclothes',
    youtube: 'https://youtube.com/@viralclothes'
  },
  address: {
    street: '123 Fashion Street',
    city: 'New York',
    state: 'NY',
    zip: '10001',
    country: 'US'
  },
  contact: {
    phone: '+1 (555) 123-4567',
    email: 'support@viralclothes.shop'
  },
  defaultOgImage: '/assets/og-image.jpg',
  twitterHandle: '@viralclothes',
  locale: 'en_US',
  staticPages: [
    { path: '/', title: 'ViralClothes.Shop - Trendy Fashion & Streetwear', description: description, priority: 1.0, changefreq: 'daily' },
    { path: '/collection.html', title: 'Shop Collection - ViralClothes.Shop', description: 'Browse our complete collection of trendy streetwear, hoodies, t-shirts, shoes and accessories.', priority: 0.9, changefreq: 'daily' },
    { path: '/about.html', title: 'About Us - ViralClothes.Shop', description: 'Learn about ViralClothes.Shop - your destination for premium streetwear and fashion.', priority: 0.5, changefreq: 'monthly' },
    { path: '/faq.html', title: 'FAQ - ViralClothes.Shop', description: 'Frequently asked questions about ViralClothes.Shop - orders, shipping, returns, and more.', priority: 0.6, changefreq: 'monthly' },
    { path: '/contact.html', title: 'Contact Us - ViralClothes.Shop', description: 'Get in touch with ViralClothes.Shop. We\'re here to help with any questions or concerns.', priority: 0.5, changefreq: 'monthly' },
    { path: '/cart.html', title: 'Shopping Cart - ViralClothes.Shop', description: 'Your shopping cart at ViralClothes.Shop', priority: 0.3, changefreq: 'never' },
    { path: '/search.html', title: 'Search - ViralClothes.Shop', description: 'Search products at ViralClothes.Shop.', priority: 0.4, changefreq: 'weekly' },
    { path: '/wishlist.html', title: 'Wishlist - ViralClothes.Shop', description: 'Your saved items at ViralClothes.Shop', priority: 0.3, changefreq: 'never' },
    { path: '/orders.html', title: 'My Orders - ViralClothes.Shop', description: 'View and manage your orders at ViralClothes.Shop', priority: 0.3, changefreq: 'never' },
    { path: '/order-success.html', title: 'Order Successful - ViralClothes.Shop', description: 'Your order has been placed successfully at ViralClothes.Shop', priority: 0.2, changefreq: 'never' },
    { path: '/privacy-policy.html', title: 'Privacy Policy - ViralClothes.Shop', description: 'Privacy Policy for ViralClothes.Shop.', priority: 0.3, changefreq: 'yearly' },
    { path: '/shipping-policy.html', title: 'Shipping Policy - ViralClothes.Shop', description: 'Shipping Policy for ViralClothes.Shop.', priority: 0.3, changefreq: 'yearly' },
    { path: '/refund-policy.html', title: 'Refund Policy - ViralClothes.Shop', description: 'Refund and Return Policy for ViralClothes.Shop.', priority: 0.3, changefreq: 'yearly' },
    { path: '/terms-conditions.html', title: 'Terms & Conditions - ViralClothes.Shop', description: 'Terms and Conditions for ViralClothes.Shop.', priority: 0.3, changefreq: 'yearly' },
    { path: '/checkout.html', title: 'Checkout - ViralClothes.Shop', description: 'Complete your purchase at ViralClothes.Shop.', priority: 0.2, changefreq: 'never' },
    { path: '/thank-you.html', title: 'Thank You - ViralClothes.Shop', description: 'Thank you for your purchase at ViralClothes.Shop!', priority: 0.2, changefreq: 'never' },
    { path: '/404.html', title: '404 - Page Not Found | ViralClothes.Shop', description: 'Page not found', priority: 0.1, changefreq: 'never' },
    { path: '/500.html', title: '500 - Server Error | ViralClothes.Shop', description: 'Server error', priority: 0.1, changefreq: 'never' }
  ],
  faqData: [
    { question: 'How do I place an order?', answer: 'Simply browse our collection, add items to your cart, and proceed to checkout. You can pay using credit card, PayPal, or Razorpay.' },
    { question: 'What payment methods do you accept?', answer: 'We accept credit/debit cards, PayPal, and Razorpay (for India). All payments are processed securely.' },
    { question: 'How long does shipping take?', answer: 'Standard shipping takes 5-7 business days. Express shipping takes 2-3 business days. International shipping may take 7-14 business days.' },
    { question: 'What is your return policy?', answer: 'We offer 30-day hassle-free returns on all unused items in original packaging.' },
    { question: 'Do you ship internationally?', answer: 'Yes, we ship worldwide. Shipping rates and times vary by destination.' }
  ]
};
