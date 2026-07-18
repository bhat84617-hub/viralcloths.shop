function toggleAuthModal(e) {
  if (e) e.stopPropagation();
  if (api.isLoggedIn()) {
    const menu = document.getElementById('userMenu');
    if (menu) { menu.remove(); return; }
    const user = api.getUser();
    const div = document.createElement('div');
    div.id = 'userMenu';
    div.style.cssText = 'position:absolute;top:100%;right:0;background:#1a1a2e;border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:8px 0;min-width:180px;z-index:10000;box-shadow:0 8px 32px rgba(0,0,0,0.4)';
    div.innerHTML = `
      <div style="padding:8px 16px;border-bottom:1px solid rgba(255,255,255,0.05);font-size:14px;color:rgba(255,255,255,0.6)">${user.name}</div>
      <a href="orders.html" style="display:block;padding:10px 16px;color:#fff;text-decoration:none;font-size:14px"><i class="fas fa-truck"></i> My Orders</a>
      <div style="border-top:1px solid rgba(255,255,255,0.05);margin-top:4px">
        <a href="#" onclick="logoutUser()" style="display:block;padding:10px 16px;color:#FF6B6B;text-decoration:none;font-size:14px"><i class="fas fa-sign-out-alt"></i> Logout</a>
      </div>`;
    document.getElementById('userBtn').appendChild(div);
    setTimeout(() => document.addEventListener('click', closeUserMenu), 100);
    return;
  }
  document.getElementById('authOverlay').classList.add('active');
  document.getElementById('authModal').classList.add('active');
}

function closeUserMenu() {
  const menu = document.getElementById('userMenu');
  if (menu) menu.remove();
  document.removeEventListener('click', closeUserMenu);
}

function closeAuthModal() {
  document.getElementById('authOverlay').classList.remove('active');
  document.getElementById('authModal').classList.remove('active');
  document.getElementById('loginError').textContent = '';
  document.getElementById('regError').textContent = '';
}

function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.querySelectorAll('.auth-form').forEach(f => f.classList.toggle('active', f.id === tab + 'Form'));
}

async function handleLogin(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true; btn.textContent = 'Signing in...';
  try {
    const data = await api.login(document.getElementById('loginEmail').value, document.getElementById('loginPassword').value);
    showToast('Signed in as ' + data.user.name);
    closeAuthModal();
    updateAuthUI();
  } catch (err) {
    document.getElementById('loginError').textContent = err.message;
  }
  btn.disabled = false; btn.textContent = 'Sign In';
}

async function handleRegister(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true; btn.textContent = 'Creating account...';
  try {
    const data = await api.register(
      document.getElementById('regName').value,
      document.getElementById('regEmail').value,
      document.getElementById('regPassword').value
    );
    api.login(document.getElementById('regEmail').value, document.getElementById('regPassword').value);
    showToast('Account created! Welcome ' + data.user.name);
    closeAuthModal();
    updateAuthUI();
  } catch (err) {
    document.getElementById('regError').textContent = err.message;
  }
  btn.disabled = false; btn.textContent = 'Sign Up';
}

function logoutUser() {
  api.logout();
  closeUserMenu();
  updateAuthUI();
  showToast('Logged out');
}

function updateAuthUI() {
  const userBtn = document.getElementById('userBtn');
  const userName = document.getElementById('userName');
  if (!userBtn) return;
  if (api.isLoggedIn()) {
    const user = api.getUser();
    userBtn.classList.add('logged-in');
    userName.textContent = user.name.split(' ')[0];
    userBtn.title = '';
  } else {
    userBtn.classList.remove('logged-in');
    userName.textContent = '';
    userBtn.title = 'Sign in / Sign up';
  }
}

document.addEventListener('DOMContentLoaded', updateAuthUI);