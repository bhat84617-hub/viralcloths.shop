let slideInterval;
let testimonialInterval;

function initApp() {
  loadCart();
  updateCartUI();

  initHeaderScroll();
  initMobileMenu();
  initBackToTop();
  initSlider();
  initTestimonials();
  observeReveal();
  initNewsletter();
  initSearch();
  initWishlistButtons();
  initAuthUI();

  if (document.getElementById('productsGrid')) {
    loadProductsFromAPI().then(() => {
      renderProducts();
      syncCartToServer();
    }).catch(() => {
      renderProducts();
    });
  }

  if (document.getElementById('faqContainer')) {
    initFAQ();
  }

  if (document.getElementById('searchInput')) {
    initSearchPage();
  }

  if (document.querySelector('.checkout-form')) {
    initCheckout();
  }

  if (document.querySelector('.contact-form-wrapper')) {
    initContactForm();
  }

  if (document.getElementById('wishlistGrid')) {
    renderWishlistPage();
  }

  if (document.getElementById('cartPageItems')) {
    renderCartPage();
  }

  if (document.getElementById('productDetail')) {
    initProductDetail();
  }
}

/* ===== HEADER SCROLL ===== */
function initHeaderScroll() {
  window.addEventListener('scroll', () => {
    const header = document.getElementById('header');
    if (header) header.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });
}

/* ===== MOBILE MENU ===== */
function initMobileMenu() {
  document.querySelector('.hamburger')?.addEventListener('click', () => {
    const nav = document.querySelector('nav');
    nav.classList.toggle('open');
  });

  document.querySelectorAll('nav a').forEach(a => {
    a.addEventListener('click', () => {
      document.querySelector('nav')?.classList.remove('open');
    });
  });
}

/* ===== BACK TO TOP ===== */
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 500);
  }, { passive: true });
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ===== SLIDER ===== */
function initSlider() {
  const slides = document.querySelectorAll('.slide');
  const dots = document.querySelectorAll('.slider-dots .dot');
  if (!slides.length) return;

  let current = 0;

  function goTo(idx) {
    slides.forEach((s, i) => s.classList.toggle('active', i === idx));
    dots.forEach((d, i) => d.classList.toggle('active', i === idx));
    current = idx;
    resetInterval();
  }

  function next() { goTo((current + 1) % slides.length); }
  function prev() { goTo((current - 1 + slides.length) % slides.length); }

  function resetInterval() {
    clearInterval(slideInterval);
    slideInterval = setInterval(next, 5000);
  }

  dots.forEach((dot, i) => dot.addEventListener('click', () => goTo(i)));

  const prevBtn = document.querySelector('.slider-arrows button:first-child');
  const nextBtn = document.querySelector('.slider-arrows button:last-child');
  if (prevBtn) prevBtn.addEventListener('click', prev);
  if (nextBtn) nextBtn.addEventListener('click', next);

  slideInterval = setInterval(next, 5000);

  window.goToSlide = goTo;
  window.nextSlide = next;
  window.prevSlide = prev;
}

/* ===== TESTIMONIALS ===== */
function initTestimonials() {
  const track = document.getElementById('testimonialTrack');
  const dots = document.querySelectorAll('#testimonials .dot');
  if (!track || !dots.length) return;

  let current = 0;

  function goTo(idx) {
    current = idx;
    track.style.transform = `translateX(-${idx * 100}%)`;
    dots.forEach((d, i) => {
      d.style.background = i === idx ? 'var(--primary)' : 'rgba(255,255,255,0.2)';
      d.style.width = i === idx ? '35px' : '12px';
      d.style.borderRadius = i === idx ? '6px' : '50%';
    });
    resetInterval();
  }

  function resetInterval() {
    clearInterval(testimonialInterval);
    testimonialInterval = setInterval(() => goTo((current + 1) % dots.length), 6000);
  }

  dots.forEach((d, i) => d.addEventListener('click', () => goTo(i)));
  testimonialInterval = setInterval(() => goTo(1), 6000);

  window.goToTestimonial = goTo;
}

