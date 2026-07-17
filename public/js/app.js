/**
 * VendorFlow — Main Application (SPA)
 * Hash-based routing, auth management, all view renderers.
 */

'use strict';

/* ================================================================
   GLOBAL STATE
================================================================ */
const App = {
  token: localStorage.getItem('vf_token') || '',
  refreshToken: localStorage.getItem('vf_refresh') || '',
  vendor: JSON.parse(localStorage.getItem('vf_vendor') || 'null'),
  settings: { exchange_rate_usd_to_zar: 18.5, display_currency: 'USD' },
  sidebarOpen: false,
  currentRoute: 'dashboard',
};

/* ================================================================
   SVG ICON LIBRARY (clean line icons, no emoji)
================================================================ */
const Icon = {
  dashboard: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>`,
  products:  `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"/></svg>`,
  sale:      `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg>`,
  expenses:  `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"/></svg>`,
  stock:     `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3"/></svg>`,
  analytics: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/></svg>`,
  settings:  `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`,
  logout:    `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"/></svg>`,
  sun:       `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/></svg>`,
  moon:      `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/></svg>`,
  plus:      `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>`,
  edit:      `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg>`,
  trash:     `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>`,
  warning:   `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>`,
  check:     `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>`,
  close:     `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>`,
  refresh:   `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/></svg>`,
  info:      `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/></svg>`,
  trend_up:  `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"/></svg>`,
  trend_dn:  `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6L9 12.75l4.306-4.307a11.95 11.95 0 015.814 5.519l2.74 1.22m0 0l-5.94 2.28m5.94-2.28l-2.28-5.941"/></svg>`,
  vendor:    `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z"/></svg>`,
  restock:   `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M12 3v8.25m0 0l-3-3m3 3l3-3"/></svg>`,
};

/* ================================================================
   CATEGORY CONFIG
================================================================ */
const CATEGORIES = {
  burgers:  { label: 'Burgers',  color: '#f87171', bg: 'rgba(239,68,68,.12)'   },
  drinks:   { label: 'Drinks',   color: '#22d3ee', bg: 'rgba(6,182,212,.12)'   },
  snacks:   { label: 'Snacks',   color: '#fbbf24', bg: 'rgba(245,158,11,.12)'  },
  rice:     { label: 'Rice',     color: '#34d399', bg: 'rgba(16,185,129,.12)'  },
  sweets:   { label: 'Sweets',   color: '#f472b6', bg: 'rgba(236,72,153,.12)'  },
  chips:    { label: 'Chips',    color: '#fb923c', bg: 'rgba(251,146,60,.12)'  },
  sausages: { label: 'Sausages', color: '#a78bfa', bg: 'rgba(167,139,250,.12)' },
};

