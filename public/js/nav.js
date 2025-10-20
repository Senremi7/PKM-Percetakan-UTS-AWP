async function getUser() {
  try {
    const res = await fetch('/api/me', { credentials: 'same-origin' });
    if (!res.ok) return null;
    const j = await res.json();
    return j.user;
  } catch {
    return null;
  }
}

function renderNavbar(user) {
  const nav = document.createElement('nav');
  nav.className = 'bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50';
  
  const brand = `
    <div class="flex items-center">
      <a href="/" class="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
        PKM Percetakan
      </a>
    </div>
  `;

  const items = [];
  items.push('<a href="/" class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">Home</a>');

  if (user) {
    items.push('<a href="/dashboard" class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">Dashboard</a>');
    if (user.role === 'admin' || user.role === 'staff') {
      items.push('<a href="/products" class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">Products</a>');
      items.push('<a href="/orders" class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">Orders</a>');
      if (user.role === 'admin') {
        items.push('<a href="/reports" class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">Reports</a>');
        items.push('<a href="/users" class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">Users</a>');
      }
    } else {
      items.push('<a href="/orders" class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">Pesanan Saya</a>');
      items.push('<a href="/cart" class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">Cart</a>');
    }
    items.push(`
      <form method="post" action="/logout" class="inline">
        <button type="submit" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
          Logout
        </button>
      </form>
    `);
  } else {
    items.push('<a href="/login" class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">Login</a>');
    items.push('<a href="/register" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">Register</a>');
  }

  nav.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        ${brand}
        <div class="flex items-center space-x-4">
          ${items.join('')}
        </div>
      </div>
    </div>
  `;

  const mount = document.getElementById('navbar');
  if (mount) {
    mount.innerHTML = '';
    mount.appendChild(nav);
  } else {
    document.body.prepend(nav);
  }
}

(async () => {
  const user = await getUser();
  renderNavbar(user);
})();