/* ===== SCROLL REVEAL ===== */
function observeReveal() {
  const els = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
  if (!els.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('active');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  els.forEach(el => observer.observe(el));
}

/* ===== NEWSLETTER ===== */
function initNewsletter() {
  const form = document.querySelector('.newsletter form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = form.querySelector('input[type="email"]');
    if (input && input.value.trim()) {
      const emails = JSON.parse(localStorage.getItem('vc_subscribers') || '[]');
      if (!emails.includes(input.value.trim())) {
        emails.push(input.value.trim());
        localStorage.setItem('vc_subscribers', JSON.stringify(emails));
      }
      showToast('Thanks for subscribing! Check your inbox for 10% off!');
      input.value = '';
    } else {
      showToast('Please enter a valid email address.');
    }
  });
}

/* ===== SEARCH TOGGLE ===== */
function initSearch() {
  const searchIcon = document.querySelector('.fa-search');
  if (searchIcon) {
    searchIcon.addEventListener('click', () => {
      window.location.href = 'search.html';
    });
  }
}

/* ===== WISHLIST BUTTONS ===== */
function initWishlistButtons() {
  document.querySelectorAll('.wishlist-btn').forEach(btn => {
    const id = Number(btn.dataset.id);
    btn.classList.toggle('active', isInWishlist(id));
  });
}

/* ===== FAQ ===== */
function initFAQ() {
  document.querySelectorAll('.faq-question').forEach(q => {
    q.addEventListener('click', () => {
      const item = q.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });

  const searchInput = document.getElementById('faqSearch');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('.faq-item').forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(q) ? '' : 'none';
      });
    });
  }
}

