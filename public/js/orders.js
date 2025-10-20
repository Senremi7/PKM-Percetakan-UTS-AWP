async function fetchJSON(url) {
  const res = await fetch(url, { credentials: 'same-origin' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function updateStatus(id, status) {
  const res = await fetch(`/api/orders/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ status })
  });
  return res.ok;
}

async function deleteOrder(id) {
  const res = await fetch(`/api/orders/${id}`, { method: 'DELETE', credentials: 'same-origin' });
  return res.ok;
}

(async () => {
  // Who am I
  let user = null;
  try {
    const me = await fetchJSON('/api/me');
    user = me.user;
  } catch (e) {
    return (location.href = '/login');
  }

  const roleInfo = document.getElementById('role-info');
  if (user.role === 'customer') {
    roleInfo.textContent = 'Tampilan Customer: Lihat status pesanan Anda.';
  } else if (user.role === 'staff' || user.role === 'admin') {
    roleInfo.textContent = 'Tampilan Staff/Admin: Ubah status atau hapus pesanan (admin).';
  }

  // Load orders
  const data = await fetchJSON('/api/orders');
  const tb = document.getElementById('tbody');
  tb.innerHTML = '';

  const statusOpts = [
    { value: 'pending', label: 'Pending' },
    { value: 'diproses', label: 'Diproses' },
    { value: 'pengiriman', label: 'Pengiriman' },
    { value: 'selesai', label: 'Selesai' },
    { value: 'menunggu pembayaran', label: 'Menunggu Pembayaran' }
  ];

  function statusValue(v) {
    return String(v || '').toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function statusLabel(v) {
    const val = statusValue(v);
    const found = statusOpts.find(x => x.value === val);
    return found ? found.label : (val || '—');
  }

  (data.orders || []).forEach((o) => {
    const tr = document.createElement('tr');
    const total = Number(o.total_harga || 0).toLocaleString('id-ID');
    const tanggal = o.tanggal_pesan ? new Date(o.tanggal_pesan).toISOString().slice(0,10) : '';
    const customerName = o.customer_nama || '-';

    let statusCell = '';
    let actionCell = '';
    if (user.role === 'customer') {
      statusCell = statusLabel(o.status);
      actionCell = '';
    } else {
      // staff/admin: can change status
      const curr = statusValue(o.status);
      const options = statusOpts
        .map(s => `<option value=\"${s.value}\" ${s.value===curr?'selected':''}>${s.label}</option>`) 
        .join('');
      statusCell = `<select data-oid=\"${o.id}\">${options}</select>`;
      if (user.role === 'admin') {
        actionCell = `<a class="btn" href="/orders/edit?id=${o.id}">Edit</a> <button class="btn" data-del="${o.id}">Hapus</button>`;
      }
    }

    tr.innerHTML = `
      <td>${o.order_number}</td>
      <td>${tanggal}</td>
      <td>${customerName}</td>
      <td>${statusCell}</td>
      <td>Rp ${total}</td>
      <td><button class=\"btn\" data-detail=\"${o.id}\">Detail</button> ${actionCell}</td>
    `;
    tb.appendChild(tr);
  });

  // Toggle detail rows
  tb.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-detail]');
    if (!btn) return;
    const oid = btn.getAttribute('data-detail');
    const existing = document.querySelector(`tr[data-detail-for=\"${oid}\"]`);
    if (existing) { existing.remove(); return; }
    try {
      const data = await fetchJSON(`/api/orders/${oid}/items`);
      const tr = document.createElement('tr');
      tr.setAttribute('data-detail-for', oid);
      const td = document.createElement('td');
      td.colSpan = 6;
      const rows = (data.items || []).map(it => `
        <tr>
          <td>${it.nama_produk}</td>
          <td>${it.jumlah}</td>
          <td>Rp ${Number(it.harga_satuan).toLocaleString('id-ID')}</td>
          <td>Rp ${Number(it.line_total).toLocaleString('id-ID')}</td>
        </tr>
      `).join('');
      td.innerHTML = `
        <div style=\"padding:8px; background:#fafafa; border:1px solid #eee;\">
          <strong>Item Pesanan</strong>
          <table class=\"table\" style=\"margin-top:8px;\">
            <thead><tr><th>Produk</th><th>Qty</th><th>Harga</th><th>Total</th></tr></thead>
            <tbody>${rows || '<tr><td colspan=\"4\">Tidak ada item</td></tr>'}</tbody>
          </table>
        </div>
      `;
      tr.appendChild(td);
      btn.closest('tr').insertAdjacentElement('afterend', tr);
    } catch (err) {
      console.error(err);
      alert('Gagal memuat detail');
    }
  });

  // Bind status change
  tb.addEventListener('change', async (e) => {
    const sel = e.target.closest('select[data-oid]');
    if (!sel) return;
    const oid = sel.getAttribute('data-oid');
    const ok = await updateStatus(oid, sel.value);
    if (!ok) alert('Gagal update status');
  });

  // Bind delete
  tb.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-del]');
    if (!btn) return;
    if (!confirm('Hapus pesanan ini?')) return;
    const id = btn.getAttribute('data-del');
    const ok = await deleteOrder(id);
    if (!ok) return alert('Gagal hapus pesanan');
    location.reload();
  });
})();