const seoGenerator = require('../seo/seoGenerator');
const sitemapGenerator = require('../seo/sitemapGenerator');
const config = require('../seo/seoConfig');
const Product = require('../models/Product');
const Category = require('../models/Category');

function getPageMeta(req, res) {
  try {
    const { path: pagePath, title, description, image, ogType } = req.query;
    if (!pagePath) {
      return res.status(400).json({ success: false, message: 'path query parameter is required' });
    }
    const cleanPath = pagePath.startsWith('/') ? pagePath : '/' + pagePath;
    const meta = seoGenerator.generatePageMeta(cleanPath, { title, description, ogImage: image, ogType });
    meta.jsonLd = [seoGenerator.generateOrganizationJsonLd(), seoGenerator.generateWebsiteJsonLd()];
    if (cleanPath === '/faq.html') {
      meta.jsonLd.push(seoGenerator.generateFaqJsonLd());
    }
    meta.breadcrumbs = [
      { name: 'Home', url: '/' },
      { name: cleanPath.replace(/^\/|\.html$/g, '').replace(/-/g, ' ') || 'Home', url: cleanPath }
    ].filter(b => b.name);
    res.json({ success: true, meta });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getProductSeo(req, res) {
  try {
    const { slug, id } = req.query;
    let product;
    if (slug) product = await Product.findOne({ slug }).populate('category', 'name slug');
    else if (id) product = await Product.findById(id).populate('category', 'name slug');
    else return res.status(400).json({ success: false, message: 'slug or id query parameter required' });

    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const meta = seoGenerator.generateProductMeta(product);
    meta.jsonLd = [
      seoGenerator.generateOrganizationJsonLd(),
      seoGenerator.generateWebsiteJsonLd(),
      meta.jsonLd
    ].filter(Boolean);

    res.json({ success: true, meta, product: { name: product.name, slug: product.slug, images: product.images, price: product.price, salePrice: product.salePrice } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getCategorySeo(req, res) {
  try {
    const { slug, id } = req.query;
    let category;
    if (slug) category = await Category.findOne({ slug });
    else if (id) category = await Category.findById(id);
    else return res.status(400).json({ success: false, message: 'slug or id query parameter required' });

    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

    const productCount = await Product.countDocuments({ category: category._id, isActive: true });
    const meta = seoGenerator.generateCategoryMeta(category, productCount);
    meta.jsonLd = [
      seoGenerator.generateOrganizationJsonLd(),
      seoGenerator.generateWebsiteJsonLd(),
      meta.jsonLd
    ].filter(Boolean);

    res.json({ success: true, meta, category: { name: category.name, slug: category.slug, image: category.image }, productCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getSitemapXml(req, res) {
  try {
    const xml = await sitemapGenerator.generateXmlSitemap();
    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  } catch (err) {
    res.status(500).send('Error generating sitemap');
  }
}

async function getSitemapHtml(req, res) {
  try {
    const data = await sitemapGenerator.generateHtmlSitemap();
    const html = generateHtmlSitemapPage(data);
    res.header('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    res.status(500).send('Error generating HTML sitemap');
  }
}

function getRobotsTxt(req, res) {
  const siteUrl = config.siteUrl;
  const robots = `User-agent: *
Allow: /
Allow: /collection.html
Allow: /product.html
Allow: /about.html
Allow: /faq.html
Allow: /contact.html
Allow: /search.html
Allow: /privacy-policy.html
Allow: /shipping-policy.html
Allow: /refund-policy.html
Allow: /terms-conditions.html
Disallow: /cart.html
Disallow: /checkout.html
Disallow: /orders.html
Disallow: /order-success.html
Disallow: /wishlist.html
Disallow: /thank-you.html
Disallow: /admin/
Disallow: /api/
Disallow: /uploads/

Sitemap: ${siteUrl}/seo/sitemap.xml

Host: ${siteUrl.replace(/^https?:\/\//, '')}
`;
  res.header('Content-Type', 'text/plain');
  res.header('Cache-Control', 'public, max-age=86400');
  res.send(robots);
}

function getManifest(req, res) {
  const manifest = {
    name: config.siteName,
    short_name: 'ViralClothes',
    description: config.siteDescription,
    start_url: '/',
    display: 'standalone',
    background_color: '#0d0d1a',
    theme_color: config.themeColor,
    icons: [
      { src: '/favicon.ico', sizes: '64x64', type: 'image/x-icon' },
      { src: '/assets/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
      { src: '/assets/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
    ],
    categories: ['shopping', 'fashion', 'clothing'],
    lang: 'en-US',
    orientation: 'portrait-primary'
  };
  res.header('Cache-Control', 'public, max-age=86400');
  res.json(manifest);
}

function generateHtmlSitemapPage(data) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>HTML Sitemap - ${data.siteName}</title>
<meta name="robots" content="noindex">
<style>
body{font-family:'Inter',system-ui,sans-serif;background:#0d0d1a;color:#fff;max-width:800px;margin:0 auto;padding:40px 20px}
h1{font-size:28px;margin-bottom:5px;background:linear-gradient(135deg,#6C3CE1,#E84393);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
h2{font-size:18px;margin:30px 0 10px;color:rgba(255,255,255,0.7);border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:8px}
p{margin-top:0;color:rgba(255,255,255,0.5);font-size:14px}
a{color:#6C3CE1;text-decoration:none;display:block;padding:6px 0;font-size:14px;border-bottom:1px solid rgba(255,255,255,0.03)}
a:hover{color:#E84393}
ul{list-style:none;padding:0;margin:0}
</style>
</head>
<body>
<h1>HTML Sitemap</h1>
<p>${data.siteName} - Complete site structure</p>

<h2>Pages</h2>
<ul>${data.staticPages.filter(p => !p.path.includes('404') && !p.path.includes('500')).map(p => `<li><a href="${p.path}">${p.title}</a></li>`).join('\n')}</ul>

<h2>Categories (${data.categories.length})</h2>
<ul>${data.categories.map(c => `<li><a href="/collection.html?category=${c.slug}">${c.name}</a></li>`).join('\n')}</ul>

<h2>Products (${data.products.length})</h2>
<ul>${data.products.map(p => `<li><a href="/product.html?id=${p.slug}">${p.name}</a></li>`).join('\n')}</ul>

<p style="margin-top:40px;font-size:12px;color:rgba(255,255,255,0.3)"><a href="/">Back to Home</a></p>
</body>
</html>`;
}

module.exports = { getPageMeta, getProductSeo, getCategorySeo, getSitemapXml, getSitemapHtml, getRobotsTxt, getManifest };
