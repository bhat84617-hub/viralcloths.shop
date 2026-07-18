(function () {
  'use strict';

  const SITE_NAME = 'ViralClothes.Shop';
  const SITE_URL = window.location.origin;
  const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000'
    : '';
  const DEFAULT_OG_IMAGE = SITE_URL + '/assets/og-image.jpg';
  const TWITTER_HANDLE = '@viralclothes';
  const THEME_COLOR = '#1a1a2e';
  const LOCALE = 'en_US';

  const SEO = {
    init: function () {
      this.injectBaseMeta();
      const pageType = this.detectPageType();
      const seoData = this.getStaticSeoData();
      if (seoData) {
        this.applySeoData(seoData);
      } else if (pageType === 'product') {
        this.loadProductSeo();
      } else if (pageType === 'category') {
        this.loadCategorySeo();
      } else if (pageType === 'search') {
        this.loadSearchSeo();
      } else if (pageType === 'faq') {
        this.injectFaqSchema();
      } else {
        this.injectDefaultSchema();
      }
      this.observeImages();
    },

    detectPageType: function () {
      const path = window.location.pathname;
      if (path.includes('product.html')) return 'product';
      if (path.includes('collection.html')) return 'category';
      if (path.includes('search.html')) return 'search';
      if (path.includes('faq.html')) return 'faq';
      return 'static';
    },

    getStaticSeoData: function () {
      const el = document.getElementById('seo-data');
      if (el) {
        try { return JSON.parse(el.textContent); } catch (e) { return null; }
      }
      return null;
    },

    injectBaseMeta: function () {
      const head = document.head;
      const tags = [
        { charset: 'UTF-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
        { name: 'theme-color', content: THEME_COLOR },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: SITE_NAME },
        { rel: 'manifest', href: (API_BASE || SITE_URL) + '/seo/manifest.json' },
        { rel: 'canonical', href: window.location.href.split('?')[0] },
        { property: 'og:locale', content: LOCALE },
        { property: 'og:site_name', content: SITE_NAME },
        { property: 'og:url', content: window.location.href },
        { name: 'twitter:site', content: TWITTER_HANDLE },
        { name: 'twitter:domain', content: window.location.hostname },
        { name: 'format-detection', content: 'telephone=no' }
      ];
      tags.forEach(function (tag) {
        var el;
        if (tag.charset) { el = document.querySelector('meta[charset]'); if (!el) { el = document.createElement('meta'); el.setAttribute('charset', tag.charset); head.insertBefore(el, head.firstChild); } }
        else if (tag.name && tag.name !== 'viewport' && tag.name !== 'theme-color') { if (!head.querySelector('meta[name="' + tag.name + '"]')) { el = document.createElement('meta'); el.setAttribute('name', tag.name); el.setAttribute('content', tag.content); head.appendChild(el); } }
        else if (tag.property) { if (!head.querySelector('meta[property="' + tag.property + '"]')) { el = document.createElement('meta'); el.setAttribute('property', tag.property); el.setAttribute('content', tag.content); head.appendChild(el); } }
        else if (tag.rel) { if (!head.querySelector('link[rel="' + tag.rel + '"]')) { el = document.createElement('link'); el.setAttribute('rel', tag.rel); el.setAttribute('href', tag.content); head.appendChild(el); } }
      });
      if (!document.querySelector('meta[name="theme-color"]')) {
        var tc = document.createElement('meta');
        tc.setAttribute('name', 'theme-color');
        tc.setAttribute('content', THEME_COLOR);
        head.appendChild(tc);
      }
    },

    applySeoData: function (data) {
      this.setTitle(data.title || SITE_NAME);
      this.setMeta('description', data.description || '');
      this.setMeta('keywords', data.keywords || '');
      this.setMeta('robots', data.robots || 'index, follow');
      this.setCanonical(data.canonical || window.location.href.split('?')[0]);
      this.setOgMeta('title', data.title || SITE_NAME);
      this.setOgMeta('description', data.description || '');
      this.setOgMeta('image', data.ogImage || DEFAULT_OG_IMAGE);
      this.setOgMeta('type', data.ogType || 'website');
      this.setTwitterMeta('card', data.twitterCard || 'summary_large_image');
      this.setTwitterMeta('title', data.title || SITE_NAME);
      this.setTwitterMeta('description', data.description || '');
      this.setTwitterMeta('image', data.ogImage || DEFAULT_OG_IMAGE);
      if (data.jsonLd) {
        if (Array.isArray(data.jsonLd)) {
          data.jsonLd.forEach(function (ld) { if (ld) SEO.injectJsonLd(ld); });
        } else {
          this.injectJsonLd(data.jsonLd);
        }
      } else {
        this.injectDefaultSchema();
      }
    },

    setTitle: function (title) {
      document.title = title;
      var og = document.querySelector('meta[property="og:title"]');
      if (og) og.setAttribute('content', title);
    },

    setMeta: function (name, content) {
      if (!content) return;
      var el = document.querySelector('meta[name="' + name + '"]');
      if (el) { el.setAttribute('content', content); return; }
      el = document.createElement('meta');
      el.setAttribute('name', name);
      el.setAttribute('content', content);
      document.head.appendChild(el);
    },

    setCanonical: function (href) {
      var el = document.querySelector('link[rel="canonical"]') || document.createElement('link');
      el.setAttribute('rel', 'canonical');
      el.setAttribute('href', href);
      if (!el.parentNode) document.head.appendChild(el);
    },

    setOgMeta: function (property, content) {
      if (!content) return;
      var el = document.querySelector('meta[property="og:' + property + '"]');
      if (el) { el.setAttribute('content', content); return; }
      el = document.createElement('meta');
      el.setAttribute('property', 'og:' + property);
      el.setAttribute('content', content);
      document.head.appendChild(el);
    },

    setTwitterMeta: function (name, content) {
      if (!content) return;
      var el = document.querySelector('meta[name="twitter:' + name + '"]');
      if (el) { el.setAttribute('content', content); return; }
      el = document.createElement('meta');
      el.setAttribute('name', 'twitter:' + name);
      el.setAttribute('content', content);
      document.head.appendChild(el);
    },

    injectJsonLd: function (data) {
      if (!data || !data['@context']) return;
      var script = document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.textContent = JSON.stringify(data);
      document.head.appendChild(script);
    },

    injectDefaultSchema: function () {
      var org = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
        sameAs: ['https://facebook.com/viralclothes', 'https://instagram.com/viralclothes', 'https://youtube.com/@viralclothes']
      };
      var web = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_NAME,
        url: SITE_URL,
        potentialAction: {
          '@type': 'SearchAction',
          target: SITE_URL + '/search.html?q={search_term_string}',
          'query-input': 'required name=search_term_string'
        }
      };
      if (!document.querySelector('script[type="application/ld+json"]')) {
        this.injectJsonLd(org);
        this.injectJsonLd(web);
      }
    },

    injectFaqSchema: function () {
      var items = document.querySelectorAll('.faq-item');
      if (items.length > 0) {
        var faqData = [];
        items.forEach(function (item) {
          var q = item.querySelector('.faq-question');
          var a = item.querySelector('.faq-answer');
          if (q && a) faqData.push({ question: q.textContent.trim(), answer: a.textContent.trim() });
        });
        if (faqData.length > 0) {
          this.injectJsonLd({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqData.map(function (f) {
              return { '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } };
            })
          });
        }
      }
    },

    loadProductSeo: function () {
      var params = new URLSearchParams(window.location.search);
      var id = params.get('id');
      if (!id) return;
      var product = null;
      if (typeof PRODUCTS !== 'undefined') {
        product = PRODUCTS.find(function (p) { return String(p.id) === String(id) || String(p._id) === String(id); });
      }
      if (product) {
        var meta = this.buildProductMeta(product);
        this.applySeoData(meta);
      } else {
        this.loadFromApi(API_BASE + '/api/seo/product?id=' + encodeURIComponent(id));
      }
    },

    loadCategorySeo: function () {
      var params = new URLSearchParams(window.location.search);
      var category = params.get('category');
      if (!category) return;
      if (category === 'new' || category === 'all' || category === 'tshirts' || category === 'hoodies' || category === 'shoes' || category === 'accessories') {
        var catName = category.charAt(0).toUpperCase() + category.slice(1);
        var meta = {
          title: catName + ' - ' + SITE_NAME,
          description: 'Browse our collection of ' + category + '. Shop the latest styles and trends at ' + SITE_NAME + '.',
          canonical: SITE_URL + '/collection.html?category=' + category,
          ogType: 'website',
          ogImage: DEFAULT_OG_IMAGE
        };
        this.applySeoData(meta);
      } else {
        this.loadFromApi(API_BASE + '/api/seo/category?slug=' + encodeURIComponent(category));
      }
    },

    loadSearchSeo: function () {
      var params = new URLSearchParams(window.location.search);
      var q = params.get('q');
      var title = q ? 'Search results for "' + q + '" - ' + SITE_NAME : 'Search - ' + SITE_NAME;
      var desc = q ? 'Search results for "' + q + '" at ' + SITE_NAME + '. Find the perfect streetwear, hoodies, t-shirts and more.' : 'Search products at ' + SITE_NAME + '.';
      this.applySeoData({ title: title, description: desc, canonical: window.location.href.split('?')[0], ogType: 'website' });
    },

    loadFromApi: function (url) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.onload = function () {
        if (xhr.status === 200) {
          try {
            var data = JSON.parse(xhr.responseText);
            if (data.success && data.meta) SEO.applySeoData(data.meta);
          } catch (e) {}
        }
      };
      xhr.send();
    },

    buildProductMeta: function (product) {
      var name = product.name || '';
      var desc = product.metaDescription || product.shortDescription || product.description || 'Shop ' + name + ' at ' + SITE_NAME;
      desc = desc.length > 160 ? desc.substring(0, 157) + '...' : desc;
      var price = product.salePrice || product.price || 0;
      var imageUrl = product.images && product.images.length > 0 ? product.images[0] : (product.icon ? SITE_URL + '/assets/' + product.icon : DEFAULT_OG_IMAGE);
      if (imageUrl && !imageUrl.startsWith('http')) imageUrl = SITE_URL + '/' + imageUrl.replace(/^\//, '');
      return {
        title: name + ' - ' + SITE_NAME,
        description: desc,
        canonical: SITE_URL + '/product.html?id=' + (product.slug || product.id || product._id),
        ogType: 'product',
        ogImage: imageUrl,
        twitterCard: 'product',
        jsonLd: [{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: name,
          description: desc,
          url: SITE_URL + '/product.html?id=' + (product.slug || product.id || product._id),
          image: imageUrl,
          offers: {
            '@type': 'Offer',
            priceCurrency: product.currency || 'USD',
            price: price,
            availability: product.isOutOfStock ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock'
          },
          aggregateRating: product.rating ? {
            '@type': 'AggregateRating',
            ratingValue: Math.min(product.rating, 5),
            reviewCount: product.numReviews || product.reviews || 0,
            bestRating: 5
          } : undefined
        }]
      };
    },

    observeImages: function () {
      if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              var img = entry.target;
              if (img.dataset.src) { img.src = img.dataset.src; img.removeAttribute('data-src'); }
              if (img.dataset.srcset) { img.srcset = img.dataset.srcset; img.removeAttribute('data-srcset'); }
              img.classList.add('loaded');
              observer.unobserve(img);
            }
          });
        }, { rootMargin: '200px' });
        document.querySelectorAll('img[data-src]').forEach(function (img) { observer.observe(img); });
      } else {
        document.querySelectorAll('img[data-src]').forEach(function (img) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        });
      }
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { SEO.init(); });
  } else {
    SEO.init();
  }

  window.SEO = SEO;
})();
