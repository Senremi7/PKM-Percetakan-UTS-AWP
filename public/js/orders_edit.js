function getId() {
  const p = new URLSearchParams(location.search);
  return Number(p.get('id'));
}

function showError(msg) {
  const el = document.getElementById('error');
  el.textContent = msg;
  el.style.display = 'block';
}

function toDateInput(dstr) {
  if (!dstr) return '';
  const d = new Date(dstr);
  if (isNaN(d)) return '';
  return d.toISOString().slice(0,10);
}

(async () => {
  const id = getId();
  if (!id) { showError('ID tidak valid'); return; }
  const res = await fetch(`/api/orders/${id}`, { credentials: 'same-origin' });
  if (res.status === 401) return (location.href = '/login');
  if (!res.ok) { showError('Order tidak ditemukan'); return; }
  const data = await res.json();
  const o = data.order;
  const f = document.getElementById('form');
  f.order_number.value = o.order_number || '';
  // Match DB values exactly (spaces), fallback to pending if empty
  f.status.value = String(o.status || '').toLowerCase().replace(/_/g,' ').replace(/\s+/g,' ').trim() || 'pending';
  f.tanggal_pesan.value = toDateInput(o.tanggal_pesan);
  f.tanggal_selesai.value = toDateInput(o.tanggal_selesai);
  f.biaya_tambahan.value = o.biaya_tambahan || 0;
  f.diskon.value = o.diskon || 0;
  f.catatan.value = o.catatan || '';

  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      status: f.status.value,
      tanggal_pesan: f.tanggal_pesan.value || undefined,
      tanggal_selesai: f.tanggal_selesai.value || null,
      biaya_tambahan: Number(f.biaya_tambahan.value || 0),
      diskon: Number(f.diskon.value || 0),
      catatan: f.catatan.value || null
    };
    const upd = await fetch(`/api/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload)
    });
    if (!upd.ok) {
      const j = await upd.json().catch(()=>({error:'Gagal update'}));
      return showError(j.error || 'Gagal update');
    }
    location.href = '/orders';
  });
})();