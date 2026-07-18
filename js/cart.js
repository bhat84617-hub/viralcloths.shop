let cart = [];
let wishlist = [];
let savedForLater = [];
let appliedCoupon = null;
let appliedGiftCard = null;

function loadCart() {
  try {
    const saved = localStorage.getItem('vc_cart');
    if (saved) cart = JSON.parse(saved);
    const savedWish = localStorage.getItem('vc_wishlist');
    if (savedWish) wishlist = JSON.parse(savedWish);
    const savedLater = localStorage.getItem('vc_saved');
    if (savedLater) savedForLater = JSON.parse(savedLater);
    const coupon = localStorage.getItem('vc_coupon');
    if (coupon) appliedCoupon = JSON.parse(coupon);
    const gc = localStorage.getItem('vc_giftcard');
    if (gc) appliedGiftCard = JSON.parse(gc);
  } catch (e) { cart = []; wishlist = []; savedForLater = []; appliedCoupon = null; appliedGiftCard = null; }
}

function saveCart() {
  try {
    localStorage.setItem('vc_cart', JSON.stringify(cart));
    localStorage.setItem('vc_wishlist', JSON.stringify(wishlist));
    localStorage.setItem('vc_saved', JSON.stringify(savedForLater));
    if (appliedCoupon) localStorage.setItem('vc_coupon', JSON.stringify(appliedCoupon));
    else localStorage.removeItem('vc_coupon');
    if (appliedGiftCard) localStorage.setItem('vc_giftcard', JSON.stringify(appliedGiftCard));
    else localStorage.removeItem('vc_giftcard');
  } catch (e) {}
}

function addToCart(id) {
  const product = getProductById(id);
  if (!product) return;
  const existing = cart.find(c => c.id === id);
  if (existing) { existing.qty++; }
  else { cart.push({ id: product.id, name: product.name, price: product.price, icon: product.icon, qty: 1, image: product.image || product.thumbnail || '' }); }
  // Remove from saved if present
  savedForLater = savedForLater.filter(s => s.id !== id);
  saveCart(); updateCartUI();
  showToast(`${product.name} added to cart!`);
  const count = document.getElementById('cartCount');
  if (count) { count.style.transform = 'scale(1.5)'; setTimeout(() => count.style.transform = 'scale(1)', 300); }
}

function removeFromCart(id) {
  cart = cart.filter(c => c.id !== id);
  saveCart(); updateCartUI();
}

function changeQty(id, delta) {
  const item = cart.find(c => c.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) { removeFromCart(id); return; }
  saveCart(); updateCartUI();
}

function clearCart() {
  cart = []; appliedCoupon = null; appliedGiftCard = null;
  localStorage.removeItem('vc_coupon'); localStorage.removeItem('vc_giftcard');
  saveCart(); updateCartUI();
}

function getCartSubtotal() { return cart.reduce((s, c) => s + c.price * c.qty, 0); }
function getCartCount() { return cart.reduce((s, c) => s + c.qty, 0); }

function getCalculatedTotals() {
  const subtotal = getCartSubtotal();
  const discount = appliedCoupon ? (appliedCoupon.type === 'percentage' ? Math.min(subtotal * (appliedCoupon.value / 100), appliedCoupon.maxDiscount || Infinity) : Math.min(appliedCoupon.value, subtotal)) : 0;
  const gcDiscount = appliedGiftCard ? Math.min(appliedGiftCard.balance, subtotal - discount) : 0;
  const shipping = subtotal >= 50 ? 0 : 9.99;
  const tax = Math.max(0, (subtotal - discount - gcDiscount) * 0.08);
  const total = Math.max(0, subtotal + shipping + tax - discount - gcDiscount);
  return { subtotal: Math.round(subtotal * 100) / 100, discount: Math.round(discount * 100) / 100, gcDiscount: Math.round(gcDiscount * 100) / 100, shipping: Math.round(shipping * 100) / 100, tax: Math.round(tax * 100) / 100, total: Math.round(total * 100) / 100 };
}

// Save for Later
function saveForLater(id) {
  const item = cart.find(c => c.id === id);
  if (!item) return;
  savedForLater.push({ ...item });
  removeFromCart(id);
  showToast('Saved for later');
}

