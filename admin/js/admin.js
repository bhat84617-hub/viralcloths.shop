const API = window.location.origin.includes('localhost') ? 'http://localhost:5000/api' : '/api';
let token = localStorage.getItem('vc_admin_token');
let currentPage = 'dashboard';

async function apiCall(path, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  try {
    const res = await fetch(`${API}${path}`, { ...options, headers: { ...headers, ...options.headers } });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'API error');
    return data;
  } catch (err) {
    if (err.message.includes('jwt') || err.message.includes('token') || err.message.includes('Not authorized')) {
      localStorage.removeItem('vc_admin_token');
      token = null;
      document.getElementById('loginPage').style.display = '';
      document.getElementById('dashboardPage').style.display = 'none';
    }
    throw err;
  }
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  try {
    const data = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (data.user.role === 'customer') {
      errEl.textContent = 'Access denied. Admin only.';
      return;
    }
    token = data.token;
    localStorage.setItem('vc_admin_token', token);
    localStorage.setItem('vc_admin_user', JSON.stringify(data.user));
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('dashboardPage').style.display = '';
    document.getElementById('adminName').textContent = data.user.name;
    loadPage('dashboard');
  } catch (err) {
    errEl.textContent = err.message;
  }
});

function logout() {
  localStorage.removeItem('vc_admin_token');
  localStorage.removeItem('vc_admin_user');
  token = null;
  document.getElementById('loginPage').style.display = '';
  document.getElementById('dashboardPage').style.display = 'none';
}

function showPage(page, el) {
  document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
  if (el) el.classList.add('active');
  currentPage = page;
  document.getElementById('pageTitle').textContent = page.charAt(0).toUpperCase() + page.slice(1);
  loadPage(page);
}

async function loadPage(page) {
  const content = document.getElementById('pageContent');
  content.innerHTML = '<div style="text-align:center;padding:60px"><div class="spinner" style="width:40px;height:40px;border:3px solid rgba(255,255,255,0.1);border-top-color:var(--primary);border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 15px"></div><p style="color:rgba(255,255,255,0.4)">Loading...</p></div>';
  try {
    if (typeof this[`render${page.charAt(0).toUpperCase() + page.slice(1)}`] === 'function') {
      await this[`render${page.charAt(0).toUpperCase() + page.slice(1)}`](content);
    } else {
      content.innerHTML = '<p>Page not implemented</p>';
    }
  } catch (err) {
    content.innerHTML = `<div class="error-msg">${err.message}</div>`;
  }
}