/* ===== SEARCH PAGE ===== */
function initSearchPage() {
  const input = document.getElementById('searchInput');
  const grid = document.getElementById('searchResults');
  const info = document.getElementById('searchInfo');
  const clearBtn = document.getElementById('searchClear');

  if (!input || !grid) return;

  async function performSearch() {
    const q = input.value;
    const results = await searchProducts(q);
    clearBtn.classList.toggle('visible', q.length > 0);

    if (info) {
      info.textContent = q.trim() ? `${results.length} result${results.length !== 1 ? 's' : ''} for "${q}"` : '';
    }

    if (results.length === 0) {
      grid.innerHTML = `<div class="error-message" style="grid-column:1/-1"><i class="fas fa-search"></i><h3>No results found</h3><p>Try different keywords or browse our categories.</p></div>`;
      return;
    }

    grid.innerHTML = results.map((p, i) => `
      <div class="product-card" data-id="${p.id}" onclick="viewProduct(${p.id})">
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
  }

  input.addEventListener('input', performSearch);

  clearBtn?.addEventListener('click', () => {
    input.value = '';
    performSearch();
    input.focus();
  });
}

/* ===== CHECKOUT ===== */
function initCheckout() {
  const form = document.querySelector('.checkout-form');
  if (!form) return;

  renderCheckoutSummary();

  const placeOrderBtn = form.querySelector('.place-order-btn');
  if (placeOrderBtn) {
    placeOrderBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (validateCheckoutForm(form)) {
        const orderNum = 'VC-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
        localStorage.setItem('vc_last_order', JSON.stringify({
          number: orderNum,
          items: cart,
          total: getCartTotal(),
          date: new Date().toISOString()
        }));
        clearCart();
        window.location.href = 'order-success.html?order=' + orderNum;
      }
    });
  }

  initPaymentMethods();
}

function validateCheckoutForm(form) {
  let valid = true;
  form.querySelectorAll('[required]').forEach(field => {
    const errorEl = field.closest('.form-group')?.querySelector('.error-text');
    if (!field.value.trim()) {
      field.classList.add('error');
      if (errorEl) errorEl.classList.add('visible');
      valid = false;
    } else {
      field.classList.remove('error');
      if (errorEl) errorEl.classList.remove('visible');
    }
    if (field.type === 'email' && field.value.trim() && !field.value.includes('@')) {
      field.classList.add('error');
      if (errorEl) { errorEl.textContent = 'Please enter a valid email'; errorEl.classList.add('visible'); }
      valid = false;
    }
  });

  if (!valid) {
    showToast('Please fill in all required fields');
    form.querySelector('.error')?.focus();
  }
  return valid;
}

function renderCheckoutSummary() {
  const container = document.querySelector('.checkout-summary .checkout-items');
  if (!container) return;
  if (cart.length === 0) {
    container.innerHTML = '<p style="color:rgba(255,255,255,0.4)">Your cart is empty</p>';
    return;
  }
  container.innerHTML = cart.map(c => `
    <div class="checkout-item">
      <div class="item-icon" style="display:flex;align-items:center;justify-content:center;background:${c.image ? 'none' : 'var(--gradient1)'}">
        ${c.image ? `<img src="${c.image}" alt="${c.name}" style="width:100%;height:100%;object-fit:cover;border-radius:6px">` : c.icon}
      </div>
      <div class="item-detail">
        <h4>${c.name}</h4>
        <p>Qty: ${c.qty}</p>
      </div>
      <div class="item-total">$${(c.price * c.qty).toFixed(2)}</div>
    </div>
  `).join('');

  const totalEl = container.closest('.checkout-summary')?.querySelector('.summary-total');
  if (totalEl) totalEl.textContent = `$${getCartTotal().toFixed(2)}`;
}

function initPaymentMethods() {
  document.querySelectorAll('.payment-method').forEach(m => {
    m.addEventListener('click', () => {
      document.querySelectorAll('.payment-method').forEach(p => p.classList.remove('active'));
      m.classList.add('active');
    });
  });
}

/* ===== CONTACT FORM ===== */
function initContactForm() {
  const form = document.getElementById('contactForm');
  const success = document.getElementById('contactSuccess');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;
    form.querySelectorAll('[required]').forEach(f => {
      const error = f.closest('.form-group')?.querySelector('.error-text');
      if (!f.value.trim()) {
        f.classList.add('error');
        if (error) error.classList.add('visible');
        valid = false;
      } else {
        f.classList.remove('error');
        if (error) error.classList.remove('visible');
      }
    });
    if (valid) {
      form.style.display = 'none';
      if (success) success.classList.add('visible');
      showToast('Message sent successfully! We\'ll get back to you soon.');
      form.reset();
    }
  });
}

/* ===== PRODUCT DETAIL ===== */
function initProductDetail() {
  const id = getQueryParam('id');
  const product = getProductById(id);
  const container = document.getElementById('productDetail');
  if (!container) return;

  if (!product) {
    container.innerHTML = `
      <div class="error-message" style="grid-column:1/-1">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Product Not Found</h3>
        <p>The product you're looking for doesn't exist.</p>
        <button class="btn btn-primary" onclick="window.location.href='collection.html'">Browse Products</button>
      </div>`;
    return;
  }

  const bgColors = {
    tshirts: 'linear-gradient(135deg,#6C3CE1,#E84393)',
    hoodies: 'linear-gradient(135deg,#FF6B6B,#FFD93D)',
    shoes: 'linear-gradient(135deg,#00D2FF,#3A7BD5)',
    accessories: 'linear-gradient(135deg,#A8E063,#56AB2F)'
  };

  container.innerHTML = `
    <div class="product-detail-image" style="background:${bgColors[product.category] || bgColors.accessories}">
      ${product.tag ? `<span class="tag tag-${product.tagType}">${product.tag}</span>` : ''}
      ${product.image ? `<img src="${product.image}" alt="${product.name}">` : product.icon}
    </div>
    <div class="product-detail-info">
      <h1>${product.name}</h1>
      <div class="rating">${'⭐'.repeat(Math.floor(product.rating))} <span>(${product.rating} · ${product.reviews} reviews)</span></div>
      <div class="price">$${product.price.toFixed(2)} ${product.oldPrice ? `<span class="old">$${product.oldPrice.toFixed(2)}</span>` : ''}</div>
      <p class="description">${product.description}</p>
      <div class="size-selector">
        <h4>Select Size</h4>
        <div class="sizes">
          ${product.sizes.map(s => `<button class="size-btn" onclick="this.closest('.sizes').querySelectorAll('.size-btn').forEach(b=>b.classList.remove('active'));this.classList.add('active')">${s}</button>`).join('')}
        </div>
      </div>
      <div class="qty-selector">
        <h4>Quantity</h4>
        <div class="qty-controls">
          <button onclick="const s=this.nextElementSibling;let v=parseInt(s.textContent);if(v>1){v--;s.textContent=v;}">−</button>
          <span>1</span>
          <button onclick="const s=this.previousElementSibling;let v=parseInt(s.textContent);v++;s.textContent=v;">+</button>
        </div>
      </div>
      <div class="action-buttons">
        <button class="btn btn-primary" onclick="window.app.addToCart(${product.id});window.location.href='cart.html'"><i class="fas fa-shopping-bag"></i> Buy Now</button>
        <button class="btn btn-secondary" onclick="window.app.addToCart(${product.id})"><i class="fas fa-plus"></i> Add to Cart</button>
        <button class="wishlist-btn ${isInWishlist(product.id) ? 'active' : ''}" data-id="${product.id}" onclick="window.app.toggleWishlist(${product.id})"><i class="fas fa-heart"></i></button>
      </div>
      <div class="product-meta">
        <p><strong>Category:</strong> ${product.category.charAt(0).toUpperCase() + product.category.slice(1)}</p>
        <p><strong>Free Shipping:</strong> On orders over $50</p>
        <p><strong>Returns:</strong> 30-day hassle-free returns</p>
      </div>
    </div>
  `;
}

/* ===== WISHLIST PAGE ===== */
function renderWishlistPage() {
  const grid = document.getElementById('wishlistGrid');
  if (!grid) return;

  const items = getWishlistProducts();
  if (items.length === 0) {
    grid.innerHTML = `
      <div class="wishlist-empty" style="grid-column:1/-1">
        <i class="fas fa-heart"></i>
        <h2>Your wishlist is empty</h2>
        <p>Save items you love by clicking the heart icon on any product.</p>
        <button class="btn btn-primary" onclick="window.location.href='collection.html'">Browse Products</button>
      </div>`;
    return;
  }

  grid.innerHTML = items.map(p => `
    <div class="product-card wishlist-item" onclick="viewProduct(${p.id})">
      <button class="remove-wishlist" onclick="event.stopPropagation(); window.app.toggleWishlist(${p.id}); this.closest('.product-card').remove(); if(document.querySelectorAll('.wishlist-item').length === 0) renderWishlistPage();"><i class="fas fa-times"></i></button>
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
}

/* ===== CART PAGE ===== */
function renderCartPage() {
  const container = document.getElementById('cartPageItems');
  const summary = document.getElementById('cartPageSummary');
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = '<div class="empty-cart" style="grid-column:1/-1;padding:80px 20px"><i class="fas fa-shopping-bag"></i><h2>Your cart is empty</h2><p style="color:rgba(255,255,255,0.5);margin-bottom:20px">Add some products to get started!</p><button class="btn btn-primary" onclick="window.location.href=\'collection.html\'">Shop Now</button></div>';
    if (summary) summary.innerHTML = '';
    return;
  }

  container.innerHTML = cart.map(c => `
    <div class="cart-page-item">
      <div class="item-img" style="background:${c.image ? 'none' : 'var(--gradient1)'}">
        ${c.image ? `<img src="${c.image}" alt="${c.name}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit">` : c.icon}
      </div>
      <div class="item-details">
        <h3>${c.name}</h3>
        <p>Free Shipping</p>
        <div class="price">$${(c.price * c.qty).toFixed(2)}</div>
        <div class="qty" style="display:flex;align-items:center;gap:8px;margin-top:10px">
          <button onclick="window.app.changeQty(${c.id}, -1)" style="width:25px;height:25px;border-radius:50%;border:none;background:rgba(255,255,255,0.1);color:#fff;cursor:pointer">−</button>
          <span style="font-weight:600;min-width:20px;text-align:center">${c.qty}</span>
          <button onclick="window.app.changeQty(${c.id}, 1)" style="width:25px;height:25px;border-radius:50%;border:none;background:rgba(255,255,255,0.1);color:#fff;cursor:pointer">+</button>
          <button onclick="window.app.removeFromCart(${c.id})" style="margin-left:10px;background:none;border:none;color:var(--secondary);cursor:pointer;font-size:14px"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    </div>
  `).join('');

  if (summary) {
    const subtotal = getCartTotal();
    const shipping = subtotal >= 50 ? 0 : 9.99;
    const tax = subtotal * 0.08;
    const total = subtotal + shipping + tax;
    summary.innerHTML = `
      <h3>Order Summary</h3>
      <div class="summary-row"><span>Subtotal</span><span>$${subtotal.toFixed(2)}</span></div>
      <div class="summary-row"><span>Shipping</span><span>${shipping === 0 ? 'FREE' : '$' + shipping.toFixed(2)}</span></div>
      <div class="summary-row"><span>Tax (8%)</span><span>$${tax.toFixed(2)}</span></div>
      <div class="promo-code">
        <input type="text" placeholder="Promo code" id="promoInput">
        <button onclick="applyPromo()">Apply</button>
      </div>
      <div class="summary-row total"><span>Total</span><span>$${total.toFixed(2)}</span></div>
      <button class="checkout-btn" onclick="checkout()" style="margin-top:10px">Proceed to Checkout <i class="fas fa-arrow-right"></i></button>
    `;
  }
}

function applyPromo() {
  const input = document.getElementById('promoInput');
  if (!input) return;
  const code = input.value.trim().toUpperCase();
  if (code === 'WELCOME10') {
    showToast('Promo applied! 10% discount added.');
  } else if (code === 'FREESHIP') {
    showToast('Free shipping applied!');
  } else {
    showToast('Invalid promo code');
  }
}

/* ===== TOAST ===== */
function showToast(msg, type) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.className = 'toast' + (type ? ' ' + type : '');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timeout);
  t._timeout = setTimeout(() => t.classList.remove('show'), 3000);
}