function moveToCart(id) {
  const item = savedForLater.find(s => s.id === id);
  if (!item) return;
  savedForLater = savedForLater.filter(s => s.id !== id);
  cart.push({ ...item });
  saveCart(); updateCartUI();
}

function removeSaved(id) {
  savedForLater = savedForLater.filter(s => s.id !== id);
  saveCart(); updateCartUI();
}

// Move to Wishlist
function moveToWishlist(id) {
  const item = cart.find(c => c.id === id);
  if (!item) return;
  if (!wishlist.includes(id)) wishlist.push(id);
  removeFromCart(id);
  showToast('Moved to wishlist');
}

// Coupon
async function applyCoupon(code) {
  try {
    if (typeof api !== 'undefined') {
      const data = await api.validateCoupon(code, getCartSubtotal());
      appliedCoupon = data.coupon;
      saveCart(); updateCartUI();
      return data;
    }
  } catch (e) { throw e; }
}

function removeCoupon() {
  appliedCoupon = null;
  localStorage.removeItem('vc_coupon');
  updateCartUI();
}

// Gift Card
async function applyGiftCard(code) {
  try {
    if (typeof api !== 'undefined') {
      const data = await api.validateGiftCard(code);
      appliedGiftCard = data.giftCard;
      saveCart(); updateCartUI();
      return data;
    }
  } catch (e) { throw e; }
}

function removeGiftCard() {
  appliedGiftCard = null;
  localStorage.removeItem('vc_giftcard');
  updateCartUI();
}

function updateCartUI() {
  const count = document.getElementById('cartCount');
  if (count) count.textContent = getCartCount();

  const container = document.getElementById('cartItems');
  if (container) {
    if (cart.length === 0) {
      if (savedForLater.length > 0) {
        container.innerHTML = `<div class="empty-cart" style="padding:15px"><p>All items moved to Saved for Later</p></div>`;
      } else {
        container.innerHTML = '<div class="empty-cart"><i class="fas fa-shopping-bag"></i><p>Your cart is empty</p></div>';
      }
    } else {
      container.innerHTML = cart.map(c => `
        <div class="cart-item">
          <div class="item-icon" style="display:flex;align-items:center;justify-content:center;background:${c.image ? 'none' : 'var(--gradient1)'}">
            ${c.image ? `<img src="${c.image}" alt="${c.name}" style="width:100%;height:100%;object-fit:cover;border-radius:8px">` : c.icon}
          </div>
          <div class="item-info">
            <h4>${c.name}</h4>
            <p>$${(c.price * c.qty).toFixed(2)}</p>
            <div class="qty">
              <button onclick="changeQty(${c.id}, -1)">&#8722;</button>
              <span>${c.qty}</span>
              <button onclick="changeQty(${c.id}, 1)">+</button>
            </div>
          </div>
          <div class="cart-actions">
            <button onclick="saveForLater(${c.id})" title="Save for later"><i class="fas fa-clock"></i></button>
            <button onclick="moveToWishlist(${c.id})" title="Move to wishlist"><i class="fas fa-heart"></i></button>
            <button onclick="removeFromCart(${c.id})" title="Remove"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      `).join('');
    }
  }

  // Ensure drawer has the detailed totals structure
  ensureDrawerTotals();

  // Saved for later
  const savedContainer = document.getElementById('savedItems');
  if (savedContainer) {
    if (savedForLater.length === 0) {
      savedContainer.innerHTML = '';
    } else {
      savedContainer.innerHTML = `<h3 style="font-size:14px;margin:10px 0 8px;color:rgba(255,255,255,0.5)">Saved for Later (${savedForLater.length})</h3>` + savedForLater.map(s => `
        <div class="cart-item saved-item" style="padding:8px">
          <div class="item-icon" style="display:flex;align-items:center;justify-content:center;background:${s.image ? 'none' : 'var(--gradient1)'}">
            ${s.image ? `<img src="${s.image}" alt="${s.name}" style="width:100%;height:100%;object-fit:cover;border-radius:8px">` : s.icon}
          </div>
          <div class="item-info">
            <h4 style="font-size:13px">${s.name}</h4>
            <p style="font-size:12px">$${(s.price * s.qty).toFixed(2)}</p>
          </div>
          <div class="cart-actions" style="gap:4px">
            <button onclick="moveToCart(${s.id})" style="font-size:11px;padding:4px 8px">Move to Cart</button>
            <button onclick="removeSaved(${s.id})" style="font-size:11px"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      `).join('');
    }
  }

  // Totals
  const totals = getCalculatedTotals();
  const subtotalEl = document.getElementById('cartSubtotal');
  if (subtotalEl) subtotalEl.textContent = `$${totals.subtotal.toFixed(2)}`;
  const discountEl = document.getElementById('cartDiscount');
  if (discountEl) {
    if (totals.discount > 0) { discountEl.textContent = `-$${totals.discount.toFixed(2)}`; discountEl.style.display = 'flex'; }
    else discountEl.style.display = 'none';
  }
  const gcEl = document.getElementById('cartGiftCard');
  if (gcEl) {
    if (totals.gcDiscount > 0) { gcEl.textContent = `-$${totals.gcDiscount.toFixed(2)}`; gcEl.style.display = 'flex'; }
    else gcEl.style.display = 'none';
  }
  const shippingEl = document.getElementById('cartShipping');
  if (shippingEl) shippingEl.textContent = totals.shipping === 0 ? 'FREE' : `$${totals.shipping.toFixed(2)}`;
  const taxEl = document.getElementById('cartTax');
  if (taxEl) taxEl.textContent = `$${totals.tax.toFixed(2)}`;
  const totalEl = document.getElementById('cartTotal');
  if (totalEl) totalEl.textContent = `$${totals.total.toFixed(2)}`;
}

