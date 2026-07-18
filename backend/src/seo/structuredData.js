const config = require('./seoConfig');

function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: config.siteName,
    url: config.siteUrl,
    logo: config.siteUrl + config.siteLogo,
    sameAs: [
      config.social.facebook,
      config.social.instagram,
      config.social.youtube
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: config.address.street,
      addressLocality: config.address.city,
      addressRegion: config.address.state,
      postalCode: config.address.zip,
      addressCountry: config.address.country
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: config.contact.phone,
      contactType: 'customer service',
      email: config.contact.email
    }
  };
}

function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: config.siteName,
    url: config.siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: config.siteUrl + '/search.html?q={search_term_string}'
      },
      'query-input': 'required name=search_term_string'
    }
  };
}

function productSchema(product, categoryName) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.metaDescription || product.description || product.name,
    url: config.siteUrl + '/product.html?id=' + (product.slug || product._id),
    image: product.images?.length > 0 ? product.images.map(i => i.startsWith('http') ? i : config.siteUrl + '/' + i) : [config.siteUrl + '/assets/og-image.jpg'],
    sku: product.variants?.[0]?.sku || product._id?.toString(),
    brand: product.brand?.name ? { '@type': 'Brand', name: product.brand.name } : undefined,
    category: categoryName || 'Fashion'
  };

  if (product.rating && product.numReviews > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Math.min(product.rating, 5),
      reviewCount: product.numReviews,
      bestRating: 5,
      worstRating: 1
    };
  }

  const currentPrice = product.salePrice > 0 ? product.salePrice : product.price;
  schema.offers = {
    '@type': 'Offer',
    url: config.siteUrl + '/product.html?id=' + (product.slug || product._id),
    priceCurrency: product.currency || 'USD',
    price: currentPrice,
    priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    availability: product.isOutOfStock ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
    itemCondition: 'https://schema.org/NewCondition',
    shippingDetails: {
      '@type': 'OfferShippingDetails',
      shippingRate: { '@type': 'MonetaryAmount', value: 0, currency: 'USD' },
      deliveryTime: {
        '@type': 'ShippingDeliveryTime',
        handlingTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 2, unitCode: 'DAY' },
        transitTime: { '@type': 'QuantitativeValue', minValue: 3, maxValue: 7, unitCode: 'DAY' }
      },
      shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'US' }
    },
    hasMerchantReturnPolicy: {
      '@type': 'MerchantReturnPolicy',
      applicableCountry: 'US',
      returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
      merchantReturnDays: 30,
      returnMethod: 'https://schema.org/ReturnByMail',
      returnFees: 'https://schema.org/FreeReturn'
    }
  };

  return schema;
}

function reviewSchema(review) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: { '@type': 'Product', name: review.productName },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1
    },
    author: {
      '@type': 'Person',
      name: review.userName || 'Verified Customer'
    },
    datePublished: review.createdAt || new Date().toISOString(),
    reviewBody: review.comment || ''
  };
}

function breadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : config.siteUrl + item.url
    }))
  };
}

function collectionPageSchema(name, description, products, url) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: name || 'Shop Collection - ViralClothes.Shop',
    description: description || 'Browse our complete collection of trendy streetwear.',
    url: config.siteUrl + (url || '/collection.html'),
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: (products || []).map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: config.siteUrl + '/product.html?id=' + (p.slug || p._id)
      }))
    }
  };
}

function faqPageSchema(faqItems) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: (faqItems || config.faqData).map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer
      }
    }))
  };
}

function articleSchema(article) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title || '',
    description: article.description || '',
    image: article.image || config.siteUrl + config.defaultOgImage,
    datePublished: article.datePublished || new Date().toISOString(),
    dateModified: article.dateModified || new Date().toISOString(),
    author: {
      '@type': 'Organization',
      name: config.siteName
    },
    publisher: {
      '@type': 'Organization',
      name: config.siteName,
      logo: { '@type': 'ImageObject', url: config.siteUrl + config.siteLogo }
    }
  };
}

module.exports = {
  organizationSchema,
  websiteSchema,
  productSchema,
  reviewSchema,
  breadcrumbSchema,
  collectionPageSchema,
  faqPageSchema,
  articleSchema
};