/* ===== COLLECTION ===== */
function initCollection() {
  const grid = document.getElementById('collectionGrid');
  if (!grid) return;

  const cat = getQueryParam('category');
  if (cat) {
    currentFilter = cat;
    document.querySelectorAll('.cat-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.cat === cat);
    });
  }

  renderProducts(currentFilter, grid, { sort: currentSort, layout: currentLayout });

  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.cat;
      renderProducts(currentFilter, grid, { sort: currentSort, layout: currentLayout });
    });
  });

  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      currentSort = sortSelect.value;
      renderProducts(currentFilter, grid, { sort: currentSort, layout: currentLayout });
    });
  }

  document.querySelectorAll('.layout-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.layout-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentLayout = btn.dataset.layout;
      grid.classList.toggle('list-view', currentLayout === 'list');
    });
  });
}

/* ===== AUTH UI ===== */
function initAuthUI() {
  const headerActions = document.querySelector('.header-actions');
  if (!headerActions) return;

  const userIcon = document.createElement('i');
  userIcon.id = 'authIcon';
  userIcon.className = 'fas fa-user';
  userIcon.style.cursor = 'pointer';
  userIcon.onclick = toggleAuthModal;

  const searchIcon = headerActions.querySelector('.fa-search');
  if (searchIcon) {
    searchIcon.parentNode.insertBefore(userIcon, searchIcon.nextSibling);
  } else {
    headerActions.insertBefore(userIcon, headerActions.firstChild);
  }

  updateAuthIcon();
}