/* ================================================================
   API HELPER
================================================================ */
async function api(method, path, body = null, params = {}) {
  const url = new URL('/api' + path, window.location.origin);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${App.token}`,
    },
  };

  if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(url.toString(), opts);

  // Token expired → try refresh
  if (res.status === 401 && App.refreshToken) {
    const ok = await tryRefresh();
    if (ok) {
      opts.headers['Authorization'] = `Bearer ${App.token}`;
      const retry = await fetch(url.toString(), opts);
      const data = await retry.json().catch(() => ({}));
      if (!retry.ok) throw new Error(data.error || 'Request failed');
      return data;
    } else {
      logout();
      return null;
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

async function tryRefresh() {
  try {
    const res = await fetch('/api/auth/refresh.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: App.refreshToken }),
    });
    if (!res.ok) return false;
    const d = await res.json();
    App.token        = d.access_token;
    App.refreshToken = d.refresh_token;
    localStorage.setItem('vf_token',   App.token);
    localStorage.setItem('vf_refresh', App.refreshToken);
    return true;
  } catch { return false; }
}

/* ================================================================
   TOAST NOTIFICATIONS
================================================================ */
function toast(type, title, msg = '') {
  const icons = {
    success: Icon.check,
    error:   Icon.close,
    info:    Icon.info,
    warning: Icon.warning,
  };
  const el = document.createElement('div');
  el.className = `toast ${type} fade-in`;
  el.innerHTML = `
    <div class="toast-icon">${icons[type] || icons.info}</div>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      ${msg ? `<div class="toast-msg">${msg}</div>` : ''}
    </div>`;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

/* ================================================================
   MODAL
================================================================ */
function showModal(html, onShow) {
  const overlay = document.getElementById('modal-overlay');
  const inner   = document.getElementById('modal-inner');
  inner.innerHTML = html;
  overlay.classList.add('show');
  if (onShow) onShow(inner);
}

function hideModal() {
  const overlay = document.getElementById('modal-overlay');
  overlay.classList.remove('show');
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') hideModal();
});

/* ================================================================
   AUTH
================================================================ */
function saveAuth(data) {
  App.token        = data.access_token;
  App.refreshToken = data.refresh_token;
  App.vendor       = data.vendor;
  localStorage.setItem('vf_token',   App.token);
  localStorage.setItem('vf_refresh', App.refreshToken);
  localStorage.setItem('vf_vendor',  JSON.stringify(App.vendor));
}

function logout() {
  App.token = ''; App.refreshToken = ''; App.vendor = null;
  localStorage.removeItem('vf_token');
  localStorage.removeItem('vf_refresh');
  localStorage.removeItem('vf_vendor');
  showAuth();
}

/* ================================================================
   THEME
================================================================ */
function initTheme() {
  const saved = localStorage.getItem('vf_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeIcon(saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next    = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('vf_theme', next);
  updateThemeIcon(next);
  Charts.refreshAll();
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.innerHTML = theme === 'dark' ? Icon.sun : Icon.moon;
}

/* ================================================================
   CURRENCY TOGGLE
================================================================ */
function toggleCurrency(cur) {
  Currency.setDisplay(cur);
  document.querySelectorAll('.currency-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.cur === cur);
  });
  // Re-render current view to update values
  navigate(App.currentRoute);
}

/* ================================================================
   SIDEBAR
================================================================ */
function toggleSidebar() {
  App.sidebarOpen = !App.sidebarOpen;
  document.getElementById('app').classList.toggle('sidebar-open', App.sidebarOpen);
}

function setActiveNav(route) {
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.route === route);
  });
}

/* ================================================================
   ROUTING
================================================================ */
const ROUTES = {
  dashboard: renderDashboard,
  products:  renderProducts,
  sale:      renderSale,
  expenses:  renderExpenses,
  stock:     renderStock,
  analytics: renderAnalytics,
  settings:  renderSettings,
};

function navigate(route) {
  App.currentRoute = route;
  setActiveNav(route);
  window.location.hash = route;
  const fn = ROUTES[route];
  if (fn) fn();
}

window.addEventListener('hashchange', () => {
  const route = window.location.hash.slice(1) || 'dashboard';
  if (ROUTES[route]) navigate(route);
});

/* ================================================================
   SHELL RENDERING
================================================================ */
function renderShell() {
  const vendorName  = App.vendor?.name || 'Vendor';
  const initials    = vendorName.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  const displayCur  = Currency.getDisplay();

  document.getElementById('app').innerHTML = `
    <!-- HEADER -->
    <header class="header" id="app-header">
      <div class="header-hamburger">
        <button class="hamburger-btn" id="hamburger-btn" onclick="toggleSidebar()" aria-label="Toggle menu">
          <span></span><span></span><span></span>
        </button>
      </div>

      <div class="header-logo">
        <div class="logo-mark">${Icon.vendor}</div>
        <span class="logo-text">VendorFlow</span>
      </div>

      <div class="header-controls">
        <!-- Currency toggle pill -->
        <div class="currency-pill" id="currency-pill">
          <button class="currency-btn ${displayCur==='USD'?'active':''}" data-cur="USD" onclick="toggleCurrency('USD')">$ USD</button>
          <button class="currency-btn ${displayCur==='ZAR'?'active':''}" data-cur="ZAR" onclick="toggleCurrency('ZAR')">R ZAR</button>
        </div>

        <!-- Theme toggle -->
        <button class="icon-btn" id="theme-toggle" onclick="toggleTheme()" title="Toggle theme">
          ${document.documentElement.getAttribute('data-theme') === 'dark' ? Icon.sun : Icon.moon}
        </button>

        <!-- Vendor badge -->
        <div class="vendor-badge">
          <div class="vendor-avatar">${initials}</div>
          <span class="vendor-name">${vendorName}</span>
        </div>
      </div>
    </header>

    <div class="layout">
      <!-- SIDEBAR -->
      <aside class="sidebar" id="sidebar">
        <nav class="sidebar-nav" id="sidebar-nav">
          ${renderNavItems()}
        </nav>
        <div class="sidebar-footer">
          <div class="nav-divider"></div>
          <div class="nav-item" onclick="logout()" style="cursor:pointer">
            ${Icon.logout}
            <span class="nav-label">Logout</span>
            <span class="tooltip">Logout</span>
          </div>
        </div>
      </aside>

      <!-- MAIN CONTENT -->
      <main class="main-content" id="main-content">
        <div class="page-loader">
          <div class="loader"></div>
          <span>Loading...</span>
        </div>
      </main>
    </div>

    <!-- FOOTER -->
    <footer class="footer" id="app-footer">
      <div class="footer-rate">
        ${Icon.refresh}
        <span>Rate: <strong>1 USD = R${App.settings.exchange_rate_usd_to_zar.toFixed(2)} ZAR</strong></span>
      </div>
      <span>VendorFlow &copy; ${new Date().getFullYear()}</span>
      <span>Made for school gate vendors</span>
    </footer>
  `;
}

function renderNavItems() {
  const items = [
    { route: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { route: 'products',  label: 'Products',  icon: 'products'  },
    { route: 'sale',      label: 'Record Sale',icon: 'sale'     },
    { route: 'expenses',  label: 'Expenses',  icon: 'expenses'  },
    { route: 'stock',     label: 'Stock',     icon: 'stock'     },
    { route: 'analytics', label: 'Analytics', icon: 'analytics' },
    { route: 'settings',  label: 'Settings',  icon: 'settings'  },
  ];

  return items.map(i => `
    <div class="nav-item${App.currentRoute === i.route ? ' active' : ''}"
         data-route="${i.route}"
         onclick="navigate('${i.route}')">
      ${Icon[i.icon]}
      <span class="nav-label">${i.label}</span>
      <span class="tooltip">${i.label}</span>
    </div>
  `).join('');
}

function setContent(html) {
  const el = document.getElementById('main-content');
  if (el) { el.innerHTML = html; }
}

function updateFooterRate() {
  const footer = document.getElementById('app-footer');
  if (!footer) return;
  footer.querySelector('.footer-rate').innerHTML = `
    ${Icon.refresh}
    <span>Rate: <strong>1 USD = R${App.settings.exchange_rate_usd_to_zar.toFixed(2)} ZAR</strong></span>`;
}

/* ================================================================
   AUTH VIEW
================================================================ */
function showAuth(mode = 'login') {
  document.getElementById('app').innerHTML = `
    <div class="auth-wrapper fade-in">
      <div class="auth-card" id="auth-card">
        <div class="auth-logo">
          <div class="logo-mark" style="width:44px;height:44px;border-radius:14px">${Icon.vendor}</div>
          <span class="logo-text" style="font-size:22px">VendorFlow</span>
        </div>
        ${mode === 'login' ? renderLoginForm() : renderRegisterForm()}
      </div>
    </div>`;
}

function renderLoginForm() {
  return `
    <h1 class="auth-title">Welcome back</h1>
    <p class="auth-subtitle">Sign in to your vendor account</p>
    <form id="login-form" onsubmit="handleLogin(event)">
      <div class="form-group">
        <label class="form-label">Email address</label>
        <input id="login-email" type="email" class="form-input" placeholder="you@example.com" required autocomplete="email">
      </div>
      <div class="form-group">
        <label class="form-label">Password</label>
        <input id="login-password" type="password" class="form-input" placeholder="••••••••" required autocomplete="current-password">
      </div>
      <div id="login-error" class="form-error hidden"></div>
      <button type="submit" class="btn btn-primary w-full btn-lg" id="login-btn">Sign in</button>
    </form>
    <div class="auth-switch">
      Don't have an account? <a onclick="showAuth('register')">Register here</a>
    </div>`;
}

function renderRegisterForm() {
  return `
    <h1 class="auth-title">Create account</h1>
    <p class="auth-subtitle">Set up your vendor profile</p>
    <form id="register-form" onsubmit="handleRegister(event)">
      <div class="form-group">
        <label class="form-label">Your name / Business name</label>
        <input id="reg-name" type="text" class="form-input" placeholder="e.g. Mama Chipo's Kitchen" required>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Phone number</label>
          <input id="reg-phone" type="tel" class="form-input" placeholder="+263 77 ...">
        </div>
        <div class="form-group">
          <label class="form-label">School / Location</label>
          <input id="reg-school" type="text" class="form-input" placeholder="e.g. Harare High">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Email address</label>
        <input id="reg-email" type="email" class="form-input" placeholder="you@example.com" required>
      </div>
      <div class="form-group">
        <label class="form-label">Password <span class="form-hint">(min 8 chars)</span></label>
        <input id="reg-password" type="password" class="form-input" placeholder="••••••••" required minlength="8">
      </div>
      <div id="reg-error" class="form-error hidden"></div>
      <button type="submit" class="btn btn-primary w-full btn-lg" id="reg-btn">Create account</button>
    </form>
    <div class="auth-switch">
      Already have an account? <a onclick="showAuth('login')">Sign in</a>
    </div>`;
}

async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  const errEl = document.getElementById('login-error');
  btn.disabled = true;
  btn.innerHTML = `<div class="loader"></div> Signing in...`;
  errEl.classList.add('hidden');

  try {
    const res = await fetch('/api/auth/login.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email:    document.getElementById('login-email').value,
        password: document.getElementById('login-password').value,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    saveAuth(data);
    await loadSettings();
    renderShell();
    navigate('dashboard');
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove('hidden');
    btn.disabled = false;
    btn.innerHTML = 'Sign in';
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const btn = document.getElementById('reg-btn');
  const errEl = document.getElementById('reg-error');
  btn.disabled = true;
  btn.innerHTML = `<div class="loader"></div> Creating account...`;
  errEl.classList.add('hidden');

  try {
    const res = await fetch('/api/auth/register.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email:    document.getElementById('reg-email').value,
        password: document.getElementById('reg-password').value,
        name:     document.getElementById('reg-name').value,
        phone:    document.getElementById('reg-phone').value,
        school:   document.getElementById('reg-school').value,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    saveAuth(data);
    await loadSettings();
    renderShell();
    navigate('dashboard');
    toast('success', 'Welcome!', 'Your vendor account is ready.');
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove('hidden');
    btn.disabled = false;
    btn.innerHTML = 'Create account';
  }
}

/* ================================================================
   SETTINGS LOADER
================================================================ */
async function loadSettings() {
  try {
    const data = await api('GET', '/settings/index.php');
    if (data?.settings) {
      App.settings = data.settings;
      Currency.init(data.settings.exchange_rate_usd_to_zar, data.settings.display_currency);
    }
    if (data?.vendor) App.vendor = data.vendor;
  } catch (_) { /* use defaults */ }
}

/* ================================================================
   DASHBOARD VIEW
================================================================ */
async function renderDashboard() {
  setContent(`<div class="page-loader"><div class="loader"></div><span>Loading dashboard...</span></div>`);
  try {
    const d = await api('GET', '/dashboard/index.php');
    const cur = Currency.getDisplay();
    const fmt = v => Currency.format(v, cur);

    const changeIcon = d.revenue_change_pct >= 0 ? Icon.trend_up : Icon.trend_dn;
    const changeClass = d.revenue_change_pct >= 0 ? 'up' : 'down';

    const lowStockAlert = d.low_stock_count > 0 ? `
      <div class="low-stock-banner">
        ${Icon.warning}
        <span><strong>${d.low_stock_count} product${d.low_stock_count > 1 ? 's are' : ' is'} running low on stock.</strong>
        <a onclick="navigate('stock')" style="color:var(--warning);font-weight:600;cursor:pointer;margin-left:4px">View stock →</a></span>
      </div>` : '';

    setContent(`
      <div class="fade-in">
        <div class="page-header flex items-center justify-between">
          <div>
            <h1 class="page-title">Dashboard</h1>
            <p class="page-subtitle">Today — ${new Date().toLocaleDateString('en-ZW',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="renderDashboard()">
            ${Icon.refresh} Refresh
          </button>
        </div>

        ${lowStockAlert}

        <!-- KPI Cards -->
        <div class="kpi-grid">
          ${kpiCard('Revenue Today', fmt(d.today_revenue_usd), 'kpi-revenue', 'purple',
            `<span class="${changeClass}">${changeIcon} ${Math.abs(d.revenue_change_pct)}% vs yesterday</span>`, Icon.sale)}
          ${kpiCard('Today\'s Profit', fmt(d.today_profit_usd), 'kpi-profit', 'green',
            `Net after costs`, Icon.analytics)}
          ${kpiCard('Sales Count', d.today_sales_count, 'kpi-sales', 'cyan',
            'items sold today', Icon.products)}
          ${kpiCard('Expenses Today', fmt(d.today_expense_usd), 'kpi-expense', 'amber',
            'logged costs', Icon.expenses)}
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions">
          <button class="quick-action-btn" onclick="navigate('sale')">
            <div class="qa-icon" style="background:rgba(124,58,237,.15);color:var(--primary-light)">${Icon.sale}</div>
            Record Sale
          </button>
          <button class="quick-action-btn" onclick="navigate('products');setTimeout(openAddProduct,200)">
            <div class="qa-icon" style="background:rgba(6,182,212,.15);color:var(--secondary)">${Icon.plus}</div>
            Add Product
          </button>
          <button class="quick-action-btn" onclick="navigate('expenses');setTimeout(openAddExpense,200)">
            <div class="qa-icon" style="background:rgba(245,158,11,.15);color:var(--warning)">${Icon.restock}</div>
            Log Expense
          </button>
        </div>

        <!-- Bottom grid -->
        <div class="grid-2">
          <!-- Recent Sales -->
          <div class="card">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold">Recent Sales</h3>
              <button class="btn btn-ghost btn-sm" onclick="navigate('sale')">+ New</button>
            </div>
            ${d.recent_sales.length === 0
              ? `<div class="empty-state" style="padding:30px 0">
                   <div class="empty-icon">${Icon.sale}</div>
                   <p class="empty-title">No sales yet</p>
                   <p class="empty-desc">Tap Record Sale to get started</p>
                 </div>`
              : `<div class="scroll-area" style="max-height:320px">
                  ${d.recent_sales.map(s => `
                    <div class="flex items-center justify-between" style="padding:10px 0;border-bottom:1px solid var(--border)">
                      <div class="flex items-center gap-2">
                        <div class="badge badge-gray cat-${s.products?.category||''}">${(s.products?.category||'?').slice(0,1).toUpperCase()}</div>
                        <div>
                          <div style="font-weight:600;font-size:13px">${s.products?.name||'Product'}</div>
                          <div class="muted text-xs">×${s.qty} · ${new Date(s.sale_date+'T12:00:00').toLocaleDateString('en-ZW',{month:'short',day:'numeric'})}</div>
                        </div>
                      </div>
                      <span style="font-weight:700;color:var(--success)">${fmt(s.total_usd)}</span>
                    </div>`).join('')}
                </div>`}
          </div>

          <!-- Top product & summary -->
          <div class="card">
            <h3 class="text-lg font-semibold mb-4">Today's Summary</h3>
            <div style="display:flex;flex-direction:column;gap:14px">
              <div class="flex items-center justify-between" style="padding:12px 16px;background:var(--glass);border-radius:12px">
                <span class="muted text-sm">Top Product</span>
                <span style="font-weight:700;color:var(--primary-light)">${d.top_product}</span>
              </div>
              <div class="flex items-center justify-between" style="padding:12px 16px;background:var(--glass);border-radius:12px">
                <span class="muted text-sm">Gross Revenue</span>
                <span style="font-weight:700">${fmt(d.today_revenue_usd)}</span>
              </div>
              <div class="flex items-center justify-between" style="padding:12px 16px;background:var(--glass);border-radius:12px">
                <span class="muted text-sm">Expenses</span>
                <span style="font-weight:700;color:var(--warning)">${fmt(d.today_expense_usd)}</span>
              </div>
              <div class="flex items-center justify-between" style="padding:14px 16px;background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.2);border-radius:12px">
                <span style="font-weight:600;color:var(--success)">Net Profit</span>
                <span style="font-weight:800;font-size:18px;color:var(--success)">${fmt(d.today_profit_usd)}</span>
              </div>
              <button class="btn btn-secondary w-full" onclick="navigate('analytics')">
                ${Icon.analytics} View Full Analytics
              </button>
            </div>
          </div>
        </div>
        <div style="height:28px"></div>
      </div>`);
  } catch (err) {
    setContent(`<div class="empty-state"><p class="empty-title">Failed to load dashboard</p><p class="empty-desc">${err.message}</p></div>`);
  }
}

function kpiCard(label, value, cls, color, sub, icon) {
  return `
    <div class="kpi-card ${cls}">
      <div class="kpi-icon ${color}">${icon}</div>
      <div class="kpi-label">${label}</div>
      <div class="kpi-value">${value}</div>
      <div class="kpi-change">${sub}</div>
    </div>`;
}

/* ================================================================
   PRODUCTS VIEW
================================================================ */
let _products = [];

async function renderProducts() {
  setContent(`<div class="page-loader"><div class="loader"></div></div>`);
  try {
    _products = await api('GET', '/products/index.php');
    paintProducts();
  } catch (err) {
    setContent(`<div class="empty-state"><p class="empty-title">Failed to load products</p><p class="empty-desc">${err.message}</p></div>`);
  }
}

function paintProducts() {
  const cur = Currency.getDisplay();
  const active   = _products.filter(p => p.is_active);
  const archived = _products.filter(p => !p.is_active);

  setContent(`
    <div class="fade-in">
      <div class="page-header flex items-center justify-between">
        <div>
          <h1 class="page-title">Products</h1>
          <p class="page-subtitle">${active.length} active · ${archived.length} archived</p>
        </div>
        <button class="btn btn-primary" onclick="openAddProduct()" id="add-product-btn">
          ${Icon.plus} Add Product
        </button>
      </div>

      ${active.length === 0 ? `
        <div class="empty-state">
          <div class="empty-icon">${Icon.products}</div>
          <p class="empty-title">No products yet</p>
          <p class="empty-desc">Add your first product to start tracking sales</p>
          <button class="btn btn-primary mt-4" onclick="openAddProduct()">Add First Product</button>
        </div>` : `
        <div class="product-grid">
          ${active.map(p => productCard(p, cur)).join('')}
        </div>`}

      ${archived.length > 0 ? `
        <div style="margin-top:24px">
          <h3 class="text-base font-semibold muted mb-4">Archived (${archived.length})</h3>
          <div class="table-wrapper">
            <table>
              <thead><tr><th>Name</th><th>Category</th><th>Action</th></tr></thead>
              <tbody>${archived.map(p => `
                <tr>
                  <td style="color:var(--text-3)">${p.name}</td>
                  <td><span class="badge cat-${p.category}">${CATEGORIES[p.category]?.label||p.category}</span></td>
                  <td><button class="btn btn-secondary btn-sm" onclick="restoreProduct('${p.id}')">Restore</button></td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>` : ''}
      <div style="height:28px"></div>
    </div>`);
}

function productCard(p, cur) {
  const cat  = CATEGORIES[p.category] || { label: p.category, color: '#94a3b8', bg: 'var(--glass)' };
  const low  = p.stock_qty <= p.low_stock_alert;
  const margin = p.buy_price_usd > 0
    ? Math.round(((p.sell_price_usd - p.buy_price_usd) / p.sell_price_usd) * 100)
    : 0;

  return `
    <div class="card" style="padding:18px">
      <div class="flex items-center justify-between mb-3">
        <div class="product-tile-icon" style="background:${cat.bg};color:${cat.color}">
          ${Icon.products}
        </div>
        <div class="flex gap-2">
          <button class="btn-icon" onclick="openEditProduct('${p.id}')" title="Edit">
            <span class="tooltip">Edit</span>${Icon.edit}
          </button>
          <button class="btn-icon" onclick="deleteProduct('${p.id}')" title="Archive" style="color:var(--danger)">
            <span class="tooltip">Archive</span>${Icon.trash}
          </button>
        </div>
      </div>

      <div style="font-weight:700;font-size:14px;margin-bottom:4px">${p.name}</div>
      <span class="badge cat-${p.category}" style="margin-bottom:12px;display:inline-flex">${cat.label}</span>

      <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px">
        <div class="flex items-center justify-between text-sm">
          <span class="muted">Sell</span>
          <span style="font-weight:700;color:var(--primary-light)">${Currency.format(p.sell_price_usd, cur)}</span>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="muted">Cost</span>
          <span>${Currency.format(p.buy_price_usd, cur)}</span>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="muted">Margin</span>
          <span style="color:var(--success)">${margin}%</span>
        </div>
      </div>

      <!-- Stock bar -->
      <div class="flex items-center justify-between text-sm mb-1">
        <span class="muted">Stock</span>
        <span style="font-weight:600;color:${low?'var(--danger)':'var(--text-1)'}">${p.stock_qty} units ${low?'⚠ Low':''}</span>
      </div>
      <div class="stock-bar">
        <div class="stock-bar-fill ${low?'low':p.stock_qty>p.low_stock_alert*3?'high':'medium'}"
             style="width:${Math.min(100,(p.stock_qty/(Math.max(p.low_stock_alert*4,1)))*100)}%">
        </div>
      </div>
    </div>`;
}

function openAddProduct() {
  showModal(`
    <div class="modal">
      <div class="modal-header">
        <h2 class="modal-title">Add Product</h2>
        <button class="btn-icon" onclick="hideModal()">${Icon.close}</button>
      </div>
      <form onsubmit="submitProduct(event)">
        <div class="form-group">
          <label class="form-label">Product Name</label>
          <input id="p-name" type="text" class="form-input" placeholder="e.g. Beef Burger" required>
        </div>
        <div class="form-group">
          <label class="form-label">Category</label>
          <select id="p-category" class="form-select" required>
            <option value="">— Select category —</option>
            ${Object.entries(CATEGORIES).map(([k,v])=>`<option value="${k}">${v.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Cost Price (${Currency.symbol()})</label>
            <input id="p-buy" type="number" step="0.01" min="0" class="form-input" placeholder="0.00" required>
          </div>
          <div class="form-group">
            <label class="form-label">Sell Price (${Currency.symbol()})</label>
            <input id="p-sell" type="number" step="0.01" min="0" class="form-input" placeholder="0.00" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Initial Stock (units)</label>
            <input id="p-stock" type="number" min="0" class="form-input" placeholder="0" value="0">
          </div>
          <div class="form-group">
            <label class="form-label">Low Stock Alert</label>
            <input id="p-low" type="number" min="0" class="form-input" placeholder="5" value="5">
          </div>
        </div>
        <div id="product-form-error" class="form-error hidden"></div>
        <div class="flex gap-3">
          <button type="button" class="btn btn-secondary" onclick="hideModal()">Cancel</button>
          <button type="submit" class="btn btn-primary" style="flex:1" id="product-submit-btn">Save Product</button>
        </div>
      </form>
    </div>`);
}

async function submitProduct(e) {
  e.preventDefault();
  const btn = document.getElementById('product-submit-btn');
  const err = document.getElementById('product-form-error');
  btn.disabled = true; btn.innerHTML = `<div class="loader"></div>`;
  err.classList.add('hidden');

  const cur = Currency.getDisplay();
  try {
    await api('POST', '/products/index.php', {
      name:          document.getElementById('p-name').value,
      category:      document.getElementById('p-category').value,
      buy_price_usd: Currency.parseInput(document.getElementById('p-buy').value, cur),
      sell_price_usd:Currency.parseInput(document.getElementById('p-sell').value, cur),
      stock_qty:     parseInt(document.getElementById('p-stock').value) || 0,
      low_stock_alert: parseInt(document.getElementById('p-low').value) || 5,
    });
    hideModal();
    toast('success', 'Product added');
    renderProducts();
  } catch(ex) {
    err.textContent = ex.message; err.classList.remove('hidden');
    btn.disabled = false; btn.innerHTML = 'Save Product';
  }
}

function openEditProduct(id) {
  const p = _products.find(x => x.id === id);
  if (!p) return;
  const cur = Currency.getDisplay();
  const mul = cur === 'ZAR' ? Currency.getRate() : 1;

  showModal(`
    <div class="modal">
      <div class="modal-header">
        <h2 class="modal-title">Edit Product</h2>
        <button class="btn-icon" onclick="hideModal()">${Icon.close}</button>
      </div>
      <form onsubmit="submitEditProduct(event,'${id}')">
        <div class="form-group">
          <label class="form-label">Product Name</label>
          <input id="ep-name" type="text" class="form-input" value="${p.name}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Category</label>
          <select id="ep-category" class="form-select" required>
            ${Object.entries(CATEGORIES).map(([k,v])=>`<option value="${k}" ${p.category===k?'selected':''}>${v.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Cost Price (${Currency.symbol()})</label>
            <input id="ep-buy" type="number" step="0.01" min="0" class="form-input" value="${(p.buy_price_usd*mul).toFixed(2)}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Sell Price (${Currency.symbol()})</label>
            <input id="ep-sell" type="number" step="0.01" min="0" class="form-input" value="${(p.sell_price_usd*mul).toFixed(2)}" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Stock (units)</label>
            <input id="ep-stock" type="number" min="0" class="form-input" value="${p.stock_qty}">
          </div>
          <div class="form-group">
            <label class="form-label">Low Stock Alert</label>
            <input id="ep-low" type="number" min="0" class="form-input" value="${p.low_stock_alert}">
          </div>
        </div>
        <div id="edit-product-error" class="form-error hidden"></div>
        <div class="flex gap-3">
          <button type="button" class="btn btn-secondary" onclick="hideModal()">Cancel</button>
          <button type="submit" class="btn btn-primary" style="flex:1" id="edit-product-btn">Save Changes</button>
        </div>
      </form>
    </div>`);
}

async function submitEditProduct(e, id) {
  e.preventDefault();
  const btn = document.getElementById('edit-product-btn');
  const err = document.getElementById('edit-product-error');
  btn.disabled = true; btn.innerHTML = `<div class="loader"></div>`;
  const cur = Currency.getDisplay();
  try {
    await api('PUT', '/products/item.php', {
      name:           document.getElementById('ep-name').value,
      category:       document.getElementById('ep-category').value,
      buy_price_usd:  Currency.parseInput(document.getElementById('ep-buy').value, cur),
      sell_price_usd: Currency.parseInput(document.getElementById('ep-sell').value, cur),
      stock_qty:      parseInt(document.getElementById('ep-stock').value)||0,
      low_stock_alert:parseInt(document.getElementById('ep-low').value)||5,
    }, { id });
    hideModal();
    toast('success', 'Product updated');
    renderProducts();
  } catch(ex) {
    err.textContent = ex.message; err.classList.remove('hidden');
    btn.disabled = false; btn.innerHTML = 'Save Changes';
  }
}

async function deleteProduct(id) {
  if (!confirm('Archive this product? It will no longer appear in sales.')) return;
  try {
    await api('DELETE', '/products/item.php', null, { id });
    toast('info', 'Product archived');
    renderProducts();
  } catch(ex) { toast('error', 'Failed to archive', ex.message); }
}

async function restoreProduct(id) {
  try {
    await api('PUT', '/products/item.php', { is_active: true }, { id });
    toast('success', 'Product restored');
    renderProducts();
  } catch(ex) { toast('error', 'Failed', ex.message); }
}

/* ================================================================
   RECORD SALE VIEW
================================================================ */
let _saleProducts = [];
let _selectedProduct = null;

async function renderSale() {
  setContent(`<div class="page-loader"><div class="loader"></div></div>`);
  try {
    _saleProducts = await api('GET', '/products/index.php', null, { active: 'true' });
    _saleProducts = _saleProducts.filter(p => p.is_active && p.stock_qty > 0);
    _selectedProduct = null;
    paintSale();
  } catch(err) {
    setContent(`<div class="empty-state"><p class="empty-title">Failed to load products</p></div>`);
  }
}

function paintSale() {
  const cur = Currency.getDisplay();
  setContent(`
    <div class="fade-in">
      <div class="page-header">
        <h1 class="page-title">Record Sale</h1>
        <p class="page-subtitle">Tap a product then confirm the sale</p>
      </div>

      ${_saleProducts.length === 0 ? `
        <div class="empty-state">
          <div class="empty-icon">${Icon.products}</div>
          <p class="empty-title">No products in stock</p>
          <p class="empty-desc">Add products and restock before recording a sale</p>
          <button class="btn btn-primary mt-4" onclick="navigate('products')">Go to Products</button>
        </div>` : `
        <!-- Product selection -->
        <div class="card mb-4">
          <h3 class="text-base font-semibold mb-3">Select Product</h3>
          <div class="product-grid" id="sale-product-grid">
            ${_saleProducts.map(p => saleTile(p, cur)).join('')}
          </div>
        </div>

        <!-- Sale details (shown after selection) -->
        <div class="card" id="sale-details" style="display:none">
          <h3 class="text-base font-semibold mb-4">Sale Details</h3>

          <div id="selected-product-info" style="margin-bottom:16px;padding:12px 16px;background:var(--glass);border-radius:12px">
          </div>

          <!-- Quantity -->
          <div class="form-group">
            <label class="form-label">Quantity</label>
            <div class="flex gap-3 items-center">
              <button class="btn btn-secondary btn-icon" onclick="changeQty(-1)" style="width:40px;height:40px;border-radius:12px">—</button>
              <input id="sale-qty" type="number" min="1" value="1" class="form-input" style="text-align:center;font-size:20px;font-weight:700;max-width:100px" oninput="updateSaleTotal()">
              <button class="btn btn-secondary btn-icon" onclick="changeQty(1)" style="width:40px;height:40px;border-radius:12px">+</button>
            </div>
          </div>

          <!-- Currency received -->
          <div class="form-group">
            <label class="form-label">Customer paid in</label>
            <div class="sale-currency-switch">
              <button class="currency-btn active" id="sc-usd" data-cur="USD" onclick="setSaleCurrency('USD')">$ USD</button>
              <button class="currency-btn" id="sc-zar" data-cur="ZAR" onclick="setSaleCurrency('ZAR')">R ZAR</button>
            </div>
          </div>

          <!-- Total display -->
          <div class="sale-total-display">
            <div class="sale-total-label">Total Amount</div>
            <div class="sale-total-value" id="sale-total-display">$0.00</div>
          </div>

          <!-- Date -->
          <div class="form-group">
            <label class="form-label">Sale Date</label>
            <input id="sale-date" type="date" class="form-input" value="${new Date().toISOString().split('T')[0]}">
          </div>

          <div id="sale-error" class="form-error hidden"></div>
          <button class="btn btn-primary btn-lg w-full" id="record-sale-btn" onclick="submitSale()">
            ${Icon.check} Record Sale
          </button>
        </div>`}
      <div style="height:28px"></div>
    </div>`);

  // Set default sale currency to display currency
  window._saleCurrency = cur;
}

function saleTile(p, cur) {
  const cat = CATEGORIES[p.category] || { color: '#94a3b8', bg: 'var(--glass)', label: p.category };
  return `
    <div class="product-tile" id="tile-${p.id}" onclick="selectSaleProduct('${p.id}')">
      <div class="product-tile-icon" style="background:${cat.bg};color:${cat.color}">${Icon.products}</div>
      <div class="product-tile-name">${p.name}</div>
      <div class="product-tile-price">${Currency.format(p.sell_price_usd, cur)}</div>
      <div class="product-tile-stock ${p.stock_qty<=p.low_stock_alert?'danger-text':'muted'}">${p.stock_qty} in stock</div>
    </div>`;
}

function selectSaleProduct(id) {
  _selectedProduct = _saleProducts.find(p => p.id === id);
  if (!_selectedProduct) return;

  document.querySelectorAll('.product-tile').forEach(t => t.classList.remove('selected'));
  const tile = document.getElementById(`tile-${id}`);
  if (tile) tile.classList.add('selected');

  document.getElementById('sale-details').style.display = 'block';
  document.getElementById('sale-qty').value = 1;
  document.getElementById('sale-qty').max   = _selectedProduct.stock_qty;

  const cur = Currency.getDisplay();
  const cat = CATEGORIES[_selectedProduct.category] || {};
  document.getElementById('selected-product-info').innerHTML = `
    <div class="flex items-center justify-between">
      <div>
        <div style="font-weight:700">${_selectedProduct.name}</div>
        <span class="badge cat-${_selectedProduct.category}">${cat.label||_selectedProduct.category}</span>
      </div>
      <div style="text-align:right">
        <div style="font-weight:700;color:var(--primary-light)">${Currency.format(_selectedProduct.sell_price_usd, cur)} each</div>
        <div class="muted text-xs">${_selectedProduct.stock_qty} in stock</div>
      </div>
    </div>`;

  updateSaleTotal();
  tile.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function changeQty(delta) {
  const inp = document.getElementById('sale-qty');
  const max = _selectedProduct?.stock_qty || 99;
  inp.value = Math.min(max, Math.max(1, parseInt(inp.value||1) + delta));
  updateSaleTotal();
}

function setSaleCurrency(cur) {
  window._saleCurrency = cur;
  document.getElementById('sc-usd').classList.toggle('active', cur==='USD');
  document.getElementById('sc-zar').classList.toggle('active', cur==='ZAR');
  updateSaleTotal();
}

function updateSaleTotal() {
  if (!_selectedProduct) return;
  const qty  = parseInt(document.getElementById('sale-qty').value) || 1;
  const cur  = window._saleCurrency || 'USD';
  const total = Currency.format(_selectedProduct.sell_price_usd * qty, cur);
  const el = document.getElementById('sale-total-display');
  if (el) el.textContent = total;
}

async function submitSale() {
  if (!_selectedProduct) return;
  const btn = document.getElementById('record-sale-btn');
  const err = document.getElementById('sale-error');
  const qty = parseInt(document.getElementById('sale-qty').value) || 1;
  const cur = window._saleCurrency || 'USD';
  const date = document.getElementById('sale-date').value || new Date().toISOString().split('T')[0];

  if (qty > _selectedProduct.stock_qty) {
    err.textContent = `Only ${_selectedProduct.stock_qty} in stock`;
    err.classList.remove('hidden'); return;
  }

  btn.disabled = true; btn.innerHTML = `<div class="loader"></div> Recording...`;
  err.classList.add('hidden');

  try {
    await api('POST', '/sales/index.php', {
      product_id:       _selectedProduct.id,
      qty,
      currency_received: cur,
      sale_date:        date,
    });
    toast('success', 'Sale recorded!', `${qty}× ${_selectedProduct.name} · ${Currency.format(_selectedProduct.sell_price_usd*qty, cur)}`);
    _selectedProduct = null;
    renderSale(); // reset
  } catch(ex) {
    err.textContent = ex.message; err.classList.remove('hidden');
    btn.disabled = false; btn.innerHTML = `${Icon.check} Record Sale`;
  }
}

/* ================================================================
   EXPENSES VIEW
================================================================ */
let _expenses = [];

async function renderExpenses() {
  setContent(`<div class="page-loader"><div class="loader"></div></div>`);
  try {
    _expenses = await api('GET', '/expenses/index.php');
    paintExpenses();
  } catch(err) {
    setContent(`<div class="empty-state"><p class="empty-title">${err.message}</p></div>`);
  }
}

function paintExpenses() {
  const cur = Currency.getDisplay();
  const total = _expenses.reduce((s,e) => s + parseFloat(e.amount_usd), 0);

  setContent(`
    <div class="fade-in">
      <div class="page-header flex items-center justify-between">
        <div>
          <h1 class="page-title">Expenses</h1>
          <p class="page-subtitle">${_expenses.length} records · Total: ${Currency.format(total, cur)}</p>
        </div>
        <button class="btn btn-primary" onclick="openAddExpense()" id="add-expense-btn">
          ${Icon.plus} Log Expense
        </button>
      </div>

      ${_expenses.length === 0 ? `
        <div class="empty-state">
          <div class="empty-icon">${Icon.expenses}</div>
          <p class="empty-title">No expenses logged</p>
          <p class="empty-desc">Track your spending to see accurate profit figures</p>
          <button class="btn btn-primary mt-4" onclick="openAddExpense()">Log First Expense</button>
        </div>` : `
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${_expenses.map(e => `
                <tr>
                  <td style="font-weight:500">${e.description}</td>
                  <td><span class="badge badge-gray">${e.category}</span></td>
                  <td style="font-weight:700;color:var(--warning)">${Currency.format(e.amount_usd, cur)}</td>
                  <td class="muted">${new Date(e.expense_date+'T12:00:00').toLocaleDateString('en-ZW',{day:'numeric',month:'short',year:'numeric'})}</td>
                  <td>
                    <button class="btn-icon" onclick="deleteExpense('${e.id}')" title="Delete" style="color:var(--danger)">
                      ${Icon.trash}
                    </button>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`}
      <div style="height:28px"></div>
    </div>`);
}

function openAddExpense() {
  fetch('/api/products/index.php', {
    headers: { 'Authorization': `Bearer ${App.token}` }
  }).then(r=>r.json()).then(products => {
    const activeProds = (Array.isArray(products) ? products : []).filter(p => p.is_active);
    const cur = Currency.getDisplay();

    showModal(`
      <div class="modal">
        <div class="modal-header">
          <h2 class="modal-title">Log Expense</h2>
          <button class="btn-icon" onclick="hideModal()">${Icon.close}</button>
        </div>
        <form onsubmit="submitExpense(event)">
          <div class="form-group">
            <label class="form-label">Description</label>
            <input id="exp-desc" type="text" class="form-input" placeholder="e.g. Bought burger patties" required>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Category</label>
              <select id="exp-cat" class="form-select">
                <option value="restocking">Restocking</option>
                <option value="transport">Transport</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Amount (${Currency.symbol()})</label>
              <input id="exp-amount" type="number" step="0.01" min="0.01" class="form-input" placeholder="0.00" required>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Date</label>
            <input id="exp-date" type="date" class="form-input" value="${new Date().toISOString().split('T')[0]}">
          </div>

          <!-- Restock shortcut -->
          <div style="padding:14px;background:rgba(16,185,129,.06);border:1px solid rgba(16,185,129,.15);border-radius:12px;margin-bottom:16px">
            <div style="font-weight:600;font-size:12px;color:var(--success);margin-bottom:10px">Restocking Shortcut</div>
            <div class="form-group" style="margin-bottom:8px">
              <label class="form-label">Also increase stock for:</label>
              <select id="exp-product" class="form-select">
                <option value="">— None —</option>
                ${activeProds.map(p => `<option value="${p.id}">${p.name} (${p.stock_qty} in stock)</option>`).join('')}
              </select>
            </div>
            <div class="form-group" style="margin-bottom:0">
              <label class="form-label">Units to add</label>
              <input id="exp-qty" type="number" min="0" class="form-input" placeholder="0" value="0">
            </div>
          </div>

          <div id="expense-error" class="form-error hidden"></div>
          <div class="flex gap-3">
            <button type="button" class="btn btn-secondary" onclick="hideModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" style="flex:1" id="expense-submit-btn">Log Expense</button>
          </div>
        </form>
      </div>`);
  });
}

async function submitExpense(e) {
  e.preventDefault();
  const btn = document.getElementById('expense-submit-btn');
  const err = document.getElementById('expense-error');
  btn.disabled = true; btn.innerHTML = `<div class="loader"></div>`;
  err.classList.add('hidden');
  const cur = Currency.getDisplay();
  try {
    await api('POST', '/expenses/index.php', {
      description:  document.getElementById('exp-desc').value,
      category:     document.getElementById('exp-cat').value,
      amount_usd:   Currency.parseInput(document.getElementById('exp-amount').value, cur),
      expense_date: document.getElementById('exp-date').value,
      product_id:   document.getElementById('exp-product').value || undefined,
      qty_added:    parseInt(document.getElementById('exp-qty').value) || 0,
    });
    hideModal();
    toast('success', 'Expense logged');
    renderExpenses();
  } catch(ex) {
    err.textContent = ex.message; err.classList.remove('hidden');
    btn.disabled = false; btn.innerHTML = 'Log Expense';
  }
}

async function deleteExpense(id) {
  if (!confirm('Delete this expense record?')) return;
  try {
    await api('DELETE', '/expenses/item.php', null, { id });
    toast('info', 'Expense deleted');
    renderExpenses();
  } catch(ex) { toast('error', 'Failed', ex.message); }
}

/* ================================================================
   STOCK VIEW
================================================================ */
async function renderStock() {
  setContent(`<div class="page-loader"><div class="loader"></div></div>`);
  try {
    const items = await api('GET', '/stock/index.php');
    const lowCount = items.filter(i => i.is_low_stock).length;
    const cur = Currency.getDisplay();

    setContent(`
      <div class="fade-in">
        <div class="page-header flex items-center justify-between">
          <div>
            <h1 class="page-title">Stock Management</h1>
            <p class="page-subtitle">${items.filter(i=>i.is_active).length} active products · ${lowCount} low stock</p>
          </div>
          <button class="btn btn-secondary" onclick="renderStock()">${Icon.refresh} Refresh</button>
        </div>

        ${lowCount > 0 ? `
          <div class="low-stock-banner">
            ${Icon.warning}
            <span><strong>${lowCount} product${lowCount>1?'s are':' is'} running low.</strong> Consider restocking soon.</span>
          </div>` : ''}

        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Sell Price</th>
                <th>Stock Level</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${items.filter(i=>i.is_active).map(p => {
                const pct = Math.min(100, (p.stock_qty / Math.max(p.low_stock_alert*4,1))*100);
                const lvl = p.is_low_stock ? 'low' : pct > 60 ? 'high' : 'medium';
                return `
                  <tr>
                    <td style="font-weight:600">${p.name}</td>
                    <td><span class="badge cat-${p.category}">${CATEGORIES[p.category]?.label||p.category}</span></td>
                    <td>
                      <span style="font-weight:700;color:${p.is_low_stock?'var(--danger)':'var(--text-1)'}">${p.stock_qty}</span>
                      <span class="muted text-xs"> / alert at ${p.low_stock_alert}</span>
                    </td>
                    <td>${Currency.format(p.sell_price_usd, cur)}</td>
                    <td style="min-width:100px">
                      <div class="stock-bar" style="margin-top:0">
                        <div class="stock-bar-fill ${lvl}" style="width:${pct}%"></div>
                      </div>
                    </td>
                    <td>
                      <div class="flex gap-2">
                        <button class="btn btn-secondary btn-sm" onclick="adjustStockDialog('${p.id}','${p.name}',${p.stock_qty})">
                          Adjust
                        </button>
                        <button class="btn btn-primary btn-sm" onclick="quickRestock('${p.id}','${p.name}')">
                          Restock
                        </button>
                      </div>
                    </td>
                  </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
        <div style="height:28px"></div>
      </div>`);
  } catch(err) {
    setContent(`<div class="empty-state"><p class="empty-title">${err.message}</p></div>`);
  }
}

function adjustStockDialog(id, name, current) {
  showModal(`
    <div class="modal">
      <div class="modal-header">
        <h2 class="modal-title">Adjust Stock</h2>
        <button class="btn-icon" onclick="hideModal()">${Icon.close}</button>
      </div>
      <p class="muted text-sm" style="margin-bottom:20px">Manually set stock level for <strong>${name}</strong> (currently ${current} units)</p>
      <form onsubmit="submitStockAdjust(event,'${id}')">
        <div class="form-group">
          <label class="form-label">New Stock Quantity</label>
          <input id="stock-qty-input" type="number" min="0" class="form-input" value="${current}" required>
        </div>
        <div id="stock-adjust-error" class="form-error hidden"></div>
        <div class="flex gap-3">
          <button type="button" class="btn btn-secondary" onclick="hideModal()">Cancel</button>
          <button type="submit" class="btn btn-primary" style="flex:1" id="stock-adjust-btn">Update Stock</button>
        </div>
      </form>
    </div>`);
}

async function submitStockAdjust(e, id) {
  e.preventDefault();
  const btn = document.getElementById('stock-adjust-btn');
  const err = document.getElementById('stock-adjust-error');
  btn.disabled = true; btn.innerHTML = `<div class="loader"></div>`;
  try {
    await api('PATCH', '/stock/index.php', {
      product_id: id,
      stock_qty:  parseInt(document.getElementById('stock-qty-input').value),
    });
    hideModal();
    toast('success', 'Stock updated');
    renderStock();
  } catch(ex) {
    err.textContent = ex.message; err.classList.remove('hidden');
    btn.disabled = false; btn.innerHTML = 'Update Stock';
  }
}

function quickRestock(productId, productName) {
  const cur = Currency.getDisplay();
  showModal(`
    <div class="modal">
      <div class="modal-header">
        <h2 class="modal-title">Restock Product</h2>
        <button class="btn-icon" onclick="hideModal()">${Icon.close}</button>
      </div>
      <p class="muted text-sm" style="margin-bottom:20px">Increase stock for <strong>${productName}</strong> and log the cost as an expense.</p>
      <form onsubmit="submitRestock(event,'${productId}')">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Units Added</label>
            <input id="rs-qty" type="number" min="1" class="form-input" placeholder="10" required>
          </div>
          <div class="form-group">
            <label class="form-label">Cost Paid (${Currency.symbol()})</label>
            <input id="rs-cost" type="number" step="0.01" min="0.01" class="form-input" placeholder="0.00" required>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Supplier / Note</label>
          <input id="rs-desc" type="text" class="form-input" placeholder="e.g. Bought from Mbare market" value="Restocked: ${productName}">
        </div>
        <div class="form-group">
          <label class="form-label">Date</label>
          <input id="rs-date" type="date" class="form-input" value="${new Date().toISOString().split('T')[0]}">
        </div>
        <div id="rs-error" class="form-error hidden"></div>
        <div class="flex gap-3">
          <button type="button" class="btn btn-secondary" onclick="hideModal()">Cancel</button>
          <button type="submit" class="btn btn-primary" style="flex:1" id="rs-btn">Restock & Log Expense</button>
        </div>
      </form>
    </div>`);
}

async function submitRestock(e, productId) {
  e.preventDefault();
  const btn = document.getElementById('rs-btn');
  const err = document.getElementById('rs-error');
  btn.disabled = true; btn.innerHTML = `<div class="loader"></div>`;
  const cur = Currency.getDisplay();
  try {
    await api('POST', '/expenses/index.php', {
      description:  document.getElementById('rs-desc').value,
      category:     'restocking',
      amount_usd:   Currency.parseInput(document.getElementById('rs-cost').value, cur),
      expense_date: document.getElementById('rs-date').value,
      product_id:   productId,
      qty_added:    parseInt(document.getElementById('rs-qty').value),
    });
    hideModal();
    toast('success', 'Restocked!', 'Stock increased and expense logged.');
    renderStock();
  } catch(ex) {
    err.textContent = ex.message; err.classList.remove('hidden');
    btn.disabled = false; btn.innerHTML = 'Restock & Log Expense';
  }
}

/* ================================================================
   ANALYTICS VIEW
================================================================ */
let _analyticsRange = '7d';

async function renderAnalytics() {
  setContent(`<div class="page-loader"><div class="loader"></div></div>`);
  await loadAnalytics(_analyticsRange);
}

async function loadAnalytics(range, from='', to='') {
  _analyticsRange = range;
  try {
    const params = { range };
    if (range === 'custom' && from && to) { params.from = from; params.to = to; }
    const d = await api('GET', '/analytics/index.php', null, params);
    const cur = Currency.getDisplay();

    setContent(`
      <div class="fade-in">
        <div class="page-header flex items-center justify-between">
          <div>
            <h1 class="page-title">Analytics</h1>
            <p class="page-subtitle">${d.from} — ${d.to}</p>
          </div>
        </div>

        <!-- Summary pills -->
        <div class="stats-row">
          <div class="stat-pill">${Icon.sale} Revenue: <strong>${Currency.format(d.total_revenue, cur)}</strong></div>
          <div class="stat-pill">${Icon.analytics} Profit: <strong style="color:var(--success)">${Currency.format(d.total_profit, cur)}</strong></div>
          <div class="stat-pill">${Icon.expenses} Expenses: <strong style="color:var(--warning)">${Currency.format(d.total_expenses, cur)}</strong></div>
          <div class="stat-pill">${Icon.trend_up} Margin: <strong style="color:var(--primary-light)">${d.margin_pct}%</strong></div>
        </div>

        <!-- Range selector -->
        <div class="chart-card" style="margin-bottom:16px">
          <div class="chart-header">
            <h3 class="chart-title">Revenue &amp; Profit Over Time</h3>
            <div class="range-tabs">
              <span class="range-tab ${range==='today'?'active':''}" onclick="loadAnalytics('today')">Today</span>
              <span class="range-tab ${range==='7d'?'active':''}" onclick="loadAnalytics('7d')">7 days</span>
              <span class="range-tab ${range==='30d'?'active':''}" onclick="loadAnalytics('30d')">30 days</span>
              <span class="range-tab ${range==='custom'?'active':''}" onclick="showCustomRange()">Custom</span>
            </div>
          </div>
          <div style="height:260px">
            <canvas id="revenue-chart"></canvas>
          </div>
        </div>

        <div class="grid-2" style="margin-bottom:16px">
          <!-- Top products -->
          <div class="chart-card">
            <div class="chart-header">
              <h3 class="chart-title">Top Products</h3>
            </div>
            <div style="height:220px">
              <canvas id="products-chart"></canvas>
            </div>
          </div>

          <!-- Category donut -->
          <div class="chart-card">
            <div class="chart-header">
              <h3 class="chart-title">Sales by Category</h3>
            </div>
            <div style="height:220px">
              <canvas id="category-chart"></canvas>
            </div>
          </div>
        </div>

        <!-- Top products table -->
        ${d.top_products.length > 0 ? `
          <div class="card">
            <h3 class="text-base font-semibold mb-4">Product Performance</h3>
            <div class="table-wrapper" style="border:none">
              <table>
                <thead><tr><th>#</th><th>Product</th><th>Category</th><th>Units Sold</th><th>Revenue</th></tr></thead>
                <tbody>
                  ${d.top_products.map((p,i) => `
                    <tr>
                      <td class="muted">${i+1}</td>
                      <td style="font-weight:600">${p.name}</td>
                      <td><span class="badge cat-${p.category}">${CATEGORIES[p.category]?.label||p.category}</span></td>
                      <td>${p.qty}</td>
                      <td style="font-weight:700;color:var(--primary-light)">${Currency.format(p.revenue, cur)}</td>
                    </tr>`).join('')}
                </tbody>
              </table>
            </div>
          </div>` : ''}
        <div style="height:28px"></div>
      </div>`);

    // Render charts after DOM is ready
    requestAnimationFrame(() => {
      Charts.renderRevenuChart('revenue-chart', d.daily, cur);
      if (d.top_products.length > 0) Charts.renderTopProducts('products-chart', d.top_products, cur);
      if (Object.keys(d.categories).length > 0) Charts.renderCategoryDonut('category-chart', d.categories, cur);
    });

  } catch(err) {
    setContent(`<div class="empty-state"><p class="empty-title">Failed to load analytics</p><p class="empty-desc">${err.message}</p></div>`);
  }
}

function showCustomRange() {
  showModal(`
    <div class="modal">
      <div class="modal-header">
        <h2 class="modal-title">Custom Date Range</h2>
        <button class="btn-icon" onclick="hideModal()">${Icon.close}</button>
      </div>
      <div class="form-group">
        <label class="form-label">From</label>
        <input id="cr-from" type="date" class="form-input" value="${new Date(Date.now()-6*864e5).toISOString().split('T')[0]}">
      </div>
      <div class="form-group">
        <label class="form-label">To</label>
        <input id="cr-to" type="date" class="form-input" value="${new Date().toISOString().split('T')[0]}">
      </div>
      <div class="flex gap-3">
        <button class="btn btn-secondary" onclick="hideModal()">Cancel</button>
        <button class="btn btn-primary" style="flex:1" onclick="applyCustomRange()">Apply</button>
      </div>
    </div>`);
}

function applyCustomRange() {
  const from = document.getElementById('cr-from').value;
  const to   = document.getElementById('cr-to').value;
  if (!from || !to) return;
  hideModal();
  loadAnalytics('custom', from, to);
}

/* ================================================================
   SETTINGS VIEW
================================================================ */
async function renderSettings() {
  setContent(`<div class="page-loader"><div class="loader"></div></div>`);
  try {
    const data = await api('GET', '/settings/index.php');
    const v = data.vendor   || {};
    const s = data.settings || {};
    const cur = Currency.getDisplay();

    setContent(`
      <div class="fade-in">
        <div class="page-header">
          <h1 class="page-title">Settings</h1>
          <p class="page-subtitle">Manage your vendor profile and preferences</p>
        </div>

        <div style="display:flex;flex-direction:column;gap:20px;max-width:600px">

          <!-- Vendor Profile -->
          <div class="card">
            <h3 class="text-base font-semibold mb-4">Vendor Profile</h3>
            <form onsubmit="saveSettings(event)">
              <div class="form-group">
                <label class="form-label">Business / Vendor Name</label>
                <input id="set-name" type="text" class="form-input" value="${v.name||''}" required>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Phone Number</label>
                  <input id="set-phone" type="tel" class="form-input" value="${v.phone||''}" placeholder="+263 77...">
                </div>
                <div class="form-group">
                  <label class="form-label">School / Location</label>
                  <input id="set-school" type="text" class="form-input" value="${v.school||''}" placeholder="School name">
                </div>
              </div>
              <div class="divider"></div>
              <h4 class="text-sm font-semibold" style="margin-bottom:14px;color:var(--text-2)">Currency Settings</h4>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Exchange Rate (1 USD = ? ZAR)</label>
                  <input id="set-rate" type="number" step="0.0001" min="0.0001" class="form-input" value="${s.exchange_rate_usd_to_zar||18.5}" required>
                  <span class="form-hint">Current: 1 USD = R${parseFloat(s.exchange_rate_usd_to_zar||18.5).toFixed(2)} ZAR</span>
                </div>
                <div class="form-group">
                  <label class="form-label">Default Display Currency</label>
                  <select id="set-currency" class="form-select">
                    <option value="USD" ${(s.display_currency||'USD')==='USD'?'selected':''}>USD ($)</option>
                    <option value="ZAR" ${(s.display_currency||'USD')==='ZAR'?'selected':''}>ZAR (R)</option>
                  </select>
                </div>
              </div>
              <div id="settings-error" class="form-error hidden"></div>
              <button type="submit" class="btn btn-primary" id="settings-save-btn">
                ${Icon.check} Save Settings
              </button>
            </form>
          </div>

          <!-- App Preferences -->
          <div class="card">
            <h3 class="text-base font-semibold mb-4">App Preferences</h3>
            <div class="flex items-center justify-between" style="padding:12px 0;border-bottom:1px solid var(--border)">
              <div>
                <div style="font-weight:600;font-size:13px">Dark / Light Mode</div>
                <div class="muted text-xs">Switch the visual theme</div>
              </div>
              <button class="btn btn-secondary btn-sm" onclick="toggleTheme()">
                Toggle Theme
              </button>
            </div>
            <div class="flex items-center justify-between" style="padding:12px 0">
              <div>
                <div style="font-weight:600;font-size:13px">Display Currency</div>
                <div class="muted text-xs">Currently showing prices in: <strong>${cur}</strong></div>
              </div>
              <div class="currency-pill">
                <button class="currency-btn ${cur==='USD'?'active':''}" data-cur="USD" onclick="toggleCurrency('USD')">$ USD</button>
                <button class="currency-btn ${cur==='ZAR'?'active':''}" data-cur="ZAR" onclick="toggleCurrency('ZAR')">R ZAR</button>
              </div>
            </div>
          </div>

          <!-- Danger Zone -->
          <div class="card" style="border-color:rgba(239,68,68,.2)">
            <h3 class="text-base font-semibold mb-3" style="color:var(--danger)">Account</h3>
            <button class="btn btn-danger" onclick="logout()">
              ${Icon.logout} Sign Out
            </button>
          </div>
        </div>
        <div style="height:28px"></div>
      </div>`);
  } catch(err) {
    setContent(`<div class="empty-state"><p class="empty-title">${err.message}</p></div>`);
  }
}

async function saveSettings(e) {
  e.preventDefault();
  const btn = document.getElementById('settings-save-btn');
  const err = document.getElementById('settings-error');
  btn.disabled = true; btn.innerHTML = `<div class="loader"></div> Saving...`;
  err.classList.add('hidden');
  try {
    const rate = parseFloat(document.getElementById('set-rate').value);
    const cur  = document.getElementById('set-currency').value;
    await api('PUT', '/settings/index.php', {
      name:                     document.getElementById('set-name').value,
      phone:                    document.getElementById('set-phone').value,
      school:                   document.getElementById('set-school').value,
      exchange_rate_usd_to_zar: rate,
      display_currency:         cur,
    });

    // Update local state
    App.settings.exchange_rate_usd_to_zar = rate;
    App.settings.display_currency         = cur;
    Currency.init(rate, cur);

    // Update vendor name in header
    const nameInput = document.getElementById('set-name').value;
    if (App.vendor) App.vendor.name = nameInput;
    localStorage.setItem('vf_vendor', JSON.stringify(App.vendor));

    // Re-render header with new vendor name & footer rate
    renderShell();
    navigate('settings');
    toast('success', 'Settings saved!');
  } catch(ex) {
    err.textContent = ex.message; err.classList.remove('hidden');
    btn.disabled = false; btn.innerHTML = `${Icon.check} Save Settings`;
  }
}

/* ================================================================
   APP INIT
================================================================ */
async function init() {
  initTheme();

  if (!App.token) {
    showAuth('login');
    return;
  }

  // Load settings before rendering shell
  await loadSettings();
  renderShell();

  // Route to hash or default
  const hash = window.location.hash.slice(1);
  navigate(ROUTES[hash] ? hash : 'dashboard');
}

// Start
document.addEventListener('DOMContentLoaded', init);