function ensureDrawerTotals() {
  const drawer = document.getElementById('cartDrawer');
  if (!drawer) return;
  // Add saved items container if not present
  if (!document.getElementById('savedItems')) {
    const savedDiv = document.createElement('div');
    savedDiv.id = 'savedItems';
    const totalDiv = drawer.querySelector('.cart-total');
    if (totalDiv) drawer.insertBefore(savedDiv, totalDiv);
    else drawer.appendChild(savedDiv);
  }
  // Add detailed totals if not present
  const totalDiv = drawer.querySelector('.cart-total');
  if (totalDiv) {
    if (!document.getElementById('cartSubtotal')) {
      const detailDiv = document.createElement('div');
      detailDiv.id = 'cartDetailTotals';
      detailDiv.style.cssText = 'padding:10px 20px;border-top:1px solid rgba(255,255,255,0.05)';
      detailDiv.innerHTML = `
        <div class="summary-row" style="font-size:13px"><span>Subtotal</span><span id="cartSubtotal">$0.00</span></div>
        <div class="summary-row" style="font-size:13px;display:none" id="cartDiscountRow"><span>Discount</span><span id="cartDiscount" style="color:#00D2FF">-$0.00</span></div>
        <div class="summary-row" style="font-size:13px;display:none" id="cartGiftRow"><span>Gift Card</span><span id="cartGiftCard" style="color:#00D2FF">-$0.00</span></div>
        <div class="summary-row" style="font-size:13px"><span>Shipping</span><span id="cartShipping">$0.00</span></div>
        <div class="summary-row" style="font-size:13px"><span>Tax</span><span id="cartTax">$0.00</span></div>
      `;
      drawer.insertBefore(detailDiv, totalDiv);
    }
  }
}

function toggleCart() {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');
  if (drawer) drawer.classList.toggle('open');
  if (overlay) overlay.classList.toggle('open');
}

function checkout() {
  if (cart.length === 0) { showToast('Your cart is empty!'); return; }
  window.location.href = 'checkout.html';
}

// Wishlist
function toggleWishlist(id) {
  const idx = wishlist.indexOf(id);
  if (idx > -1) { wishlist.splice(idx, 1); showToast('Removed from wishlist'); }
  else { wishlist.push(id); showToast('Added to wishlist!'); }
  saveCart(); updateWishlistUI();
}

function isInWishlist(id) { return wishlist.includes(id); }

function updateWishlistUI() {
  document.querySelectorAll('.wishlist-btn').forEach(btn => {
    const id = Number(btn.dataset.id);
    btn.classList.toggle('active', isInWishlist(id));
  });
}

function getWishlistProducts() { return wishlist.map(id => getProductById(id)).filter(Boolean); }