// ===== DASHBOARD =====
async function renderDashboard(el) {
  const data = await apiCall('/admin/dashboard');
  const stats = data.stats;
  el.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-value">${stats.totalOrders}</div><div class="stat-label">Total Orders</div></div>
      <div class="stat-card"><div class="stat-value">$${Number(stats.totalRevenue).toLocaleString()}</div><div class="stat-label">Revenue</div></div>
      <div class="stat-card"><div class="stat-value">${stats.totalCustomers}</div><div class="stat-label">Customers</div></div>
      <div class="stat-card"><div class="stat-value">${stats.totalProducts}</div><div class="stat-label">Products</div></div>
    </div>
    <div class="table-section">
      <div class="table-header"><h3>Recent Orders</h3></div>
      <table>
        <thead><tr><th>Order #</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
        <tbody>${(stats.recentOrders || []).map(o => `<tr><td>${o.orderNumber}</td><td>${o.user?.name || 'Guest'}</td><td>$${o.total.toFixed(2)}</td><td><span class="badge badge-${o.orderStatus === 'delivered' ? 'success' : o.orderStatus === 'cancelled' ? 'danger' : 'warning'}">${o.orderStatus}</span></td><td>${new Date(o.createdAt).toLocaleDateString()}</td></tr>`).join('')}</tbody>
      </table>
    </div>
    <div class="table-section">
      <div class="table-header"><h3>Low Stock Products</h3></div>
      <table>
        <thead><tr><th>Product</th><th>Stock</th></tr></thead>
        <tbody>${(stats.lowStock || []).map(p => `<tr><td>${p.name}</td><td><span class="${p.totalStock <= 5 ? 'badge badge-danger' : 'badge badge-warning'}">${p.totalStock}</span></td></tr>`).join('')}</tbody>
      </table>
    </div>`;
}

// ===== PRODUCTS =====
async function renderProducts(el) {
  const data = await apiCall('/admin/products?limit=100');
  el.innerHTML = `
    <div class="search-bar"><input type="text" placeholder="Search products..." oninput="searchTable(this.value,'productsTable')"><button class="btn-primary btn-sm" onclick="openProductModal()">+ Add Product</button></div>
    <div class="table-section">
      <table id="productsTable">
        <thead><tr><th>Name</th><th>Price</th><th>Sale Price</th><th>Sold</th><th>Featured</th><th>Actions</th></tr></thead>
        <tbody>${data.products.map(p => `<tr>
          <td>${p.name}</td><td>$${p.price.toFixed(2)}</td>
          <td>${p.salePrice ? '$' + p.salePrice.toFixed(2) : '-'}</td>
          <td>${p.totalSold}</td>
          <td>${p.isFeatured ? '<span class="badge badge-success">Yes</span>' : '<span class="badge badge-warning">No</span>'}</td>
          <td><button class="btn-secondary btn-sm" onclick="editProduct('${p._id}')">Edit</button> <button class="btn-danger btn-sm" onclick="deleteItem('products','${p._id}')">Del</button></td>
        </tr>`).join('')}</tbody>
      </table>
    </div>`;
}

async function openProductModal(product) {
  const isEdit = !!product;
  let cats = [];
  try { const d = await apiCall('/categories?active=true'); cats = d.categories || []; } catch (e) {}
  const catOpts = cats.map(c => `<option value="${c._id}" ${product?.category === c._id || product?.category?._id === c._id ? 'selected' : ''}>${c.name}</option>`).join('');
  const modal = document.getElementById('productModal') || createModal('productModal', `
    <h3>${isEdit ? 'Edit' : 'Add'} Product</h3>
    <form id="productForm">
      <div class="form-group"><label>Name</label><input name="name" value="${product?.name || ''}" required></div>
      <div class="form-group"><label>Description</label><textarea name="description">${product?.description || ''}</textarea></div>
      <div class="form-row">
        <div class="form-group"><label>Price</label><input type="number" step="0.01" name="price" value="${product?.price || ''}" required></div>
        <div class="form-group"><label>Sale Price</label><input type="number" step="0.01" name="salePrice" value="${product?.salePrice || ''}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Category</label><select id="productCategory" name="category"><option value="">Select category...</option>${catOpts}</select></div>
        <div class="form-group"><label>Featured</label><select name="isFeatured"><option value="true" ${product?.isFeatured ? 'selected' : ''}>Yes</option><option value="false" ${!product?.isFeatured ? 'selected' : ''}>No</option></select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Active</label><select name="isActive"><option value="true" ${product?.isActive !== false ? 'selected' : ''}>Yes</option><option value="false" ${product?.isActive === false ? 'selected' : ''}>No</option></select></div>
      </div>
      <div class="modal-actions"><button type="button" class="btn-secondary" onclick="closeModal('productModal')">Cancel</button><button type="submit" class="btn-primary">${isEdit ? 'Update' : 'Create'}</button></div>
    </form>
  `);
  modal.classList.add('open');
  document.getElementById('productForm').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd);
    data.isFeatured = data.isFeatured === 'true';
    data.isActive = data.isActive === 'true';
    data.price = parseFloat(data.price);
    data.salePrice = data.salePrice ? parseFloat(data.salePrice) : 0;
    data.category = document.getElementById('productCategory')?.value || '000000000000000000000000';
    try {
      if (isEdit) {
        await apiCall(`/admin/products/${product._id}`, { method: 'PUT', body: JSON.stringify(data) });
      } else {
        await apiCall('/admin/products', { method: 'POST', body: JSON.stringify(data) });
      }
      closeModal('productModal');
      renderProducts(document.getElementById('pageContent'));
    } catch (err) { alert(err.message); }
  };
}

async function editProduct(id) {
  const data = await apiCall(`/products/${id}`);
  openProductModal(data.product);
}

// ===== ORDERS =====
let selectedOrderId = null;

async function renderOrders(el) {
  const data = await apiCall('/admin/orders?limit=100');
  el.innerHTML = `
    <div class="search-bar">
      <input type="text" placeholder="Search orders..." oninput="searchTable(this.value,'ordersTable')">
      <select onchange="filterOrdersByStatus(this.value)" style="padding:8px 12px;border-radius:6px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:#fff">
        <option value="">All Status</option>
        <option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="processing">Processing</option>
        <option value="shipped">Shipped</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option>
        <option value="return_requested">Return Requested</option><option value="refunded">Refunded</option>
      </select>
    </div>
    <div class="table-section">
      <table id="ordersTable">
        <thead><tr><th>Order #</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Payment</th><th>Date</th><th>Actions</th></tr></thead>
        <tbody>${data.orders.map(o => `<tr>
          <td><strong>${o.orderNumber}</strong></td>
          <td>${o.user?.name || o.shippingAddress?.fullName || 'Guest'}</td>
          <td>${(o.items||[]).length}</td>
          <td>$${o.total.toFixed(2)}</td>
          <td><span class="badge badge-${o.orderStatus === 'delivered' ? 'success' : o.orderStatus === 'cancelled' ? 'danger' : o.orderStatus === 'return_requested' ? 'warning' : 'info'}">${o.orderStatus}</span></td>
          <td><span class="badge badge-${o.paymentStatus === 'paid' ? 'success' : 'danger'}">${o.paymentStatus}</span></td>
          <td>${new Date(o.createdAt).toLocaleDateString()}</td>
          <td><button class="btn-secondary btn-sm" onclick="viewOrder('${o._id}')">View</button></td>
        </tr>`).join('')}</tbody>
      </table>
    </div>`;
}

async function filterOrdersByStatus(status) {
  const data = status ? await apiCall(`/admin/orders?limit=100&status=${status}`) : await apiCall('/admin/orders?limit=100');
  renderOrders(document.getElementById('pageContent'));
}

async function viewOrder(id) {
  selectedOrderId = id;
  const data = await apiCall(`/orders/${id}`);
  const o = data.order;
  const inv = await apiCall(`/orders/${id}/invoice`).catch(() => ({}));
  const itemsHtml = o.items.map(i => `<tr><td>${i.icon || ''} ${i.name}</td><td>${i.quantity}</td><td>$${(i.price||0).toFixed(2)}</td><td>$${((i.price||0)*(i.quantity||0)).toFixed(2)}</td></tr>`).join('');
  const historyHtml = (o.statusHistory||[]).map(h => `<div style="font-size:13px;margin:4px 0"><span style="color:#6C3CE1;text-transform:capitalize">${h.status}</span> - ${new Date(h.date).toLocaleString()} ${h.note ? '<br><span style="color:rgba(255,255,255,0.4)">' + h.note + '</span>' : ''}</div>`).join('');

  const modal = createModal('orderModal', `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px">
      <h3 style="margin:0">Order ${o.orderNumber}</h3>
      <span class="badge badge-${o.orderStatus === 'delivered' ? 'success' : 'danger'}" style="font-size:14px">${o.orderStatus}</span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:20px">
      <div style="padding:12px;background:rgba(255,255,255,0.03);border-radius:8px">
        <strong>Customer</strong>
        <p style="margin:4px 0;font-size:14px;color:rgba(255,255,255,0.6)">
          ${o.shippingAddress?.fullName || o.user?.name || 'Guest'}<br>
          ${o.shippingAddress?.email || o.guestEmail || ''}<br>
          ${o.shippingAddress?.phone || ''}
        </p>
      </div>
      <div style="padding:12px;background:rgba(255,255,255,0.03);border-radius:8px">
        <strong>Shipping Address</strong>
        <p style="margin:4px 0;font-size:14px;color:rgba(255,255,255,0.6)">
          ${o.shippingAddress?.street || ''}${o.shippingAddress?.apartment ? ', ' + o.shippingAddress.apartment : ''}<br>
          ${o.shippingAddress?.city || ''}, ${o.shippingAddress?.state || ''} ${o.shippingAddress?.zip || ''}<br>
          ${o.shippingAddress?.country || ''}
        </p>
        ${o.trackingNumber ? `<div style="margin-top:8px;padding:8px;background:rgba(0,210,255,0.1);border-radius:6px;font-size:13px"><i class="fas fa-truck"></i> ${o.trackingNumber}${o.trackingUrl ? ` <a href="${o.trackingUrl}" target="_blank" style="color:#00D2FF">Track</a>` : ''}</div>` : ''}
      </div>
    </div>
    <div style="margin-bottom:20px">
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;padding:12px;background:rgba(255,255,255,0.03);border-radius:8px">
        <label style="color:rgba(255,255,255,0.6)">Status:</label>
        <select id="orderStatusSelect" style="padding:8px 12px;border-radius:6px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:#fff">
          <option value="pending" ${o.orderStatus==='pending'?'selected':''}>Pending</option>
          <option value="confirmed" ${o.orderStatus==='confirmed'?'selected':''}>Confirmed</option>
          <option value="processing" ${o.orderStatus==='processing'?'selected':''}>Processing</option>
          <option value="shipped" ${o.orderStatus==='shipped'?'selected':''}>Shipped</option>
          <option value="delivered" ${o.orderStatus==='delivered'?'selected':''}>Delivered</option>
          <option value="cancelled" ${o.orderStatus==='cancelled'?'selected':''}>Cancelled</option>
        </select>
        <label style="color:rgba(255,255,255,0.6)">Tracking:</label>
        <input type="text" id="trackingInput" value="${o.trackingNumber||''}" placeholder="Tracking #" style="padding:8px 12px;border-radius:6px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:#fff;width:160px">
        <input type="text" id="trackingUrlInput" value="${o.trackingUrl||''}" placeholder="Tracking URL" style="padding:8px 12px;border-radius:6px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:#fff;width:200px">
        <input type="text" id="carrierInput" value="${o.carrier||''}" placeholder="Carrier" style="padding:8px 12px;border-radius:6px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:#fff;width:120px">
        <button class="btn-primary btn-sm" onclick="updateOrderStatus('${o._id}')">Update</button>
      </div>
    </div>
    <div style="margin-bottom:15px">
      <strong>Items (${(o.items||[]).length})</strong>
      <table style="margin-top:8px"><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>${itemsHtml}</tbody></table>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:15px">
      <div><div class="summary-row"><span>Subtotal</span><span>$${(o.subtotal||0).toFixed(2)}</span></div><div class="summary-row"><span>Shipping</span><span>${o.shippingCost === 0 ? 'FREE' : '$'+(o.shippingCost||0).toFixed(2)}</span></div><div class="summary-row"><span>Tax</span><span>$${(o.taxAmount||0).toFixed(2)}</span></div></div>
      <div>${o.discountAmount ? `<div class="summary-row" style="color:#00D2FF"><span>Discount</span><span>-$${o.discountAmount.toFixed(2)}</span></div>` : ''}${o.giftCardDiscount ? `<div class="summary-row" style="color:#00D2FF"><span>Gift Card</span><span>-$${o.giftCardDiscount.toFixed(2)}</span></div>` : ''}<div class="summary-row total" style="border:none;font-size:18px"><span>Total</span><span>$${(o.total||0).toFixed(2)}</span></div></div>
    </div>
    <div style="margin-bottom:15px">
      <strong>Payment:</strong> ${o.paymentMethod || 'N/A'} | ${o.paymentStatus || 'N/A'} | ID: ${o.paymentId || 'N/A'}
      ${o.paymentStatus === 'paid' && o.orderStatus !== 'cancelled' ? `<button class="btn-danger btn-sm" onclick="refundOrder('${o._id}')" style="margin-left:10px">Refund</button>` : ''}
    </div>
    <div style="margin-bottom:15px">
      <strong>Order Timeline</strong>
      <div style="margin-top:8px;max-height:150px;overflow-y:auto">${historyHtml || '<span style="color:rgba(255,255,255,0.3)">No history</span>'}</div>
    </div>
    <div style="display:flex;gap:10px">
      <button class="btn-secondary" onclick="printInvoice('${o._id}')"><i class="fas fa-print"></i> Print Invoice</button>
      <button class="btn-secondary" onclick="closeModal('orderModal')">Close</button>
    </div>
  `);
  modal.classList.add('open');
}

async function updateOrderStatus(id) {
  const status = document.getElementById('orderStatusSelect').value;
  const trackingNumber = document.getElementById('trackingInput').value;
  const trackingUrl = document.getElementById('trackingUrlInput').value;
  const carrier = document.getElementById('carrierInput').value;
  await apiCall(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, trackingNumber, trackingUrl, carrier }) });
  closeModal('orderModal');
  renderOrders(document.getElementById('pageContent'));
  showToast('Order updated');
}

async function refundOrder(id) {
  if (!confirm('Process refund for this order?')) return;
  try {
    await apiCall(`/orders/${id}/refund`, { method: 'PUT' });
    showToast('Refund processed');
    closeModal('orderModal');
    renderOrders(document.getElementById('pageContent'));
  } catch (e) { showToast(e.message); }
}

async function printInvoice(id) {
  try {
    const data = await apiCall(`/orders/${id}/invoice`);
    const o = data.order;
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Invoice ${o.orderNumber}</title>
      <style>body{font-family:Arial,sans-serif;padding:40px;max-width:800px;margin:auto}
      h1{color:#6C3CE1}table{width:100%;border-collapse:collapse;margin:20px 0}
      th,td{padding:10px;text-align:left;border-bottom:1px solid #ddd}
      .total-row{font-weight:700;font-size:18px}.right{text-align:right}
      .footer{margin-top:40px;font-size:13px;color:#666;text-align:center}
      </style></head><body>
      <h1>ViralClothes.Shop - Invoice</h1>
      <div style="display:flex;justify-content:space-between;margin:20px 0">
        <div><strong>Invoice #:</strong> INV-${o.orderNumber}<br><strong>Date:</strong> ${new Date(o.createdAt).toLocaleDateString()}</div>
        <div style="text-align:right"><strong>Bill To:</strong><br>${o.shippingAddress?.fullName || 'Customer'}<br>${o.shippingAddress?.email || ''}</div>
      </div>
      <table><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
      <tbody>${o.items.map(i => `<tr><td>${i.name}</td><td>${i.quantity}</td><td>$${(i.price||0).toFixed(2)}</td><td>$${((i.price||0)*(i.quantity||0)).toFixed(2)}</td></tr>`).join('')}</tbody></table>
      <div class="right"><div>Subtotal: $${(o.subtotal||0).toFixed(2)}</div><div>Shipping: ${o.shippingCost === 0 ? 'FREE' : '$'+(o.shippingCost||0).toFixed(2)}</div><div>Tax: $${(o.taxAmount||0).toFixed(2)}</div>${o.discountAmount ? '<div>Discount: -$'+o.discountAmount.toFixed(2)+'</div>' : ''}<div class="total-row">Total: $${(o.total||0).toFixed(2)}</div></div>
      <div class="footer">Payment: ${o.paymentMethod} | Status: ${o.paymentStatus}<br>Thank you for shopping at ViralClothes.Shop!</div>
      </body></html>
    `);
    win.document.close();
    win.print();
  } catch (e) { showToast('Could not generate invoice'); }
}

