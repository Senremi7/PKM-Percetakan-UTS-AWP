async function fetchJSON(url) {
  const res = await fetch(url, { credentials: 'same-origin' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

(async () => {
  // build query from form
  const form = document.getElementById('searchUser');
  const usp = new URLSearchParams(location.search);
  if (form) {
    if (usp.get('username')) form.username.value = usp.get('username');
    if (usp.get('nama')) form.nama.value = usp.get('nama');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = new URLSearchParams();
      if (form.username.value) q.set('username', form.username.value);
      if (form.nama.value) q.set('nama', form.nama.value);
      location.href = '/users' + (q.toString() ? `?${q}` : '');
    });
  }

  const apiUrl = '/api/users' + (usp.toString() ? `?${usp}` : '');
  const data = await fetchJSON(apiUrl);
  const tb = document.getElementById('tbody');
  tb.innerHTML = '';
  (data.users || []).forEach((u, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${u.id}</td>
      <td>${u.username}</td>
      <td>${u.nama || ''}</td>
      <td>${u.email || ''}</td>
      <td>${u.no_hp || ''}</td>
      <td>${u.role}</td>
      <td>
        <a class="btn" href="/users/edit?id=${u.id}">Edit</a>
        <button class="btn" data-del="${u.id}">Hapus</button>
      </td>
    `;
    tb.appendChild(tr);
  });

  // bind delete
  tb.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-del]');
    if (!btn) return;
    if (!confirm('Hapus user ini?')) return;
    const id = btn.getAttribute('data-del');
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE', credentials: 'same-origin' });
    if (!res.ok) {
      const j = await res.json().catch(()=>({error:'Gagal hapus'}));
      return alert(j.error || 'Gagal hapus');
    }
    location.reload();
  });
})();