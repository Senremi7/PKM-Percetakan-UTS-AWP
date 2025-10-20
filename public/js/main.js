async function fetchJSON(url) {
  const res = await fetch(url, { credentials: 'same-origin' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

(async () => {
  try {
    const me = await fetchJSON('/api/me');
    const user = me.user;
    const welcome = document.getElementById('welcome');
    if (welcome) welcome.textContent = `Selamat datang, ${user.nama || user.username}!`;

    const menusRes = await fetchJSON('/api/menus');
    const menuEl = document.getElementById('menu');
    if (menuEl) {
      menuEl.innerHTML = '';
      menusRes.menus.forEach((m) => {
        const menuItem = document.createElement('div');
        menuItem.className = 'bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-6 border border-gray-200 hover:border-blue-300 group cursor-pointer';
        menuItem.innerHTML = `
          <a href="${m.url}" class="block">
            <div class="text-center">
              <div class="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">${m.icon}</div>
              <h3 class="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">${m.name}</h3>
            </div>
          </a>
        `;
        menuEl.appendChild(menuItem);
      });
    }
  } catch (e) {
    // Jika belum login -> ke halaman login
    location.href = '/login';
  }
})();