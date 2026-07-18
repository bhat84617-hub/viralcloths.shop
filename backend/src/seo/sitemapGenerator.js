const config = require('./seoConfig');
const Product = require('../models/Product');
const Category = require('../models/Category');

async function generateXmlSitemap() {
  const pages = [];
  const siteUrl = config.siteUrl;

  for (const page of config.staticPages) {
    pages.push({
      loc: siteUrl + page.path,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: page.changefreq || 'monthly',
      priority: page.priority || 0.5
    });
  }

  const products = await Product.find({ isActive: true })
    .select('slug updatedAt createdAt')
    .lean();
  for (const p of products) {
    pages.push({
      loc: siteUrl + '/product.html?id=' + (p.slug || p._id),
      lastmod: (p.updatedAt || p.createdAt || new Date()).toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: 0.8
    });
  }

  const categories = await Category.find({ isActive: true })
    .select('slug updatedAt createdAt')
    .lean();
  for (const c of categories) {
    pages.push({
      loc: siteUrl + '/collection.html?category=' + (c.slug || c._id),
      lastmod: (c.updatedAt || c.createdAt || new Date()).toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: 0.7
    });
  }

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (const p of pages) {
    xml += '  <url>\n';
    xml += '    <loc>' + escapeXml(p.loc) + '</loc>\n';
    xml += '    <lastmod>' + p.lastmod + '</lastmod>\n';
    xml += '    <changefreq>' + p.changefreq + '</changefreq>\n';
    xml += '    <priority>' + p.priority + '</priority>\n';
    xml += '  </url>\n';
  }
  xml += '</urlset>';
  return xml;
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function generateHtmlSitemap() {
  const products = await Product.find({ isActive: true })
    .select('name slug')
    .sort({ name: 1 })
    .lean();
  const categories = await Category.find({ isActive: true })
    .select('name slug')
    .sort({ name: 1 })
    .lean();
  return { products, categories, staticPages: config.staticPages, siteUrl: config.siteUrl, siteName: config.siteName };
}

module.exports = { generateXmlSitemap, generateHtmlSitemap };