function updateAuthIcon() {
  const icon = document.getElementById('authIcon');
  if (!icon) return;
  if (typeof api !== 'undefined' && api.isLoggedIn && api.isLoggedIn()) {
    icon.className = 'fas fa-user-check';
    icon.style.color = 'var(--accent)';
    icon.title = api.getUser()?.name || 'Logged in';
    icon.onclick = function(e) {
      e.stopPropagation();
      const menu = document.getElementById('userMenu');
      if (menu) menu.classList.toggle('open');
      else showUserMenu(e);
    };
  } else {
    icon.className = 'fas fa-user';
    icon.style.color = '';
    icon.title = 'Login / Register';
    icon.onclick = toggleAuthModal;
  }
}

function showUserMenu(e) {
  const existing = document.getElementById('userMenu');
  if (existing) existing.remove();
  const menu = document.createElement('div');
  menu.id = 'userMenu';
  menu.style.cssText = 'position:absolute;top:100%;right:0;background:#1a1a2e;border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:8px 0;min-width:180px;z-index:1000;box-shadow:0 8px 32px rgba(0,0,0,0.4)';
  const user = typeof api !== 'undefined' && api.getUser ? api.getUser() : null;
  menu.innerHTML = `
    <div style="padding:8px 16px;border-bottom:1px solid rgba(255,255,255,0.05);font-size:14px;color:rgba(255,255,255,0.6)">${user?.name || 'User'}</div>
    <a href="orders.html" style="display:block;padding:10px 16px;color:#fff;text-decoration:none;font-size:14px"><i class="fas fa-truck"></i> My Orders</a>
    <a href="#" onclick="toggleAuthModal();document.getElementById('userMenu')?.remove()" style="display:block;padding:10px 16px;color:#fff;text-decoration:none;font-size:14px"><i class="fas fa-user-cog"></i> My Profile</a>
    <div style="border-top:1px solid rgba(255,255,255,0.05);margin-top:4px">
      <a href="#" onclick="handleLogout()" style="display:block;padding:10px 16px;color:#FF6B6B;text-decoration:none;font-size:14px"><i class="fas fa-sign-out-alt"></i> Logout</a>
    </div>
  `;
  document.querySelector('.header-actions')?.appendChild(menu);
  setTimeout(() => document.addEventListener('click', closeUserMenu), 100);
}

