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
  
  // Generate menu items based on user role
  const generateMenuItems = () => {
    const items = [];
    
    // Common items
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
    
    return items;
  };

  const menuItems = generateMenuItems();

  nav.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo/Brand -->
        <div class="flex items-center">
          <a href="/" class="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
            PKM Percetakan
          </a>
        </div>

        <!-- Desktop Menu -->
        <div class="hidden md:flex items-center space-x-4">
          ${menuItems.join('')}
        </div>

        <!-- Mobile menu button -->
        <div class="md:hidden">
          <button id="mobile-menu-button" type="button" class="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500" aria-controls="mobile-menu" aria-expanded="false">
            <span class="sr-only">Open main menu</span>
            <!-- Hamburger icon -->
            <svg class="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <!-- Close icon -->
            <svg class="hidden h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile Menu -->
      <div class="md:hidden hidden" id="mobile-menu">
        <div class="px-2 pt-2 pb-3 space-y-1">
          ${menuItems.map(item => {
            // Remove form from mobile menu items (we'll handle logout differently)
            if (item.includes('logout') || item.includes('Logout')) {
              return `
                <div class="px-3 py-2">
                  <form method="post" action="/logout" class="w-full">
                    <button type="submit" class="w-full text-left bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                      Logout
                    </button>
                  </form>
                </div>
              `;
            }
            if (item.includes('register') || item.includes('Register')) {
              return item.replace('px-4', 'px-3').replace('inline', 'block');
            }
            return item.replace('inline', 'block').replace('px-3', 'px-3').replace('space-x-4', 'space-y-1');
          }).join('')}
        </div>
      </div>
    </div>
  `;

  // Add to DOM
  const mount = document.getElementById('navbar');
  if (mount) {
    mount.innerHTML = '';
    mount.appendChild(nav);
  } else {
    document.body.prepend(nav);
  }

  // Add mobile menu toggle functionality
  setTimeout(() => {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    const hamburgerIcon = mobileMenuButton?.querySelector('svg.block');
    const closeIcon = mobileMenuButton?.querySelector('svg.hidden');

    if (mobileMenuButton && mobileMenu) {
      mobileMenuButton.addEventListener('click', () => {
        const isExpanded = mobileMenuButton.getAttribute('aria-expanded') === 'true';
        
        // Toggle menu visibility
        mobileMenu.classList.toggle('hidden');
        
        // Toggle icons
        hamburgerIcon?.classList.toggle('hidden');
        closeIcon?.classList.toggle('hidden');
        
        // Update aria-expanded
        mobileMenuButton.setAttribute('aria-expanded', (!isExpanded).toString());
      });

      // Close menu when clicking outside
      document.addEventListener('click', (event) => {
        if (!mobileMenu.contains(event.target) && !mobileMenuButton.contains(event.target)) {
          mobileMenu.classList.add('hidden');
          hamburgerIcon?.classList.remove('hidden');
          closeIcon?.classList.add('hidden');
          mobileMenuButton.setAttribute('aria-expanded', 'false');
        }
      });
    }
  }, 0);
}

(async () => {
  const user = await getUser();
  renderNavbar(user);
})();
