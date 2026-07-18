function toggleAuthModal() {
  if (api.isLoggedIn()) {
    const user = api.getUser();
    if (confirm(`Signed in as ${user.name}\nClick OK to sign out`)) {
      api.logout();
      updateAuthUI();
    }
    return;
  }
  document.getElementById('authOverlay').classList.add('active');
  document.getElementById('authModal').classList.add('active');
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

function updateAuthUI() {
  const userBtn = document.getElementById('userBtn');
  const userName = document.getElementById('userName');
  if (!userBtn) return;
  if (api.isLoggedIn()) {
    const user = api.getUser();
    userBtn.classList.add('logged-in');
    userName.textContent = user.name.split(' ')[0];
    userBtn.title = 'Click to sign out';
  } else {
    userBtn.classList.remove('logged-in');
    userName.textContent = '';
    userBtn.title = 'Sign in / Sign up';
  }
}

document.addEventListener('DOMContentLoaded', updateAuthUI);