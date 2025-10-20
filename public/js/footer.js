function renderFooter() {
  const footer = document.createElement('footer');
  footer.className = 'bg-gray-800 text-white py-12 mt-16';
  footer.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Company Info -->
        <div>
          <h3 class="text-xl font-bold mb-4">PKM Percetakan</h3>
          <p class="text-gray-300 mb-4">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
          </p>
          <p class="text-gray-300">
            Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.
          </p>
        </div>
        
        <!-- Contact Info -->
        <div>
          <h3 class="text-xl font-bold mb-4">Hubungi Kami</h3>
          <div class="space-y-3">
            <div class="flex items-center">
              <div class="text-lg mr-3">📞</div>
              <div>
                <p class="text-gray-300">Telepon: (021) 1234-5678</p>
                <p class="text-gray-300">WhatsApp: +62 812-3456-7890</p>
              </div>
            </div>
            <div class="flex items-center">
              <div class="text-lg mr-3">📧</div>
              <div>
                <p class="text-gray-300">Email: info@pkmpercetakan.com</p>
                <p class="text-gray-300">Email: order@pkmpercetakan.com</p>
              </div>
            </div>
            <div class="flex items-center">
              <div class="text-lg mr-3">📍</div>
              <div>
                <p class="text-gray-300">Alamat: Jl. Percetakan No. 123</p>
                <p class="text-gray-300">Jakarta Selatan 12345</p>
              </div>
            </div>
            <div class="flex items-center">
              <div class="text-lg mr-3">🕒</div>
              <div>
                <p class="text-gray-300">Jam Operasional:</p>
                <p class="text-gray-300">Senin - Jumat: 08:00 - 17:00</p>
                <p class="text-gray-300">Sabtu: 08:00 - 12:00</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Services -->
        <div>
          <h3 class="text-xl font-bold mb-4">Layanan Kami</h3>
          <ul class="space-y-2 text-gray-300">
            <li>• Cetak Banner & Spanduk</li>
            <li>• Cetak Brosur & Flyer</li>
            <li>• Cetak Kartu Nama</li>
            <li>• Cetak Stiker & Label</li>
            <li>• Cetak Undangan</li>
            <li>• Cetak Buku & Katalog</li>
            <li>• Desain Grafis</li>
            <li>• Jasa Finishing</li>
          </ul>
        </div>
      </div>
      
      <!-- Bottom Bar -->
      <div class="border-t border-gray-700 mt-8 pt-8">
        <div class="flex flex-col md:flex-row justify-between items-center">
          <div class="text-gray-300 text-sm">
            <p>&copy; 2025 PKM Percetakan. All rights reserved.</p>
            <p class="mt-1">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
          </div>
          <div class="mt-4 md:mt-0">
            <p class="text-gray-300 text-sm">
              AHIHIHIHIHIHIHIHIHIHIHIHIHIHIHIHIHIHIHIHIHIHIHIHIHIHIHIHIHIHIHIHIHIHIHIHIHIHIHIHIHIHIH
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
  
  return footer;
}

// Auto-render footer jika ada element dengan id="footer"
document.addEventListener('DOMContentLoaded', () => {
  const footerElement = document.getElementById('footer');
  if (footerElement) {
    footerElement.appendChild(renderFooter());
  }
});
