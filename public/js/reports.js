function toIDR(n) {
  return 'Rp ' + Number(n || 0).toLocaleString('id-ID');
}

async function loadReport(start, end) {
  const url = new URL(location.origin + '/api/reports/sales');
  if (start) url.searchParams.set('start', start);
  if (end) url.searchParams.set('end', end);
  const res = await fetch(url, { credentials: 'same-origin' });
  if (res.status === 401) return (location.href = '/login');
  if (res.status === 403) return alert('Hanya admin yang dapat melihat laporan');
  const data = await res.json();

  // Fill date inputs (if empty)
  const form = document.getElementById('filter');
  if (form.start && !form.start.value) form.start.value = data.start;
  if (form.end && !form.end.value) form.end.value = data.end;
  const period = document.getElementById('period');
  if (period) period.textContent = `Periode: ${data.start} s/d ${data.end}`;

  const tb = document.getElementById('tbody');
  tb.innerHTML = '';
  let grand = 0;
  (data.rows || []).forEach((r) => {
    grand += Number(r.total_harga || 0);
    const tr = document.createElement('tr');
    const tgl = r.tanggal_pesan ? new Date(r.tanggal_pesan).toISOString().slice(0,10) : '';
    const biayaDiskon = `+${toIDR(r.biaya_tambahan || 0)} / -${toIDR(r.diskon || 0)}`;
    tr.innerHTML = `
      <td>${tgl}</td>
      <td>${r.order_number}</td>
      <td>${r.customer_nama || '-'}</td>
      <td>${r.status}</td>
      <td>${toIDR(r.total_items || 0)}</td>
      <td>${biayaDiskon}</td>
      <td>${toIDR(r.total_harga || 0)}</td>
    `;
    tb.appendChild(tr);
  });
  document.getElementById('grand').textContent = toIDR(grand);
}

(function init() {
  const form = document.getElementById('filter');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    loadReport(form.start.value, form.end.value);
  });
  document.getElementById('btnPrint').addEventListener('click', () => window.print());
  loadReport();
})();