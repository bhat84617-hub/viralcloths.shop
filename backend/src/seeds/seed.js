require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const Product = require('../models/Product');
const Setting = require('../models/Setting');
const ShippingMethod = require('../models/ShippingMethod');
const GiftCard = require('../models/GiftCard');

const seed = async () => {
  await connectDB();

  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Brand.deleteMany({}),
    Product.deleteMany({}),
    Setting.deleteMany({}),
    ShippingMethod.deleteMany({}),
    GiftCard.deleteMany({})
  ]);

  const admin = await User.create({
    name: 'Admin',
    email: process.env.ADMIN_EMAIL || 'admin@viralclothes.shop',
    password: process.env.ADMIN_PASSWORD || 'Admin@123456',
    role: 'admin',
    isVerified: true
  });
  console.log('Admin created:', admin.email);

  const demoUser = await User.create({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'Password123',
    role: 'customer',
    isVerified: true
  });
  console.log('Demo user created');

  const categories = await Category.insertMany([
    { name: 'T-Shirts', slug: 'tshirts', icon: '👕', sortOrder: 1 },
    { name: 'Hoodies', slug: 'hoodies', icon: '🧥', sortOrder: 2 },
    { name: 'Shoes', slug: 'shoes', icon: '👟', sortOrder: 3 },
    { name: 'Accessories', slug: 'accessories', icon: '🎒', sortOrder: 4 }
  ]);
  console.log('Categories seeded');

  const brands = await Brand.insertMany([
    { name: 'Viral', slug: 'viral' },
    { name: 'Street Pro', slug: 'street-pro' },
    { name: 'Urban Fit', slug: 'urban-fit' },
    { name: 'Elite Wear', slug: 'elite-wear' }
  ]);
  console.log('Brands seeded');

  const products = await Product.insertMany([
    { name: 'Classic Cotton Tee', slug: 'classic-cotton-tee', category: categories[0]._id, brand: brands[0]._id, price: 29.99, icon: '👕', tag: 'New', tagType: 'new', rating: 4.8, numReviews: 124, totalSold: 89, isFeatured: true, isNewArrival: true, isActive: true, colors: ['#6C3CE1', '#FF6B6B', '#fff'], sizes: ['S', 'M', 'L', 'XL'], description: 'Premium cotton t-shirt with a relaxed fit. Perfect for everyday wear.' },
    { name: 'Viral Hoodie Black', slug: 'viral-hoodie-black', category: categories[1]._id, brand: brands[0]._id, price: 59.99, salePrice: 49.99, icon: '🧥', tag: 'Sale', tagType: 'sale', rating: 4.9, numReviews: 89, totalSold: 234, oldPrice: 79.99, isFeatured: true, isBestSeller: true, isTrending: true, isActive: true, colors: ['#1a1a2e', '#fff'], sizes: ['S', 'M', 'L', 'XL', 'XXL'], description: 'Our signature viral hoodie. Ultra-soft fleece lining.' },
    { name: 'Air Max Sneakers', slug: 'air-max-sneakers', category: categories[2]._id, brand: brands[1]._id, price: 89.99, icon: '👟', tag: 'New', tagType: 'new', rating: 4.7, numReviews: 203, totalSold: 567, isFeatured: true, isNewArrival: true, isActive: true, colors: ['#fff', '#000', '#FF6B6B'], sizes: ['US 7', 'US 8', 'US 9', 'US 10', 'US 11', 'US 12'], description: 'Lightweight sneakers with responsive cushioning.' },
    { name: 'Snapback Cap', slug: 'snapback-cap', category: categories[3]._id, brand: brands[2]._id, price: 19.99, icon: '🧢', rating: 4.5, numReviews: 67, totalSold: 432, isActive: true, colors: ['#000', '#fff', '#FFD93D'], sizes: ['One Size'], description: 'Classic snapback cap with adjustable fit.' },
    { name: 'Graphic Print Tee', slug: 'graphic-print-tee', category: categories[0]._id, brand: brands[1]._id, price: 34.99, icon: '👕', tag: 'New', tagType: 'new', rating: 4.6, numReviews: 156, totalSold: 345, isFeatured: true, isNewArrival: true, isActive: true, colors: ['#fff', '#000'], sizes: ['S', 'M', 'L', 'XL'], description: 'Bold graphic print t-shirt. Make a statement.' },
    { name: 'Oversized Hoodie', slug: 'oversized-hoodie', category: categories[1]._id, brand: brands[0]._id, price: 69.99, salePrice: 59.99, icon: '🧥', tag: 'Sale', tagType: 'sale', rating: 4.9, numReviews: 312, totalSold: 891, oldPrice: 89.99, isBestSeller: true, isTrending: true, isActive: true, colors: ['#FF6B6B', '#6C3CE1', '#000'], sizes: ['S', 'M', 'L', 'XL'], description: 'Trending oversized hoodie. Drop shoulder design.' },
    { name: 'Running Shoes Pro', slug: 'running-shoes-pro', category: categories[2]._id, brand: brands[3]._id, price: 119.99, icon: '👟', tag: 'New', tagType: 'new', rating: 4.8, numReviews: 178, totalSold: 234, isFeatured: true, isActive: true, colors: ['#6C3CE1', '#000', '#fff'], sizes: ['US 7', 'US 8', 'US 9', 'US 10', 'US 11'], description: 'Professional running shoes with advanced cushioning.' },
    { name: 'Leather Backpack', slug: 'leather-backpack', category: categories[3]._id, brand: brands[2]._id, price: 49.99, icon: '🎒', rating: 4.4, numReviews: 45, totalSold: 123, isActive: true, colors: ['#1a1a2e'], sizes: ['One Size'], description: 'Genuine leather backpack with multiple compartments.' },
    { name: 'V-Neck Tee', slug: 'v-neck-tee', category: categories[0]._id, brand: brands[3]._id, price: 24.99, salePrice: 19.99, icon: '👕', tag: 'Sale', tagType: 'sale', rating: 4.3, numReviews: 88, totalSold: 567, oldPrice: 34.99, isActive: true, colors: ['#fff', '#000', '#00D2FF'], sizes: ['S', 'M', 'L', 'XL'], description: 'Classic v-neck t-shirt. A wardrobe essential.' },
    { name: 'Zip-Up Hoodie', slug: 'zip-up-hoodie', category: categories[1]._id, brand: brands[1]._id, price: 74.99, icon: '🧥', rating: 4.7, numReviews: 134, totalSold: 456, isActive: true, colors: ['#1a1a2e', '#fff'], sizes: ['S', 'M', 'L', 'XL', 'XXL'], description: 'Versatile zip-up hoodie with front pockets.' },
    { name: 'Slip-On Sneakers', slug: 'slip-on-sneakers', category: categories[2]._id, brand: brands[2]._id, price: 64.99, icon: '👟', tag: 'New', tagType: 'new', rating: 4.6, numReviews: 92, totalSold: 345, isFeatured: true, isActive: true, colors: ['#fff', '#000', '#A8E063'], sizes: ['US 7', 'US 8', 'US 9', 'US 10', 'US 11'], description: 'Easy slip-on sneakers with memory foam insole.' },
    { name: 'Sunglasses', slug: 'sunglasses', category: categories[3]._id, brand: brands[0]._id, price: 24.99, icon: '🕶️', rating: 4.2, numReviews: 56, totalSold: 789, isActive: true, colors: ['#000', '#6C3CE1'], sizes: ['One Size'], description: 'UV400 protective sunglasses. Trendy design.' }
  ]);
  console.log('Products seeded:', products.length);

  await Setting.insertMany([
    { key: 'site_name', value: 'ViralClothes.Shop', type: 'string', group: 'general', description: 'Website name' },
    { key: 'site_description', value: 'Your destination for premium streetwear and fashion.', type: 'string', group: 'general' },
    { key: 'free_shipping_threshold', value: 50, type: 'number', group: 'shipping', description: 'Free shipping over this amount' },
    { key: 'shipping_cost', value: 9.99, type: 'number', group: 'shipping', description: 'Standard shipping cost' },
    { key: 'tax_rate', value: 8, type: 'number', group: 'general', description: 'Tax percentage' },
    { key: 'currency', value: 'USD', type: 'string', group: 'general' },
    { key: 'contact_email', value: 'hello@viralclothes.shop', type: 'string', group: 'contact' },
    { key: 'contact_phone', value: '+1 (555) 123-4567', type: 'string', group: 'contact' },
    { key: 'address', value: '123 Fashion Street, New York, NY 10001', type: 'string', group: 'contact' }
  ]);
  console.log('Settings seeded');

  await ShippingMethod.insertMany([
    { name: 'Standard Shipping', code: 'standard', description: 'Delivery in 5-7 business days', price: 4.99, freeThreshold: 50, estimatedDays: '5-7 business days', sortOrder: 1 },
    { name: 'Express Shipping', code: 'express', description: 'Delivery in 2-3 business days', price: 12.99, freeThreshold: 100, estimatedDays: '2-3 business days', sortOrder: 2 },
    { name: 'Next Day Delivery', code: 'next-day', description: 'Get it tomorrow if ordered before 2 PM', price: 24.99, estimatedDays: '1 business day', sortOrder: 3 },
    { name: 'Free Economy', code: 'economy', description: 'Delivery in 7-10 business days', price: 0, estimatedDays: '7-10 business days', sortOrder: 4 }
  ]);
  console.log('Shipping methods seeded');

  await GiftCard.create({ code: 'GC-TEST100', originalBalance: 100, balance: 100, isActive: true });
  await GiftCard.create({ code: 'GC-TEST50', originalBalance: 50, balance: 50, isActive: true });
  console.log('Gift cards seeded');

  console.log('\nSeed complete!');
  console.log(`Admin: ${process.env.ADMIN_EMAIL || 'admin@viralclothes.shop'} / ${process.env.ADMIN_PASSWORD || 'Admin@123456'}`);
  console.log(`User: john@example.com / Password123`);

  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
