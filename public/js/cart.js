async function refreshCart() {
  const res = await fetch('/api/cart', { credentials: 'same-origin' });
  if (res.status === 401) return location.href = '/login';
  const data = await res.json();
  const tb = document.getElementById('tbody');
  tb.innerHTML = '';
  let subtotal = 0;
  
  if (data.items.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td colspan="4" class="px-6 py-8 text-center text-gray-500">
        <div class="text-4xl mb-2">🛒</div>
        <p>Keranjang Anda kosong</p>
        <a href="/" class="text-blue-600 hover:text-blue-700 font-medium">Mulai belanja</a>
      </td>
    `;
    tb.appendChild(tr);
  } else {
    data.items.forEach((it) => {
      const p = it.product || { nama_produk: 'Unknown', harga: 0, satuan: '' };
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-gray-50';
      const harga = Number(p.harga) || 0;
      const qty = Number(it.qty) || 0;
      const lineFromApi = Number(it.line_total);
      const line = (!isNaN(lineFromApi) && lineFromApi > 0) ? lineFromApi : (harga * qty);
      tr.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="flex items-center">
            <div class="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
              <div class="text-lg">📄</div>
            </div>
            <div>
              <div class="text-sm font-medium text-gray-900">${p.nama_produk}</div>
              <div class="text-sm text-gray-500">${p.satuan}</div>
            </div>
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${qty}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Rp ${harga.toLocaleString('id-ID')}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Rp ${line.toLocaleString('id-ID')}</td>
      `;
      tb.appendChild(tr);
      subtotal += line;
    });
  }
  
  document.getElementById('subtotal').textContent = `Rp ${subtotal.toLocaleString('id-ID')}`;
}

async function clearCart() {
  const res = await fetch('/api/cart/clear', { method: 'POST', credentials: 'same-origin' });
  if (res.status === 401) return location.href = '/login';
  await refreshCart();
}

async function checkout() {
  const res = await fetch('/api/orders/checkout', { method: 'POST', credentials: 'same-origin' });
  if (res.status === 401) return location.href = '/login';
  if (!res.ok) {
    const j = await res.json().catch(()=>({error:'Gagal'}));
    alert(j.error || 'Checkout gagal');
    return;
  }
  const j = await res.json();
  alert(`Order berhasil dibuat: ${j.order_number}`);
  location.href = '/orders';
}

(async () => {
  await refreshCart();
  document.getElementById('btnClear').addEventListener('click', clearCart);
  document.getElementById('btnCheckout').addEventListener('click', checkout);
})();