// ===== CATEGORIES =====
async function renderCategories(el) {
  const data = await apiCall('/admin/categories');
  el.innerHTML = `
    <div class="search-bar"><input type="text" placeholder="Search..." oninput="searchTable(this.value,'catTable')"><button class="btn-primary btn-sm" onclick="openCategoryModal()">+ Add Category</button></div>
    <div class="table-section">
      <table id="catTable"><thead><tr><th>Name</th><th>Slug</th><th>Icon</th><th>Active</th><th>Actions</th></tr></thead>
        <tbody>${data.categories.map(c => `<tr><td>${c.name}</td><td>${c.slug}</td><td>${c.icon || '-'}</td><td>${c.isActive ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-danger">Inactive</span>'}</td><td><button class="btn-secondary btn-sm" onclick="editCategory('${c._id}')">Edit</button> <button class="btn-danger btn-sm" onclick="deleteItem('categories','${c._id}')">Del</button></td></tr>`).join('')}</tbody>
      </table>
    </div>`;
}

function openCategoryModal(cat) {
  const isEdit = !!cat;
  const modal = createModal('catModal', `
    <h3>${isEdit ? 'Edit' : 'Add'} Category</h3>
    <form id="catForm">
      <div class="form-group"><label>Name</label><input name="name" value="${cat?.name || ''}" required></div>
      <div class="form-group"><label>Icon (emoji)</label><input name="icon" value="${cat?.icon || ''}"></div>
      <div class="form-group"><label>Description</label><textarea name="description">${cat?.description || ''}</textarea></div>
      <div class="modal-actions"><button type="button" class="btn-secondary" onclick="closeModal('catModal')">Cancel</button><button type="submit" class="btn-primary">${isEdit ? 'Update' : 'Create'}</button></div>
    </form>
  `);
  modal.classList.add('open');
  document.getElementById('catForm').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd);
    try {
      if (isEdit) await apiCall(`/admin/categories/${cat._id}`, { method: 'PUT', body: JSON.stringify(data) });
      else await apiCall('/admin/categories', { method: 'POST', body: JSON.stringify(data) });
      closeModal('catModal');
      renderCategories(document.getElementById('pageContent'));
    } catch (err) { alert(err.message); }
  };
}

async function editCategory(id) {
  const data = await apiCall(`/categories/${id}`);
  openCategoryModal(data.category);
}

// ===== BRANDS =====
async function renderBrands(el) {
  const data = await apiCall('/admin/brands');
  el.innerHTML = `
    <div class="search-bar"><input type="text" placeholder="Search..." oninput="searchTable(this.value,'brandTable')"><button class="btn-primary btn-sm" onclick="openBrandModal()">+ Add Brand</button></div>
    <div class="table-section"><table id="brandTable"><thead><tr><th>Name</th><th>Slug</th><th>Active</th><th>Actions</th></tr></thead>
      <tbody>${data.brands.map(b => `<tr><td>${b.name}</td><td>${b.slug}</td><td>${b.isActive ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-danger">Inactive</span>'}</td><td><button class="btn-secondary btn-sm" onclick="editBrand('${b._id}')">Edit</button> <button class="btn-danger btn-sm" onclick="deleteItem('brands','${b._id}')">Del</button></td></tr>`).join('')}</tbody>
    </table></div>`;
}

function openBrandModal(brand) {
  const isEdit = !!brand;
  const modal = createModal('brandModal', `
    <h3>${isEdit ? 'Edit' : 'Add'} Brand</h3>
    <form id="brandForm"><div class="form-group"><label>Name</label><input name="name" value="${brand?.name || ''}" required></div>
      <div class="modal-actions"><button type="button" class="btn-secondary" onclick="closeModal('brandModal')">Cancel</button><button type="submit" class="btn-primary">${isEdit ? 'Update' : 'Create'}</button></div>
    </form>`);
  modal.classList.add('open');
  document.getElementById('brandForm').onsubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    try {
      if (isEdit) await apiCall(`/admin/brands/${brand._id}`, { method: 'PUT', body: JSON.stringify(data) });
      else await apiCall('/admin/brands', { method: 'POST', body: JSON.stringify(data) });
      closeModal('brandModal');
      renderBrands(document.getElementById('pageContent'));
    } catch (err) { alert(err.message); }
  };
}

async function editBrand(id) {
  const data = await apiCall(`/brands/${id}`);
  openBrandModal(data.brand);
}

// ===== CUSTOMERS =====
async function renderCustomers(el) {
  const data = await apiCall('/admin/customers?limit=100');
  el.innerHTML = `
    <div class="search-bar"><input type="text" placeholder="Search customers..." oninput="searchTable(this.value,'custTable')"></div>
    <div class="table-section"><table id="custTable"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Verified</th><th>Active</th><th>Joined</th><th>Actions</th></tr></thead>
      <tbody>${data.customers.map(c => `<tr><td>${c.name}</td><td>${c.email}</td><td>${c.role}</td><td>${c.isVerified ? '<span class="badge badge-success">Yes</span>' : '<span class="badge badge-warning">No</span>'}</td><td>${c.isActive ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-danger">Banned</span>'}</td><td>${new Date(c.createdAt).toLocaleDateString()}</td><td><button class="btn-secondary btn-sm" onclick="toggleUserStatus('${c._id}','${c.name}')">${c.isActive ? 'Ban' : 'Unban'}</button></td></tr>`).join('')}</tbody>
    </table></div>`;
}

async function toggleUserStatus(id, name) {
  if (!confirm(`Toggle status for ${name}?`)) return;
  await apiCall(`/admin/customers/${id}/toggle-status`, { method: 'PUT' });
  renderCustomers(document.getElementById('pageContent'));
}

// ===== COUPONS =====
async function renderCoupons(el) {
  const data = await apiCall('/admin/coupons');
  el.innerHTML = `
    <div class="search-bar"><button class="btn-primary btn-sm" onclick="openCouponModal()">+ Add Coupon</button></div>
    <div class="table-section"><table><thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Used</th><th>Expires</th><th>Active</th><th>Actions</th></tr></thead>
      <tbody>${(data.coupons || []).map(c => `<tr><td>${c.code}</td><td>${c.type}</td><td>${c.type === 'percentage' ? c.value + '%' : '$' + c.value}</td><td>${c.usedCount}/${c.usageLimit || '∞'}</td><td>${new Date(c.expiresAt).toLocaleDateString()}</td><td>${c.isActive ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-danger">Inactive</span>'}</td><td><button class="btn-secondary btn-sm" onclick="editCoupon('${c._id}')">Edit</button> <button class="btn-danger btn-sm" onclick="deleteItem('coupons','${c._id}')">Del</button></td></tr>`).join('')}</tbody>
    </table></div>`;
}

function openCouponModal(coupon) {
  const isEdit = !!coupon;
  const modal = createModal('couponModal', `
    <h3>${isEdit ? 'Edit' : 'Add'} Coupon</h3>
    <form id="couponForm">
      <div class="form-group"><label>Code</label><input name="code" value="${coupon?.code || ''}" required></div>
      <div class="form-row">
        <div class="form-group"><label>Type</label><select name="type"><option value="percentage" ${coupon?.type === 'percentage' ? 'selected' : ''}>Percentage</option><option value="fixed" ${coupon?.type === 'fixed' ? 'selected' : ''}>Fixed</option></select></div>
        <div class="form-group"><label>Value</label><input type="number" step="0.01" name="value" value="${coupon?.value || ''}" required></div>
      </div>
      <div class="form-group"><label>Expires At</label><input type="date" name="expiresAt" value="${coupon?.expiresAt ? new Date(coupon.expiresAt).toISOString().split('T')[0] : ''}" required></div>
      <div class="modal-actions"><button type="button" class="btn-secondary" onclick="closeModal('couponModal')">Cancel</button><button type="submit" class="btn-primary">${isEdit ? 'Update' : 'Create'}</button></div>
    </form>`);
  modal.classList.add('open');
  document.getElementById('couponForm').onsubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    data.value = parseFloat(data.value);
    try {
      if (isEdit) await apiCall(`/admin/coupons/${coupon._id}`, { method: 'PUT', body: JSON.stringify(data) });
      else await apiCall('/admin/coupons', { method: 'POST', body: JSON.stringify(data) });
      closeModal('couponModal');
      renderCoupons(document.getElementById('pageContent'));
    } catch (err) { alert(err.message); }
  };
}

async function editCoupon(id) {
  const data = await apiCall(`/coupons/${id}`);
  openCouponModal(data.coupon);
}

// ===== BANNERS =====
async function renderBanners(el) {
  const data = await apiCall('/admin/banners');
  el.innerHTML = `
    <div class="search-bar"><button class="btn-primary btn-sm" onclick="openBannerModal()">+ Add Banner</button></div>
    <div class="table-section"><table><thead><tr><th>Title</th><th>Position</th><th>Order</th><th>Active</th><th>Actions</th></tr></thead>
      <tbody>${(data.banners || []).map(b => `<tr><td>${b.title}</td><td>${b.position}</td><td>${b.sortOrder}</td><td>${b.isActive ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-danger">Inactive</span>'}</td><td><button class="btn-secondary btn-sm" onclick="editBanner('${b._id}')">Edit</button> <button class="btn-danger btn-sm" onclick="deleteItem('banners','${b._id}')">Del</button></td></tr>`).join('')}</tbody>
    </table></div>`;
}

function openBannerModal(banner) {
  const isEdit = !!banner;
  const modal = createModal('bannerModal', `
    <h3>${isEdit ? 'Edit' : 'Add'} Banner</h3>
    <form id="bannerForm">
      <div class="form-group"><label>Title</label><input name="title" value="${banner?.title || ''}" required></div>
      <div class="form-group"><label>Subtitle</label><input name="subtitle" value="${banner?.subtitle || ''}"></div>
      <div class="form-row">
        <div class="form-group"><label>Position</label><select name="position"><option value="hero" ${banner?.position === 'hero' ? 'selected' : ''}>Hero</option><option value="featured" ${banner?.position === 'featured' ? 'selected' : ''}>Featured</option><option value="bottom" ${banner?.position === 'bottom' ? 'selected' : ''}>Bottom</option></select></div>
        <div class="form-group"><label>Sort Order</label><input type="number" name="sortOrder" value="${banner?.sortOrder || 0}"></div>
      </div>
      <div class="modal-actions"><button type="button" class="btn-secondary" onclick="closeModal('bannerModal')">Cancel</button><button type="submit" class="btn-primary">${isEdit ? 'Update' : 'Create'}</button></div>
    </form>`);
  modal.classList.add('open');
  document.getElementById('bannerForm').onsubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    data.sortOrder = parseInt(data.sortOrder);
    try {
      if (isEdit) await apiCall(`/admin/banners/${banner._id}`, { method: 'PUT', body: JSON.stringify(data) });
      else await apiCall('/admin/banners', { method: 'POST', body: JSON.stringify(data) });
      closeModal('bannerModal');
      renderBanners(document.getElementById('pageContent'));
    } catch (err) { alert(err.message); }
  };
}

async function editBanner(id) {
  const data = await apiCall(`/banners/${id}`);
  openBannerModal(data.banner);
}

// ===== SHIPPING METHODS =====
async function renderShipping(el) {
  const data = await apiCall('/shipping-methods/all');
  el.innerHTML = `
    <div class="search-bar"><button class="btn-primary btn-sm" onclick="openShippingModal()">+ Add Method</button></div>
    <div class="table-section"><table><thead><tr><th>Name</th><th>Code</th><th>Price</th><th>Free Over</th><th>Est. Days</th><th>Active</th><th>Actions</th></tr></thead>
      <tbody>${(data.methods||[]).map(m => `<tr><td>${m.name}</td><td>${m.code}</td><td>$${(m.price||0).toFixed(2)}</td><td>${m.freeThreshold > 0 ? '$' + m.freeThreshold : '-'}</td><td>${m.estimatedDays || '-'}</td><td>${m.isActive ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-danger">Inactive</span>'}</td><td><button class="btn-secondary btn-sm" onclick="editShipping('${m._id}')">Edit</button> <button class="btn-danger btn-sm" onclick="deleteShipping('${m._id}')">Del</button></td></tr>`).join('')}</tbody>
    </table></div>`;
}

function openShippingModal(method) {
  const isEdit = !!method;
  const modal = createModal('shipModal', `
    <h3>${isEdit ? 'Edit' : 'Add'} Shipping Method</h3>
    <form id="shipForm">
      <div class="form-group"><label>Name</label><input name="name" value="${method?.name || ''}" required></div>
      <div class="form-group"><label>Code (lowercase)</label><input name="code" value="${method?.code || ''}" required></div>
      <div class="form-group"><label>Description</label><textarea name="description">${method?.description || ''}</textarea></div>
      <div class="form-row">
        <div class="form-group"><label>Price ($)</label><input type="number" step="0.01" name="price" value="${method?.price || '0'}" required></div>
        <div class="form-group"><label>Free Threshold ($)</label><input type="number" step="0.01" name="freeThreshold" value="${method?.freeThreshold || '0'}"></div>
      </div>
      <div class="form-group"><label>Estimated Days</label><input name="estimatedDays" value="${method?.estimatedDays || '3-7 business days'}"></div>
      <div class="modal-actions"><button type="button" class="btn-secondary" onclick="closeModal('shipModal')">Cancel</button><button type="submit" class="btn-primary">${isEdit ? 'Update' : 'Create'}</button></div>
    </form>`);
  modal.classList.add('open');
  document.getElementById('shipForm').onsubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    data.price = parseFloat(data.price);
    data.freeThreshold = parseFloat(data.freeThreshold);
    try {
      if (isEdit) await apiCall(`/shipping-methods/${method._id}`, { method: 'PUT', body: JSON.stringify(data) });
      else await apiCall('/shipping-methods', { method: 'POST', body: JSON.stringify(data) });
      closeModal('shipModal');
      renderShipping(document.getElementById('pageContent'));
    } catch (err) { alert(err.message); }
  };
}

async function editShipping(id) {
  const data = await apiCall('/shipping-methods/all');
  const method = (data.methods||[]).find(m => m._id === id);
  if (method) openShippingModal(method);
}

async function deleteShipping(id) {
  if (!confirm('Delete this shipping method?')) return;
  await apiCall(`/shipping-methods/${id}`, { method: 'DELETE' });
  renderShipping(document.getElementById('pageContent'));
}

// ===== GIFT CARDS =====
async function renderGiftcards(el) {
  const data = await apiCall('/gift-cards');
  el.innerHTML = `
    <div class="search-bar"><button class="btn-primary btn-sm" onclick="openGiftCardModal()">+ Add Gift Card</button></div>
    <div class="table-section"><table><thead><tr><th>Code</th><th>Original</th><th>Balance</th><th>Expires</th><th>Active</th><th>Actions</th></tr></thead>
      <tbody>${(data.giftCards||[]).map(g => `<tr><td><strong>${g.code}</strong></td><td>$${(g.originalBalance||0).toFixed(2)}</td><td>$${(g.balance||0).toFixed(2)}</td><td>${g.expiresAt ? new Date(g.expiresAt).toLocaleDateString() : 'Never'}</td><td>${g.isActive ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-danger">Used</span>'}</td><td><button class="btn-secondary btn-sm" onclick="editGiftCard('${g._id}')">Edit</button> <button class="btn-danger btn-sm" onclick="deleteItem('gift-cards','${g._id}')">Del</button></td></tr>`).join('')}</tbody>
    </table></div>`;
}

function openGiftCardModal(gc) {
  const isEdit = !!gc;
  const modal = createModal('gcModal', `
    <h3>${isEdit ? 'Edit' : 'Add'} Gift Card</h3>
    <form id="gcForm">
      ${isEdit ? '' : '<div class="form-group"><label>Amount ($)</label><input type="number" step="0.01" name="originalBalance" min="1" required></div>'}
      ${isEdit ? `<div class="form-group"><label>Balance ($)</label><input type="number" step="0.01" name="balance" value="${gc.balance}" required></div>` : ''}
      <div class="form-group"><label>Recipient Email</label><input name="recipientEmail" value="${gc?.recipientEmail || ''}"></div>
      <div class="form-group"><label>Expires At</label><input type="date" name="expiresAt" value="${gc?.expiresAt ? new Date(gc.expiresAt).toISOString().split('T')[0] : ''}"></div>
      <div class="form-group"><label>Active</label><select name="isActive"><option value="true" ${gc?.isActive !== false ? 'selected' : ''}>Yes</option><option value="false" ${gc?.isActive === false ? 'selected' : ''}>No</option></select></div>
      <div class="modal-actions"><button type="button" class="btn-secondary" onclick="closeModal('gcModal')">Cancel</button><button type="submit" class="btn-primary">${isEdit ? 'Update' : 'Create'}</button></div>
    </form>`);
  modal.classList.add('open');
  document.getElementById('gcForm').onsubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    if (data.originalBalance) data.originalBalance = parseFloat(data.originalBalance);
    if (data.balance) data.balance = parseFloat(data.balance);
    data.isActive = data.isActive === 'true';
    try {
      if (isEdit) await apiCall(`/gift-cards/${gc._id}`, { method: 'PUT', body: JSON.stringify(data) });
      else await apiCall('/gift-cards', { method: 'POST', body: JSON.stringify(data) });
      closeModal('gcModal');
      renderGiftcards(document.getElementById('pageContent'));
    } catch (err) { alert(err.message); }
  };
}

async function editGiftCard(id) {
  const data = await apiCall(`/gift-cards/${id}`);
  openGiftCardModal(data.giftCard);
}

// ===== PAYMENT HISTORY =====
async function renderPayments(el) {
  const data = await apiCall('/payments/history?limit=100');
  el.innerHTML = `
    <div class="search-bar">
      <select onchange="filterPayments(this.value)" style="padding:8px 12px;border-radius:6px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:#fff">
        <option value="">All Gateways</option>
        <option value="stripe">Stripe</option>
        <option value="paypal">PayPal</option>
        <option value="razorpay">Razorpay</option>
      </select>
      <select onchange="filterPaymentStatus(this.value)" style="padding:8px 12px;border-radius:6px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:#fff;margin-left:8px">
        <option value="">All Status</option>
        <option value="pending">Pending</option>
        <option value="processing">Processing</option>
        <option value="completed">Completed</option>
        <option value="failed">Failed</option>
        <option value="refunded">Refunded</option>
      </select>
      <span style="margin-left:auto;font-size:13px;color:rgba(255,255,255,0.4)">Total: ${data.total} transactions</span>
    </div>
    <div class="table-section">
      <table id="paymentsTable">
        <thead><tr><th>Date</th><th>Gateway</th><th>Transaction ID</th><th>Order</th><th>Customer</th><th>Amount</th><th>Currency</th><th>Status</th><th>Country</th><th>Actions</th></tr></thead>
        <tbody>${(data.transactions||[]).map(t => {
          const badgeColor = t.status === 'completed' ? 'success' : t.status === 'failed' ? 'danger' : t.status === 'refunded' ? 'warning' : 'info';
          return `<tr>
            <td>${new Date(t.createdAt).toLocaleDateString()}</td>
            <td><span class="badge badge-info">${t.gateway}</span></td>
            <td style="font-size:12px;max-width:120px;overflow:hidden;text-overflow:ellipsis">${t.transactionId || '-'}</td>
            <td>${t.orderNumber || (t.order?.orderNumber || '-')}</td>
            <td>${t.user?.name || t.guestEmail || 'Guest'}</td>
            <td><strong>$${(t.amount||0).toFixed(2)}</strong></td>
            <td>${t.currency || 'USD'}</td>
            <td><span class="badge badge-${badgeColor}">${t.status}</span></td>
            <td>${t.customerCountry || '-'}</td>
            <td><button class="btn-secondary btn-sm" onclick="viewPayment('${t._id}')">View</button></td>
          </tr>`;
        }).join('')}</tbody>
      </table>
    </div>`;
}

async function filterPayments(gateway) {
  const status = document.querySelector('#pageContent select:nth-child(2)')?.value || '';
  const params = new URLSearchParams({ limit: 100 });
  if (gateway) params.set('gateway', gateway);
  if (status) params.set('status', status);
  const data = await apiCall(`/payments/history?${params}`);
  renderPaymentsTable(document.getElementById('pageContent'), data);
}

async function filterPaymentStatus(status) {
  const gateway = document.querySelector('#pageContent select:first-child')?.value || '';
  const params = new URLSearchParams({ limit: 100 });
  if (gateway) params.set('gateway', gateway);
  if (status) params.set('status', status);
  const data = await apiCall(`/payments/history?${params}`);
  renderPaymentsTable(document.getElementById('pageContent'), data);
}

function renderPaymentsTable(el, data) {
  const tbody = el.querySelector('#paymentsTable tbody');
  const totalSpan = el.querySelector('.search-bar span:last-child');
  if (!tbody) return;
  tbody.innerHTML = (data.transactions || []).map(t => {
    const badgeColor = t.status === 'completed' ? 'success' : t.status === 'failed' ? 'danger' : t.status === 'refunded' ? 'warning' : 'info';
    return `<tr>
      <td>${new Date(t.createdAt).toLocaleDateString()}</td>
      <td><span class="badge badge-info">${t.gateway}</span></td>
      <td style="font-size:12px;max-width:120px;overflow:hidden;text-overflow:ellipsis">${t.transactionId || '-'}</td>
      <td>${t.orderNumber || (t.order?.orderNumber || '-')}</td>
      <td>${t.user?.name || t.guestEmail || 'Guest'}</td>
      <td><strong>$${(t.amount||0).toFixed(2)}</strong></td>
      <td>${t.currency || 'USD'}</td>
      <td><span class="badge badge-${badgeColor}">${t.status}</span></td>
      <td>${t.customerCountry || '-'}</td>
      <td><button class="btn-secondary btn-sm" onclick="viewPayment('${t._id}')">View</button></td>
    </tr>`;
  }).join('');
  if (totalSpan) totalSpan.textContent = 'Total: ' + (data.total || 0) + ' transactions';
}

async function viewPayment(id) {
  const data = await apiCall(`/payments/history/${id}`);
  const t = data.transaction;
  const modal = createModal('paymentModal', `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px">
      <h3 style="margin:0">Payment Transaction</h3>
      <span class="badge badge-${t.status === 'completed' ? 'success' : t.status === 'failed' ? 'danger' : 'warning'}">${t.status}</span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:15px">
      <div style="padding:12px;background:rgba(255,255,255,0.03);border-radius:8px">
        <strong>Gateway:</strong> ${t.gateway}<br>
        <strong>Transaction ID:</strong> <span style="font-size:12px">${t.transactionId || '-'}</span><br>
        <strong>Gateway Order:</strong> ${t.gatewayOrderId || '-'}
      </div>
      <div style="padding:12px;background:rgba(255,255,255,0.03);border-radius:8px">
        <strong>Amount:</strong> $${(t.amount||0).toFixed(2)} ${t.currency}<br>
        <strong>Country:</strong> ${t.customerCountry || '-'}<br>
        <strong>Refund:</strong> ${t.refundAmount > 0 ? '$' + t.refundAmount.toFixed(2) : 'None'}
      </div>
    </div>
    <div style="margin-bottom:15px">
      <strong>Order:</strong> ${t.orderNumber || (t.order?.orderNumber || 'N/A')}<br>
      ${t.user ? `<strong>Customer:</strong> ${t.user.name} (${t.user.email})` : `<strong>Guest:</strong> ${t.guestEmail || 'N/A'}`}
    </div>
    <div style="margin-bottom:15px">
      <strong>Timeline</strong><br>
      <div style="font-size:13px">Created: ${new Date(t.createdAt).toLocaleString()}</div>
      ${t.verifiedAt ? `<div style="font-size:13px">Verified: ${new Date(t.verifiedAt).toLocaleString()}</div>` : ''}
      ${t.updatedAt !== t.createdAt ? `<div style="font-size:13px">Updated: ${new Date(t.updatedAt).toLocaleString()}</div>` : ''}
    </div>
    ${t.errorMessage ? `<div style="padding:12px;background:rgba(255,107,107,0.1);border-radius:8px;margin-bottom:15px;font-size:13px"><strong>Error:</strong> ${t.errorMessage}</div>` : ''}
    <div class="modal-actions"><button class="btn-secondary" onclick="closeModal('paymentModal')">Close</button></div>
  `);
  modal.classList.add('open');
}

// ===== REVIEWS =====
async function renderReviews(el) {
  el.innerHTML = `<p>Loading reviews...</p>`;
}

// ===== SETTINGS =====
async function renderSettings(el) {
  const data = await apiCall('/admin/settings');
  el.innerHTML = `
    <h3 style="margin-bottom:20px">Site Settings</h3>
    <form id="settingsForm" style="max-width:600px">
      ${['site_name', 'site_description', 'free_shipping_threshold', 'shipping_cost', 'tax_rate', 'contact_email', 'contact_phone'].map(key => {
        let val = '';
        Object.values(data.settings || {}).forEach(group => { if (group[key] !== undefined) val = group[key]; });
        return `<div class="form-group"><label>${key.replace(/_/g,' ').replace(/\b\w/g, l => l.toUpperCase())}</label><input name="${key}" value="${val || ''}"></div>`;
      }).join('')}
      <button type="submit" class="btn-primary">Save Settings</button>
    </form>`;
  document.getElementById('settingsForm').onsubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    for (const [key, value] of Object.entries(data)) {
      await apiCall('/admin/settings', { method: 'PUT', body: JSON.stringify({ key, value, group: 'general' }) });
    }
    alert('Settings saved!');
  };
}

// ===== UTILITIES =====
function createModal(id, html) {
  let modal = document.getElementById(id);
  if (modal) modal.remove();
  modal = document.createElement('div');
  modal.id = id;
  modal.className = 'modal';
  modal.innerHTML = `<div class="modal-content" onclick="event.stopPropagation()">${html}</div>`;
  modal.addEventListener('click', () => closeModal(id));
  document.body.appendChild(modal);
  return modal;
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('open');
}

async function deleteItem(type, id) {
  if (!confirm('Delete this item?')) return;
  await apiCall(`/admin/${type}/${id}`, { method: 'DELETE' });
  loadPage(currentPage);
}

function showToast(msg) {
  let t = document.getElementById('adminToast');
  if (!t) { t = document.createElement('div'); t.id = 'adminToast'; t.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#6C3CE1;color:#fff;padding:12px 20px;border-radius:8px;font-size:14px;z-index:9999;opacity:0;transition:opacity 0.3s'; document.body.appendChild(t); }
  t.textContent = msg; t.style.opacity = '1';
  setTimeout(() => t.style.opacity = '0', 3000);
}

function searchTable(query, tableId) {
  const q = query.toLowerCase();
  document.querySelectorAll(`#${tableId} tbody tr`).forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

// ===== INIT =====
(async function init() {
  const saved = localStorage.getItem('vc_admin_user');
  if (saved) document.getElementById('adminName').textContent = JSON.parse(saved).name;
  if (token) {
    try {
      await apiCall('/admin/dashboard');
      document.getElementById('loginPage').style.display = 'none';
      document.getElementById('dashboardPage').style.display = '';
      loadPage('dashboard');
    } catch (e) {
      localStorage.removeItem('vc_admin_token');
      token = null;
    }
  }
})();
