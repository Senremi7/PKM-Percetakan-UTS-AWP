async function fetchJSON(url) {
  const res = await fetch(url, { credentials: 'same-origin' });
  if (!res.ok) {
    if (res.status === 401) location.href = '/login';
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}

(async () => {
  try {
    const params = new URLSearchParams(location.search);
    const search = params.get('search') || '';
    const status = params.get('status') || '';
    const q = new URLSearchParams();
    if (search) q.set('search', search);
    if (status) q.set('status', status);
    const apiUrl = '/api/products' + (q.toString() ? `?${q}` : '');
    // set input value if present
    const form = document.getElementById('searchForm');
    if (form) {
      if (search) form.search.value = search;
      if (status) form.status.value = status;
    }

    const data = await fetchJSON(apiUrl);
    const tb = document.getElementById('tbody');
    tb.innerHTML = '';
    (data.products || []).forEach((p) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${p.id}</td>
        <td>${p.nama_produk || ''}</td>
        <td>${p.deskripsi || ''}</td>
        <td>Rp ${Number(p.harga).toLocaleString('id-ID')}</td>
        <td>${p.satuan || ''}</td>
        <td>${p.status || ''}</td>
        <td>
          <a class="btn" href="/products/edit?id=${p.id}">Edit</a>
          <button class="btn" data-del="${p.id}">Hapus</button>
        </td>
      `;
      tb.appendChild(tr);
    });

    tb.addEventListener('click', async (e) => {
      const btn = e.target.closest('button[data-del]');
      if (!btn) return;
      if (!confirm('Hapus produk ini?')) return;
      const id = btn.getAttribute('data-del');
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE', credentials: 'same-origin' });
      if (!res.ok) {
        const j = await res.json().catch(()=>({error:'Gagal hapus'}));
        return alert(j.error || 'Gagal hapus');
      }
      location.reload();
    });
  } catch (e) {
    console.error(e);
    alert('Gagal memuat produk');
  }
})();
