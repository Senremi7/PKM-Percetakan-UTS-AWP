async function fetchJSON(url) {
  const res = await fetch(url, { credentials: 'same-origin' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

(async () => {
  try {
    const me = await fetchJSON('/api/me');
    const user = me.user;
    const greet = document.getElementById('greet');
    if (greet) greet.textContent = `Dashboard - ${user.nama || user.username}`;

// Admin summary cards
if (user.role === 'admin') {
  try {
    const sum = await fetchJSON('/api/dashboard/summary');
    const statusMap = new Map((sum.by_status || []).map(r => [String(r.status || '').toLowerCase(), r.cnt]));
    const tiles = [
      { title: 'Total Orders', value: sum.total_orders, icon: '📊', color: 'blue' },
      { title: 'Pending', value: statusMap.get('pending') || 0, icon: '⏳', color: 'yellow' },
      { title: 'Diproses', value: statusMap.get('diproses') || 0, icon: '⚙️', color: 'orange' },
      { title: 'Pengiriman', value: statusMap.get('pengiriman') || 0, icon: '🚚', color: 'purple' },
      { title: 'Menunggu Pembayaran', value: statusMap.get('menunggu pembayaran') || 0, icon: '💳', color: 'red' },
      { title: 'Selesai', value: statusMap.get('selesai') || 0, icon: '✅', color: 'green' },
     // { title: 'Revenue Today', value: `Rp ${Number(sum.revenue_today||0).toLocaleString('id-ID')}`, icon: '💰', color: 'emerald' }
    ];
    
    // Update stats cards
    const statsCards = document.querySelectorAll('.bg-white.rounded-xl.shadow-md');
    tiles.slice(0, 3).forEach((tile, index) => {
      if (statsCards[index]) {
        const valueEl = statsCards[index].querySelector('.text-2xl.font-bold');
        const titleEl = statsCards[index].querySelector('.text-sm.font-medium');
        if (valueEl) valueEl.textContent = tile.value;
        if (titleEl) titleEl.textContent = tile.title;
      }
    });
  } catch {}
}

const menus = await fetchJSON('/api/menus');
    const quick = document.getElementById('quick');
    quick.innerHTML = '';
    menus.menus.forEach((m) => {
      const card = document.createElement('div');
      card.className = 'bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-6 border border-gray-200 hover:border-blue-300 group cursor-pointer';
      card.innerHTML = `
        <a href="${m.url}" class="block">
          <div class="text-center">
            <div class="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">${m.icon || '📋'}</div>
            <h3 class="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors mb-2">${m.name}</h3>
            <p class="text-sm text-gray-500">${m.url}</p>
          </div>
        </a>
      `;
      quick.appendChild(card);
    });
  } catch (e) {
    location.href = '/login';
  }

})();
