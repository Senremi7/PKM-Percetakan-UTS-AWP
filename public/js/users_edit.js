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
  if (!id) { showError('ID tidak valid'); return; }
  // fetch user
  const res = await fetch(`/api/users/${id}`, { credentials: 'same-origin' });
  if (res.status === 401) return (location.href = '/login');
  if (res.status === 403) return (location.href = '/');
  if (!res.ok) { showError('User tidak ditemukan'); return; }
  const data = await res.json();
  const u = data.user;
  const f = document.getElementById('form');
  f.username.value = u.username || '';
  f.nama.value = u.nama || '';
  f.email.value = u.email || '';
  f.no_hp.value = u.no_hp || '';
  f.alamat.value = u.alamat || '';
  f.role.value = u.role || 'customer';

  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      username: f.username.value.trim(),
      nama: f.nama.value.trim(),
      email: f.email.value.trim(),
      no_hp: f.no_hp.value.trim(),
      alamat: f.alamat.value.trim(),
      role: f.role.value,
      password: f.password.value.trim() || undefined
    };
    const upd = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload)
    });
    if (!upd.ok) {
      const j = await upd.json().catch(()=>({error:'Gagal update'}));
      return showError(j.error || 'Gagal update');
    }
    location.href = '/users';
  });
})();