function closeUserMenu() {
  const menu = document.getElementById('userMenu');
  if (menu) menu.remove();
  document.removeEventListener('click', closeUserMenu);
}

async function handleLogout() {
  if (typeof api !== 'undefined') await api.logout();
  document.getElementById('userMenu')?.remove();
  updateAuthIcon();
  showToast('Logged out');
}

function toggleAuthModal() {
  if (typeof api !== 'undefined' && api.isLoggedIn && api.isLoggedIn()) {
    const m = document.getElementById('authModal');
    if (m) {
      m.classList.toggle('open');
      updateProfileModal();
    }
    return;
  }
  const m = document.getElementById('authModal');
  if (m) {
    m.classList.toggle('open');
    document.getElementById('authFormContainer').style.display = '';
    document.getElementById('profileContainer').style.display = 'none';
  }
}

function updateProfileModal() {
  document.getElementById('authFormContainer').style.display = 'none';
  document.getElementById('profileContainer').style.display = '';
  const user = typeof api !== 'undefined' && api.getUser ? api.getUser() : null;
  if (user) {
    document.getElementById('profileName').textContent = user.name || '';
    document.getElementById('profileEmail').textContent = user.email || '';
    document.getElementById('profileRole').textContent = user.role || 'customer';
  }
}

const authModalHTML = `
<div class="modal-overlay" id="authModal">
  <div class="modal-dialog" onclick="event.stopPropagation()">
    <button class="modal-close" onclick="document.getElementById('authModal').classList.remove('open')">&times;</button>
    <div id="authFormContainer">
      <div class="auth-tabs">
        <button class="auth-tab active" data-tab="login" onclick="switchAuthTab('login')">Sign In</button>
        <button class="auth-tab" data-tab="register" onclick="switchAuthTab('register')">Register</button>
      </div>
      <form id="loginForm" class="auth-form" onsubmit="handleLogin(event)">
        <h3>Welcome Back</h3>
        <div class="form-group"><input type="email" id="loginEmail" placeholder="Email" required></div>
        <div class="form-group"><input type="password" id="loginPassword" placeholder="Password" required></div>
        <p id="loginError" class="auth-error"></p>
        <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center">Sign In</button>
        <p style="text-align:center;margin-top:10px;font-size:13px;color:rgba(255,255,255,0.4)"><a href="#" onclick="showForgotPassword(event)" style="color:var(--primary)">Forgot password?</a></p>
      </form>
      <form id="registerForm" class="auth-form" style="display:none" onsubmit="handleRegister(event)">
        <h3>Create Account</h3>
        <div class="form-group"><input type="text" id="regName" placeholder="Full Name" required></div>
        <div class="form-group"><input type="email" id="regEmail" placeholder="Email" required></div>
        <div class="form-group"><input type="password" id="regPassword" placeholder="Password (min 6 chars)" required></div>
        <p id="registerError" class="auth-error"></p>
        <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center">Create Account</button>
      </form>
      <form id="forgotForm" class="auth-form" style="display:none" onsubmit="handleForgotPassword(event)">
        <h3>Reset Password</h3>
        <div class="form-group"><input type="email" id="forgotEmail" placeholder="Email" required></div>
        <p id="forgotError" class="auth-error"></p>
        <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center">Send Reset Link</button>
        <p style="text-align:center;margin-top:10px"><a href="#" onclick="switchAuthTab('login');return false" style="color:var(--primary);font-size:13px">Back to Sign In</a></p>
      </form>
    </div>
    <div id="profileContainer" style="display:none;text-align:center;padding:20px">
      <div style="font-size:60px;margin-bottom:15px">&#x1F464;</div>
      <h3 id="profileName"></h3>
      <p id="profileEmail" style="color:rgba(255,255,255,0.5);margin:5px 0"></p>
      <p id="profileRole" style="font-size:13px;color:var(--accent);margin-bottom:20px"></p>
      <a href="orders.html" class="btn btn-secondary" style="width:100%;justify-content:center;margin-bottom:10px;display:flex">My Orders <i class="fas fa-arrow-right"></i></a>
      <button class="btn btn-secondary" onclick="handleLogout()" style="width:100%;justify-content:center">Sign Out</button>
    </div>
  </div>
</div>`;

