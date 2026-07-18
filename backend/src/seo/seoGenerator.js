const config = require('./seoConfig');
const structuredData = require('./structuredData');

function generatePageMeta(pagePath, overrides = {}) {
  const staticPage = config.staticPages.find(p => p.path === pagePath);
  const base = staticPage || { title: config.siteName, description: config.siteDescription, priority: 0.5, changefreq: 'weekly' };
  return {
    title: overrides.title || base.title,
    description: overrides.description || base.description,
    canonical: config.siteUrl + pagePath,
    robots: overrides.robots || 'index, follow',
    ogType: overrides.ogType || (pagePath === '/' ? 'website' : 'article'),
    ogImage: overrides.ogImage || config.defaultOgImage,
    ...overrides
  };
}

function generateProductMeta(product) {
  const name = product.name || '';
  const desc = product.metaDescription || product.shortDescription || product.description || `Shop ${name} at ViralClothes.Shop`;
  const price = product.salePrice > 0 ? product.salePrice : product.price;
  return {
    title: `${name} - ViralClothes.Shop`,
    description: desc.length > 160 ? desc.substring(0, 157) + '...' : desc,
    keywords: [name, product.category?.name || 'fashion', 'streetwear', 'shop online'].filter(Boolean).join(', '),
    canonical: `${config.siteUrl}/product.html?id=${product.slug || product._id}`,
    ogType: 'product',
    ogImage: product.images?.[0] || product.thumbnail || config.defaultOgImage,
    ogPrice: price,
    ogCurrency: product.currency || 'USD',
    ogAvailability: product.isOutOfStock ? 'oos' : 'instock',
    twitterCard: 'product',
    jsonLd: structuredData.productSchema(product, product.category?.name),
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Shop', url: '/collection.html' },
      { name: name, url: `/product.html?id=${product.slug || product._id}` }
    ]
  };
}

function generateCategoryMeta(category, productCount) {
  const name = category.name || '';
  const desc = category.description || `Browse our collection of ${name}. Shop the latest ${name} styles at ViralClothes.Shop.`;
  return {
    title: `${name} - ViralClothes.Shop`,
    description: desc.length > 160 ? desc.substring(0, 157) + '...' : desc,
    keywords: [name, 'streetwear', 'fashion', 'shop online'].filter(Boolean).join(', '),
    canonical: `${config.siteUrl}/collection.html?category=${category.slug || category._id}`,
    ogType: 'website',
    ogImage: category.image || config.defaultOgImage,
    jsonLd: structuredData.collectionPageSchema(
      `${name} - ViralClothes.Shop`,
      desc,
      [],
      `/collection.html?category=${category.slug || category._id}`
    ),
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Shop', url: '/collection.html' },
      { name: name, url: `/collection.html?category=${category.slug || category._id}` }
    ]
  };
}

function generateArticleMeta(article) {
  return {
    title: `${article.title} - ViralClothes.Shop`,
    description: article.description || '',
    keywords: article.tags?.join(', ') || '',
    canonical: `${config.siteUrl}/blog/${article.slug}`,
    ogType: 'article',
    ogImage: article.image || config.defaultOgImage,
    jsonLd: structuredData.articleSchema(article)
  };
}

function generateSearchMeta(query) {
  const q = query || '';
  return {
    title: q ? `Search results for "${q}" - ViralClothes.Shop` : 'Search - ViralClothes.Shop',
    description: q ? `Search results for "${q}" at ViralClothes.Shop. Find the perfect streetwear, hoodies, t-shirts and more.` : 'Search products at ViralClothes.Shop.',
    canonical: `${config.siteUrl}/search.html${q ? '?q=' + encodeURIComponent(q) : ''}`,
    robots: q ? 'index, follow' : 'index, follow',
    ogType: 'website'
  };
}

function generateOrganizationJsonLd() {
  return structuredData.organizationSchema();
}

function generateWebsiteJsonLd() {
  return structuredData.websiteSchema();
}

function generateBreadcrumbJsonLd(items) {
  return structuredData.breadcrumbSchema(items);
}

function generateFaqJsonLd(items) {
  return structuredData.faqPageSchema(items);
}

module.exports = {
  generatePageMeta,
  generateProductMeta,
  generateCategoryMeta,
  generateArticleMeta,
  generateSearchMeta,
  generateOrganizationJsonLd,
  generateWebsiteJsonLd,
  generateBreadcrumbJsonLd,
  generateFaqJsonLd,
  structuredData
};
