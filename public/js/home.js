async function fetchJSON(url) {
  const res = await fetch(url, { credentials: 'same-origin' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

(async () => {
  // Navbar state based on login
  let user = null;
  try {
    const me = await fetchJSON('/api/me');
    user = me.user;
  } catch (e) {
    // not logged in
  }

  const navLogin = document.getElementById('nav-login');
  const navLogout = document.getElementById('nav-logout');
  const navMain = document.getElementById('nav-main');
  const navCart = document.getElementById('nav-cart');

  if (user) {
    if (navLogin) navLogin.style.display = 'none';
    if (navLogout) navLogout.style.display = '';
    if (navMain) navMain.style.display = '';
    if (navCart) navCart.style.display = '';
  } else {
    if (navLogin) navLogin.style.display = '';
    if (navLogout) navLogout.style.display = 'none';
    if (navMain) navMain.style.display = 'none';
    if (navCart) navCart.style.display = 'none';
  }

  // Load public products
  try {
    const data = await fetchJSON('/api/public/products');
    const wrap = document.getElementById('products');
    wrap.innerHTML = '';

    (data.products || []).forEach((p) => {
      const card = document.createElement('div');
      card.className = 'bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-200';
      card.innerHTML = `
        <div class="p-6">
          <div class="h-48 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg mb-4 flex items-center justify-center">
            <div class="text-6xl text-blue-600">📄</div>
          </div>
          <h3 class="text-xl font-semibold text-gray-800 mb-2">${p.nama_produk}</h3>
          <p class="text-gray-600 text-sm mb-4 line-clamp-2">${p.deskripsi || 'Produk berkualitas tinggi untuk kebutuhan percetakan Anda'}</p>
          <div class="flex items-center justify-between mb-4">
            <span class="text-2xl font-bold text-blue-600">Rp ${Number(p.harga).toLocaleString('id-ID')}</span>
            <span class="text-sm text-gray-500">/ ${p.satuan}</span>
          </div>
        </div>
        <div class="px-6 pb-6">
          ${user ? 
            `<div class="space-y-3">
              <!-- Quantity Selector -->
              <div class="flex items-center justify-center space-x-2">
                <button class="quantity-btn bg-gray-200 hover:bg-gray-300 text-gray-700 w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-200 font-bold" data-pid="${p.id}" data-action="decrease">
                  <span class="text-xl">−</span>
                </button>
                <input type="number" class="quantity-input w-20 text-center border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium" 
                       data-pid="${p.id}" value="1" min="1" max="999" step="1" inputmode="numeric">
                <button class="quantity-btn bg-gray-200 hover:bg-gray-300 text-gray-700 w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-200 font-bold" data-pid="${p.id}" data-action="increase">
                  <span class="text-xl">+</span>
                </button>
              </div>
              
              <!-- Add to Cart Button -->
              <button class="add-to-cart-btn w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200" data-pid="${p.id}">
                <div class="flex items-center justify-center">
                  <div class="text-lg mr-2">🛒</div>
                  Tambah ke Keranjang
                </div>
              </button>
            </div>` : 
            '<a class="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 text-center block" href="/login">Login untuk Memesan</a>'
          }
        </div>
      `;
      wrap.appendChild(card);
    });

    // Bind quantity selector and add-to-cart buttons
    wrap.addEventListener('click', async (e) => {
      const target = e.target;
      
      // Handle quantity buttons (including clicks on the button area)
      if (target.classList.contains('quantity-btn') || target.closest('.quantity-btn')) {
        const btn = target.classList.contains('quantity-btn') ? target : target.closest('.quantity-btn');
        const pid = btn.getAttribute('data-pid');
        const action = btn.getAttribute('data-action');
        const quantityInput = wrap.querySelector(`input[data-pid="${pid}"]`);
        let currentQty = parseInt(quantityInput.value) || 1;
        
        if (action === 'increase') {
          currentQty = Math.min(currentQty + 1, 999);
        } else if (action === 'decrease') {
          currentQty = Math.max(currentQty - 1, 1);
        }
        
        quantityInput.value = currentQty;
        return;
      }
      
      // Handle add-to-cart button
      const addToCartBtn = target.closest('.add-to-cart-btn');
      if (addToCartBtn) {
        const pid = addToCartBtn.getAttribute('data-pid');
        const quantityInput = wrap.querySelector(`input[data-pid="${pid}"]`);
        const qty = parseInt(quantityInput.value) || 1;
        
        try {
          const res = await fetch('/api/cart/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ product_id: Number(pid), qty: qty })
          });
          if (res.status === 401) return location.href = '/login';
          if (!res.ok) throw new Error('Failed');
          
          // Show success message with quantity
          alert(`${qty} item ditambahkan ke keranjang`);
          
          // Reset quantity to 1 after adding to cart
          quantityInput.value = 1;
        } catch (err) {
          console.error(err);
          alert('Gagal menambahkan ke keranjang');
        }
      }
    });
    
    wrap.addEventListener('input', (e) => {
      if (!e.target.classList.contains('quantity-input')) return;
      let v = String(e.target.value || '').replace(/[^0-9]/g, '');
      if (v === '') { e.target.value = ''; return; }
      let n = Math.max(1, Math.min(999, parseInt(v, 10) || 1));
      e.target.value = String(n);
    });
    wrap.addEventListener('blur', (e) => {
      if (!e.target.classList.contains('quantity-input')) return;
      if (e.target.value === '' || isNaN(parseInt(e.target.value, 10))) {
        e.target.value = '1';
      }
    }, true);
  } catch (e) {
    console.error(e);
  }
})();
