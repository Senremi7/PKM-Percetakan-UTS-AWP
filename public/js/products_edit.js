function getId() {
  const p = new URLSearchParams(location.search);
  return Number(p.get('id'));
}

function showError(msg) {
  const el = document.getElementById('error');
  el.textContent = msg;
  el.style.display = 'block';
}

(async () => {
  const id = getId();
  if (!id) {
    showError('ID tidak valid');
    return;
  }
  // Fetch product
  const res = await fetch(`/api/products/${id}`, { credentials: 'same-origin' });
  if (res.status === 401) return (location.href = '/login');
  if (!res.ok) {
    showError('Produk tidak ditemukan');
    return;
  }
  const data = await res.json();
  const form = document.getElementById('form');
  form.nama_produk.value = data.product.nama_produk || '';
  form.deskripsi.value = data.product.deskripsi || '';
  form.harga.value = data.product.harga || 0;
  form.satuan.value = data.product.satuan || '';
  form.status.value = data.product.status || 'active';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      nama_produk: form.nama_produk.value.trim(),
      deskripsi: form.deskripsi.value.trim(),
      harga: Number(form.harga.value),
      satuan: form.satuan.value.trim(),
      status: form.status.value
    };
    if (!payload.nama_produk || !payload.satuan || isNaN(payload.harga)) {
      return showError('Nama, harga, dan satuan wajib diisi');
    }
    const upd = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload)
    });
    if (!upd.ok) {
      const j = await upd.json().catch(()=>({error:'Gagal update'}));
      return showError(j.error || 'Gagal update');
    }
    location.href = '/products';
  });
})();