function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.getElementById('loginForm').style.display = tab === 'login' ? '' : 'none';
  document.getElementById('registerForm').style.display = tab === 'register' ? '' : 'none';
  document.getElementById('forgotForm').style.display = 'none';
  document.getElementById('loginError').textContent = '';
  document.getElementById('registerError').textContent = '';
}

function showForgotPassword(e) {
  e.preventDefault();
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('registerForm').style.display = 'none';
  document.getElementById('forgotForm').style.display = '';
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const errorEl = document.getElementById('loginError');
  try {
    await api.login(email, password);
    document.getElementById('authModal').classList.remove('open');
    updateAuthIcon();
    showToast('Welcome back, ' + api.getUser()?.name + '!');
    syncCartToServer();
  } catch (err) {
    errorEl.textContent = err.message;
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('regName').value;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  const errorEl = document.getElementById('registerError');
  try {
    await api.register(name, email, password);
    document.getElementById('authModal').classList.remove('open');
    updateAuthIcon();
    showToast('Account created! Check your email to verify.');
  } catch (err) {
    errorEl.textContent = err.message;
  }
}

async function handleForgotPassword(e) {
  e.preventDefault();
  const email = document.getElementById('forgotEmail').value;
  const errorEl = document.getElementById('forgotError');
  try {
    await api.request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
    errorEl.textContent = '';
    errorEl.style.color = 'var(--gradient4)';
    errorEl.textContent = 'Reset link sent! Check your email.';
  } catch (err) {
    errorEl.textContent = err.message;
  }
}



document.addEventListener('DOMContentLoaded', () => {
  window.app = {
    addToCart, removeFromCart, changeQty, toggleCart, checkout,
    toggleWishlist, isInWishlist, showToast,
    saveForLater, moveToCart, removeSaved, moveToWishlist,
    applyCoupon, removeCoupon, applyGiftCard, removeGiftCard,
    updateCartUI, clearCart
  };

  const style = document.createElement('style');
  style.textContent = authModalStyles;
  document.head.appendChild(style);

  const div = document.createElement('div');
  div.innerHTML = authModalHTML;
  document.body.appendChild(div.firstElementChild);

  initApp();
  if (document.getElementById('collectionGrid')) initCollection();
});

const authModalStyles = `
.modal-overlay { position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);backdrop-filter:blur(5px);z-index:5000;display:none;align-items:center;justify-content:center; }
.modal-overlay.open { display:flex; }
.modal-dialog { background:#1a1a2e;border-radius:20px;padding:30px;width:90%;max-width:420px;position:relative;max-height:80vh;overflow-y:auto;border:1px solid rgba(255,255,255,0.05); }
.modal-close { position:absolute;top:15px;right:15px;background:none;border:none;color:rgba(255,255,255,0.4);font-size:24px;cursor:pointer; }
.auth-tabs { display:flex;gap:0;margin-bottom:25px;border-bottom:1px solid rgba(255,255,255,0.05); }
.auth-tab { flex:1;padding:12px;background:none;border:none;color:rgba(255,255,255,0.4);font-size:14px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;border-bottom:2px solid transparent;transition:all 0.3s; }
.auth-tab.active { color:#fff;border-bottom-color:var(--primary); }
.auth-form h3 { font-size:20px;margin-bottom:20px; }
.auth-form .form-group { margin-bottom:15px; }
.auth-form input { width:100%;padding:14px 18px;border-radius:12px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:#fff;font-size:14px;outline:none;font-family:'Inter',sans-serif; }
.auth-form input:focus { border-color:var(--primary); }
.auth-error { color:var(--secondary);font-size:13px;text-align:center;margin-bottom:10px;min-height:20px; }
`;
