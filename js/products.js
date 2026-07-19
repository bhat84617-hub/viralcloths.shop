let PRODUCTS = [
  { id: 1, name: 'Classic Cotton Tee', category: 'tshirts', price: 29.99, icon: '👕', image: 'assets/images/classic_cotton_tee.png', tag: 'New', tagType: 'new', rating: 4.8, reviews: 124, colors: ['#6C3CE1', '#FF6B6B', '#fff'], sizes: ['S', 'M', 'L', 'XL'], description: 'Premium cotton t-shirt with a relaxed fit. Perfect for everyday wear with exceptional comfort and breathability.' },
  { id: 2, name: 'Viral Hoodie Black', category: 'hoodies', price: 59.99, icon: '🧥', image: 'assets/images/viral_hoodie_black.png', tag: 'Sale', tagType: 'sale', rating: 4.9, reviews: 89, oldPrice: 79.99, colors: ['#1a1a2e', '#fff'], sizes: ['S', 'M', 'L', 'XL', 'XXL'], description: 'Our signature viral hoodie. Ultra-soft fleece lining, oversized fit, and eye-catching design.' },
  { id: 3, name: 'Air Max Sneakers', category: 'shoes', price: 89.99, icon: '👟', image: 'assets/images/air_max_sneakers.png', tag: 'New', tagType: 'new', rating: 4.7, reviews: 203, colors: ['#fff', '#000', '#FF6B6B'], sizes: ['US 7', 'US 8', 'US 9', 'US 10', 'US 11', 'US 12'], description: 'Lightweight sneakers with responsive cushioning. Designed for all-day comfort and street-ready style.' },
  { id: 4, name: 'Snapback Cap', category: 'accessories', price: 19.99, icon: '🧢', image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=600', tag: '', tagType: '', rating: 4.5, reviews: 67, colors: ['#000', '#fff', '#FFD93D'], sizes: ['One Size'], description: 'Classic snapback cap with adjustable fit. Embroidered logo and premium construction.' },
  { id: 5, name: 'Graphic Print Tee', category: 'tshirts', price: 34.99, icon: '👕', image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&q=80&w=600', tag: 'New', tagType: 'new', rating: 4.6, reviews: 156, colors: ['#fff', '#000'], sizes: ['S', 'M', 'L', 'XL'], description: 'Bold graphic print t-shirt. Make a statement with unique artwork on premium cotton.' },
  { id: 6, name: 'Oversized Hoodie', category: 'hoodies', price: 69.99, icon: '🧥', image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=600', tag: 'Sale', tagType: 'sale', rating: 4.9, reviews: 312, oldPrice: 89.99, colors: ['#FF6B6B', '#6C3CE1', '#000'], sizes: ['S', 'M', 'L', 'XL'], description: 'Trending oversized hoodie. Drop shoulder design, kangaroo pocket, and ultra-comfortable fit.' },
  { id: 7, name: 'Running Shoes Pro', category: 'shoes', price: 119.99, icon: '👟', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=600', tag: 'New', tagType: 'new', rating: 4.8, reviews: 178, colors: ['#6C3CE1', '#000', '#fff'], sizes: ['US 7', 'US 8', 'US 9', 'US 10', 'US 11'], description: 'Professional running shoes with advanced cushioning technology. Lightweight and durable.' },
  { id: 8, name: 'Leather Backpack', category: 'accessories', price: 49.99, icon: '🎒', image: 'https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&q=80&w=600', tag: '', tagType: '', rating: 4.4, reviews: 45, colors: ['#1a1a2e'], sizes: ['One Size'], description: 'Genuine leather backpack with multiple compartments. Stylish and functional for everyday use.' },
  { id: 9, name: 'V-Neck Tee', category: 'tshirts', price: 24.99, icon: '👕', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=600', tag: 'Sale', tagType: 'sale', rating: 4.3, reviews: 88, oldPrice: 34.99, colors: ['#fff', '#000', '#00D2FF'], sizes: ['S', 'M', 'L', 'XL'], description: 'Classic v-neck t-shirt. A wardrobe essential with a modern twist.' },
  { id: 10, name: 'Zip-Up Hoodie', category: 'hoodies', price: 74.99, icon: '🧥', image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80&w=600', tag: '', tagType: '', rating: 4.7, reviews: 134, colors: ['#1a1a2e', '#fff'], sizes: ['S', 'M', 'L', 'XL', 'XXL'], description: 'Versatile zip-up hoodie with front pockets. Perfect for layering in any season.' },
  { id: 11, name: 'Slip-On Sneakers', category: 'shoes', price: 64.99, icon: '👟', image: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&q=80&w=600', tag: 'New', tagType: 'new', rating: 4.6, reviews: 92, colors: ['#fff', '#000', '#A8E063'], sizes: ['US 7', 'US 8', 'US 9', 'US 10', 'US 11'], description: 'Easy slip-on sneakers with memory foam insole. Comfort meets convenience.' },
  { id: 12, name: 'Sunglasses', category: 'accessories', price: 24.99, icon: '🕶️', image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=600', tag: '', tagType: '', rating: 4.2, reviews: 56, colors: ['#000', '#6C3CE1'], sizes: ['One Size'], description: 'UV400 protective sunglasses. Trendy design with durable frames.' },
];

async function loadProductsFromAPI() {
  try {
    if (typeof api === 'undefined' || !api.getProducts) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const data = await api.request('/products?limit=100', { signal: controller.signal });
    clearTimeout(timeout);
    if (data && data.products && data.products.length > 0) {
      PRODUCTS = data.products.map((p, i) => ({
        id: p._id || p.id || (i + 1),
        _id: p._id,
        name: p.name,
        category: p.category?.slug || p.category?.name?.toLowerCase() || 'tshirts',
        price: p.salePrice || p.price || 0,
        oldPrice: p.price || 0,
        icon: p.icon || '👕',
        image: p.image || p.thumbnail || p.images?.[0] || '',
        tag: p.tag || (p.isOnSale ? 'Sale' : p.isNewArrival ? 'New' : ''),
        tagType: p.isOnSale ? 'sale' : p.isNewArrival ? 'new' : '',
        rating: p.rating || 4.5,
        reviews: p.numReviews || 0,
        colors: p.colors || ['#6C3CE1'],
        sizes: p.sizes || ['M', 'L'],
        description: p.description || '',
        totalSold: p.totalSold || 0,
        isFeatured: p.isFeatured || false,
        isBestSeller: p.isBestSeller || false,
        isNewArrival: p.isNewArrival || false,
        isTrending: p.isTrending || false,
        isOnSale: p.isOnSale || false
      }));
    }
  } catch (e) {
    console.log('Using static product data (API unavailable)');
  }
}

let currentFilter = 'all';
let currentSort = 'default';
let currentLayout = 'grid';
let currentPage = 1;
const PER_PAGE = 12;

function getProducts(filter, sort) {
  let results = [...PRODUCTS];
  if (filter && filter !== 'all') {
    results = results.filter(p => p.category === filter);
  }
  if (sort === 'price-asc') results.sort((a, b) => a.price - b.price);
  else if (sort === 'price-desc') results.sort((a, b) => b.price - a.price);
  else if (sort === 'rating') results.sort((a, b) => b.rating - a.rating);
  else if (sort === 'name') results.sort((a, b) => a.name.localeCompare(b.name));
  return results;
}

function renderProducts(filter, targetEl, opts) {
  filter = filter || currentFilter;
  targetEl = targetEl || document.getElementById('productsGrid');
  if (!targetEl) return;
  opts = opts || {};

  const results = getProducts(filter, opts.sort || currentSort);
  const grid = targetEl;

  if (results.length === 0) {
    grid.innerHTML = `<div class="error-message" style="grid-column:1/-1"><i class="fas fa-search"></i><h3>No Products Found</h3><p>Try adjusting your filters or check back later.</p></div>`;
    return results;
  }

  grid.innerHTML = results.map((p, i) => `
    <div class="product-card${opts.layout === 'list' ? ' list-item' : ''}" data-id="${p.id}" onclick="viewProduct(${p.id})">
      <div class="product-img" style="background:${p.category === 'tshirts' ? 'linear-gradient(135deg,#6C3CE1,#E84393)' : p.category === 'hoodies' ? 'linear-gradient(135deg,#FF6B6B,#FFD93D)' : p.category === 'shoes' ? 'linear-gradient(135deg,#00D2FF,#3A7BD5)' : 'linear-gradient(135deg,#A8E063,#56AB2F)'}">
        ${p.tag ? `<span class="tag tag-${p.tagType}">${p.tag}</span>` : ''}
        ${p.image ? `<img src="${p.image}" alt="${p.name}">` : p.icon}
      </div>
      <div class="product-info">
        <h3>${p.name}</h3>
        <div class="rating">${'⭐'.repeat(Math.floor(p.rating))} <span>(${p.rating})</span></div>
        <div class="price">$${p.price.toFixed(2)} ${p.oldPrice ? `<span class="old">$${p.oldPrice.toFixed(2)}</span>` : ''}</div>
        <button class="add-to-cart" onclick="event.stopPropagation(); window.app.addToCart(${p.id})">Add to Cart <i class="fas fa-plus"></i></button>
      </div>
    </div>
  `).join('');

  if (typeof observeReveal === 'function') setTimeout(observeReveal, 50);
  return results;
}

function viewProduct(id) {
  window.location.href = `product.html?id=${id}`;
}

function getProductById(id) {
  return PRODUCTS.find(p => p.id === Number(id));
}

async function searchProducts(query) {
  if (!query || !query.trim()) return PRODUCTS;
  try {
    if (typeof api !== 'undefined') {
      const data = await api.searchProducts(query.trim());
      if (data && data.products && data.products.length > 0) return data.products;
    }
  } catch (e) {}
  const q = query.toLowerCase().trim();
  return PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q) ||
    p.description.toLowerCase().includes(q)
  );
}
