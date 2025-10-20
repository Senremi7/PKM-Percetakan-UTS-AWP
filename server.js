const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
require("dotenv").config();
const { pool, query } = require('./config/database');

// Helper function untuk backward compatibility
const db = {
  query: (sql, params, callback) => {
    // Pola 1: db.query(sql, callback)
    if (typeof params === 'function' && callback === undefined) {
      const cb = params;
      query(sql)
        .then((rows) => cb(null, rows))
        .catch((err) => { console.error('DB error:', err); cb(err); });
      return;
    }
    // Pola 2: db.query(sql, params, callback)
    if (Array.isArray(params) && typeof callback === 'function') {
      query(sql, params)
        .then((rows) => callback(null, rows))
        .catch((err) => { console.error('DB error:', err); callback(err); });
      return;
    }
    // Pola 3: Promise style: db.query(sql, params)
    return query(sql, params);
  }
};

const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

app.use(
  session({
    name: 'sessid',
    secret: 'mysecretkey',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 }
  })
);

function getMenusByRole(role) {
  const allMenus = [
    { name: 'Dashboard', url: '/main', icon: '📊', roles: ['admin', 'staff', 'customer'] },
    { name: 'Master Produk', url: '/products', icon: '📦', roles: ['admin', 'staff'] },
    { name: 'Pesanan', url: '/orders', icon: '🛒', roles: ['admin', 'staff', 'customer'] },
    { name: 'Laporan', url: '/reports', icon: '📈', roles: ['admin'] },
    { name: 'Logout', url: '/logout', icon: '🚪', roles: ['admin', 'staff', 'customer'] }
  ];
  return allMenus.filter(m => m.roles.includes(role));
}

function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session.user) return res.redirect('/login');
    if (!roles.includes(req.session.user.role)) return res.status(403).send('Forbidden');
    next();
  };
}

function isAdminStaff(user) {
  return user && (user.role === 'admin' || user.role === 'staff');
}

// Status helpers (match DB ENUM, including space in 'menunggu pembayaran')
const ORDER_STATUS_VALUES = ['pending','diproses','pengiriman','selesai','menunggu pembayaran'];
function canonicalStatus(input) {
  if (!input) return null;
  // Accept underscores and spaces, then match DB enum values
  let v = String(input).toLowerCase().replace(/_/g, ' ');
  v = v.replace(/\s+/g, ' ').trim();
  return ORDER_STATUS_VALUES.includes(v) ? v : null;
}

// Routes - static pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/main');
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Register (public)
app.get('/register', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.post('/register', async (req, res) => {
  const { username, password, confirm, nama, email, no_hp, alamat } = req.body;
  if (!username || !password || !confirm || !nama) {
    return res.redirect('/register?error=Field%20wajib:%20username,%20password,%20confirm,%20nama');
  }
  if (password !== confirm) {
    return res.redirect('/register?error=Password%20dan%20konfirmasi%20tidak%20cocok');
  }
  // Cek duplikat username
  query('SELECT id FROM users WHERE username = ?', [username]).then(async (rows) => {
    if (rows && rows.length) return res.redirect('/register?error=Username%20sudah%20dipakai');
    try {
      const hash = await bcrypt.hash(password, 10);
      query('INSERT INTO users (username,password,role,nama,email,no_hp,alamat) VALUES (?,?,?,?,?,?,?)',
        [username, hash, 'customer', nama, email || null, no_hp || null, alamat || null])
        .then(() => {
          return res.redirect('/login?success=Registrasi%20berhasil,%20silakan%20login');
        })
        .catch((e2) => {
          console.error(e2);
          return res.redirect('/register?error=Gagal%20register');
        });
    } catch (e) {
      console.error(e);
      return res.redirect('/register?error=Kesalahan%20server');
    }
  }).catch((err) => {
    console.error(err);
    return res.redirect('/register?error=Kesalahan%20server');
  });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.redirect('/login?error=Username%20dan%20password%20wajib%20diisi');
  }
  query('SELECT * FROM users WHERE username = ?', [username]).then(async (results) => {
    const user = results && results[0];
    if (!user) {
      return res.redirect('/login?error=Username%20atau%20password%20salah');
    }
    let ok = false;
    if (String(user.password || '').startsWith('$2')) {
      try { ok = await bcrypt.compare(password, user.password); } catch { ok = false; }
    } else {
      ok = (user.password === password);
    }
    if (!ok) {
      return res.redirect('/login?error=Username%20atau%20password%20salah');
    }
    req.session.user = { id: user.id, username: user.username, role: user.role, nama: user.nama };
    if (user.role === 'admin' || user.role === 'staff') return res.redirect('/dashboard');
    return res.redirect('/');
  }).catch((err) => {
    console.error('DB error:', err);
    return res.redirect('/login?error=Kesalahan%20server');
  });
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

app.get('/main', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'main.html'));
});

app.get('/dashboard', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/products', requireRole('admin', 'staff'), (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'products.html'));
});

app.get('/products/add', requireRole('admin', 'staff'), (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'products_add.html'));
});

app.get('/products/edit', requireRole('admin', 'staff'), (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'products_edit.html'));
});

app.post('/products/add', requireRole('admin', 'staff'), (req, res) => {
  const { nama_produk, deskripsi, harga, satuan } = req.body;
  if (!nama_produk || !harga || !satuan) {
    return res.redirect('/products/add?error=Nama%2C%20harga%2C%20satuan%20wajib');
  }
  db.query(
    'INSERT INTO products (nama_produk, deskripsi, harga, satuan) VALUES (?, ?, ?, ?)',
    [nama_produk.trim(), deskripsi || null, Number(harga), satuan.trim()],
    (err) => {
      if (err) {
        console.error('Error adding product:', err);
        return res.redirect('/products/add?error=Gagal%20menambah%20produk');
      }
      res.redirect('/products');
    }
  );
});

app.get('/orders', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'orders.html'));
});

app.get('/orders/edit', requireLogin, (req, res) => {
  // Only admin can access edit page
  if (!req.session.user || req.session.user.role !== 'admin') return res.redirect('/orders');
  res.sendFile(path.join(__dirname, 'public', 'orders_edit.html'));
});

app.get('/cart', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cart.html'));
});

app.get('/reports', requireRole('admin'), (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'reports.html'));
});

// Admin Users pages
app.get('/users', requireRole('admin'), (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'users.html'));
});
app.get('/users/edit', requireRole('admin'), (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'users_edit.html'));
});

// API endpoints
// Current user
app.get('/api/me', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });
  res.json({ user: req.session.user });
});

// Menus by role
app.get('/api/menus', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });
  res.json({ menus: getMenusByRole(req.session.user.role) });
});

// Admin Users APIs
app.get('/api/users', requireRole('admin'), (req, res) => {
  const q = req.query || {};
  const where = [];
  const params = [];
  if (q.username) { where.push('username LIKE ?'); params.push(`%${q.username}%`); }
  if (q.nama) { where.push('nama LIKE ?'); params.push(`%${q.nama}%`); }
  let sql = 'SELECT id, username, role, nama, email, no_hp, alamat, created_at FROM users';
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY id ASC';
  db.query(sql, params, (err, rows) => {
    if (err) { console.error(err); return res.status(500).json({ error: 'DB error' }); }
    res.json({ users: rows });
  });
});

app.get('/api/users/:id', requireRole('admin'), (req, res) => {
  const id = Number(req.params.id);
  db.query('SELECT id, username, role, nama, email, no_hp, alamat FROM users WHERE id=?', [id], (err, rows) => {
    if (err) { console.error(err); return res.status(500).json({ error: 'DB error' }); }
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ user: rows[0] });
  });
});

app.put('/api/users/:id', requireRole('admin'), async (req, res) => {
  const id = Number(req.params.id);
  let { username, role, nama, email, no_hp, alamat, password } = req.body;
  username = (username || '').trim();
  role = (role || '').trim();
  if (!username || !nama) return res.status(400).json({ error: 'Username dan nama wajib' });
  const allowedRoles = ['admin','staff','customer'];
  if (role && !allowedRoles.includes(role)) return res.status(400).json({ error: 'Role invalid' });
  // Check duplicate username (other users)
  db.query('SELECT id FROM users WHERE username = ? AND id <> ?', [username, id], async (e1, r1) => {
    if (e1) { console.error(e1); return res.status(500).json({ error: 'DB error' }); }
    if (r1 && r1.length) return res.status(400).json({ error: 'Username sudah dipakai' });
    const fields = ['username = ?','nama = ?','email = ?','no_hp = ?','alamat = ?'];
    const values = [username, nama, email || null, no_hp || null, alamat || null];
    if (role) { fields.push('role = ?'); values.push(role); }
    if (password) {
      try {
        const hash = await bcrypt.hash(password, 10);
        fields.push('password = ?'); values.push(hash);
      } catch (e) { console.error(e); return res.status(500).json({ error: 'Hash error' }); }
    }
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    values.push(id);
    db.query(sql, values, (e2, r2) => {
      if (e2) { console.error(e2); return res.status(500).json({ error: 'DB error' }); }
      if (r2.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
      res.json({ ok: true });
    });
  });
});

app.delete('/api/users/:id', requireRole('admin'), (req, res) => {
  const id = Number(req.params.id);
  // Optional: prevent self-delete
  if (req.session.user && req.session.user.id === id) {
    return res.status(400).json({ error: 'Tidak bisa menghapus diri sendiri' });
  }
  db.query('DELETE FROM users WHERE id = ?', [id], (err, r) => {
    if (err) { console.error(err); return res.status(500).json({ error: 'DB error' }); }
    res.json({ ok: true });
  });
});

// Admin/staff products list
app.get('/api/products', requireRole('admin', 'staff'), (req, res) => {
  const search = (req.query.search || '').trim();
  let sql = 'SELECT * FROM products';
  const params = [];
  const status = (req.query.status || '').trim();
  const wheres = [];
  if (search) {
    wheres.push('nama_produk LIKE ?');
    params.push(`%${search}%`);
  }
  if (status && ['active','inactive'].includes(status)) {
    wheres.push('status = ?');
    params.push(status);
  }
  if (wheres.length) sql += ' WHERE ' + wheres.join(' AND ');
  sql += ' ORDER BY id ASC';
  db.query(sql, params, (err, results) => {
    if (err) {
      console.error('DB error:', err);
      return res.status(500).json({ error: 'DB error' });
    }
    res.json({ products: results });
  });
});

// Get single product
app.get('/api/products/:id', requireRole('admin', 'staff'), (req, res) => {
  const id = Number(req.params.id);
  db.query('SELECT * FROM products WHERE id = ?', [id], (err, rows) => {
    if (err) {
      console.error('DB error:', err);
      return res.status(500).json({ error: 'DB error' });
    }
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ product: rows[0] });
  });
});

// Update product
app.put('/api/products/:id', requireRole('admin', 'staff'), (req, res) => {
  const id = Number(req.params.id);
  let { nama_produk, deskripsi, harga, satuan, status } = req.body;
  nama_produk = (nama_produk || '').trim();
  satuan = (satuan || '').trim();
  const allowedStatus = ['active','inactive'];
  if (!nama_produk || !satuan || isNaN(Number(harga))) {
    return res.status(400).json({ error: 'Nama, harga, dan satuan wajib diisi' });
  }
  if (status && !allowedStatus.includes(status)) status = 'active';
  db.query(
    'UPDATE products SET nama_produk=?, deskripsi=?, harga=?, satuan=?, status=? WHERE id=?',
    [nama_produk, deskripsi || null, Number(harga), satuan, status || 'active', id],
    (err, result) => {
      if (err) {
        console.error('DB error:', err);
        return res.status(500).json({ error: 'DB error' });
      }
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
      res.json({ ok: true });
    }
  );
});

// Delete product (will fail if referenced by order_items due to FK)
app.delete('/api/products/:id', requireRole('admin', 'staff'), (req, res) => {
  const id = Number(req.params.id);
  db.query('DELETE FROM products WHERE id = ?', [id], (err, result) => {
    if (err) {
      // Likely FK constraint
      console.error('DB error:', err);
      return res.status(400).json({ error: 'Gagal hapus. Produk mungkin dipakai pada pesanan.' });
    }
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  });
});

// Cart APIs (login required to add/clear/checkout; view allowed for logged-in)
app.get('/api/cart', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });
  const cart = req.session.cart || [];
  if (cart.length === 0) return res.json({ items: [], total: 0 });
  const ids = cart.map(c => c.product_id);
  const placeholders = ids.map(() => '?').join(',');
  db.query(`SELECT id, nama_produk, harga, satuan FROM products WHERE id IN (${placeholders})`, ids, (err, rows) => {
    if (err) {
      console.error('DB error:', err);
      return res.status(500).json({ error: 'DB error' });
    }
    const map = new Map(rows.map(r => [r.id, r]));
    let total = 0;
    const items = cart.map(ci => {
      const p = map.get(ci.product_id);
      const line = p ? Number(p.harga) * Number(ci.qty) : 0;
      total += line;
      return { product_id: ci.product_id, qty: ci.qty, product: p || null, line_total: line };
    });
    res.json({ items, total });
  });
});

app.post('/api/cart/add', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });
  const { product_id, qty } = req.body;
  const pid = Number(product_id);
  const q = Math.max(1, Number(qty || 1));
  if (!pid || q < 1) return res.status(400).json({ error: 'Invalid payload' });
  const cart = req.session.cart || [];
  const found = cart.find(c => c.product_id === pid);
  if (found) found.qty += q; else cart.push({ product_id: pid, qty: q });
  req.session.cart = cart;
  res.json({ ok: true, cart_count: cart.reduce((a,b)=>a+b.qty,0) });
});

app.post('/api/cart/clear', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });
  req.session.cart = [];
  res.json({ ok: true });
});

// Orders APIs
// List orders (customer: own orders; admin/staff: all orders)
app.get('/api/orders', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });
  const user = req.session.user;
  let sql = `SELECT o.*, u.nama AS customer_nama FROM orders o JOIN users u ON u.id = o.customer_id`;
  const params = [];
  if (user.role === 'customer') {
    sql += ' WHERE o.customer_id = ? ORDER BY o.id DESC';
    params.push(user.id);
  } else {
    sql += ' ORDER BY o.id DESC';
  }
  db.query(sql, params, (err, rows) => {
    if (err) {
      console.error('DB error:', err);
      return res.status(500).json({ error: 'DB error' });
    }
    res.json({ orders: rows });
  });
});

// Get single order (basic fields)
app.get('/api/orders/:id', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });
  const id = Number(req.params.id);
  const user = req.session.user;
  let sql = `SELECT o.*, u.nama AS customer_nama FROM orders o JOIN users u ON u.id = o.customer_id WHERE o.id = ?`;
  const params = [id];
  // Customers can only view their own order
  if (user.role === 'customer') {
    sql += ' AND o.customer_id = ?';
    params.push(user.id);
  }
  db.query(sql, params, (err, rows) => {
    if (err) {
      console.error('DB error:', err);
      return res.status(500).json({ error: 'DB error' });
    }
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ order: rows[0] });
  });
});

// Get items of an order
app.get('/api/orders/:id/items', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });
  const id = Number(req.params.id);
  const user = req.session.user;
  let sql = `SELECT oi.*, p.nama_produk, (oi.jumlah * oi.harga_satuan) AS line_total
             FROM order_items oi
             JOIN orders o ON o.id = oi.order_id
             JOIN products p ON p.id = oi.product_id
             WHERE oi.order_id = ?`;
  const params = [id];
  if (user.role === 'customer') {
    sql += ' AND o.customer_id = ?';
    params.push(user.id);
  }
  db.query(sql, params, (err, rows) => {
    if (err) {
      console.error('DB error:', err);
      return res.status(500).json({ error: 'DB error' });
    }
    res.json({ items: rows });
  });
});

// Checkout: create order from cart (customer only)
app.post('/api/orders/checkout', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });
  const user = req.session.user;
  if (user.role !== 'customer') return res.status(403).json({ error: 'Forbidden' });
  const cart = req.session.cart || [];
  if (cart.length === 0) return res.status(400).json({ error: 'Cart is empty' });
  const ids = cart.map(c => c.product_id);
  const placeholders = ids.map(() => '?').join(',');
  db.query(`SELECT id, harga FROM products WHERE id IN (${placeholders})`, ids, (err, rows) => {
    if (err) {
      console.error('DB error:', err);
      return res.status(500).json({ error: 'DB error' });
    }
    const priceMap = new Map(rows.map(r => [r.id, Number(r.harga)]));
    let subtotal = 0;
    cart.forEach(ci => {
      const price = priceMap.get(ci.product_id) || 0;
      subtotal += price * Number(ci.qty);
    });
    const biaya_tambahan = 0;
    const diskon = 0;
    const total = subtotal + biaya_tambahan - diskon;
    const orderNumber = `ORDER-${Date.now().toString().slice(-6)}`;

    db.query(
      'INSERT INTO orders (order_number, customer_id, subtotal, biaya_tambahan, diskon, total_harga, status, tanggal_pesan) VALUES (?,?,?,?,?,?,?, CURDATE())',
      [orderNumber, user.id, subtotal, biaya_tambahan, diskon, total, 'pending'],
      (err2, result) => {
        if (err2) {
          console.error('DB error:', err2);
          return res.status(500).json({ error: 'DB error' });
        }
        const orderId = result.insertId;
        // Build bulk insert with explicit placeholders to work with prepared statements
        const tuples = cart.map(ci => [orderId, ci.product_id, ci.qty, priceMap.get(ci.product_id) || 0]);
        const placeholders = tuples.map(() => '(?,?,?,?)').join(',');
        const flatParams = tuples.flat();
        const sql = `INSERT INTO order_items (order_id, product_id, jumlah, harga_satuan) VALUES ${placeholders}`;
        db.query(sql, flatParams, (err3) => {
          if (err3) {
            console.error('DB error:', err3);
            return res.status(500).json({ error: 'DB error' });
          }
          req.session.cart = [];
          res.json({ ok: true, order_id: orderId, order_number: orderNumber });
        });
      }
    );
  });
});

// Update order status (admin/staff)
app.put('/api/orders/:id/status', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });
  if (!isAdminStaff(req.session.user)) return res.status(403).json({ error: 'Forbidden' });
  const id = Number(req.params.id);
const normalized = canonicalStatus(req.body.status);
  if (!normalized) return res.status(400).json({ error: 'Invalid status' });
  db.query('UPDATE orders SET status = ? WHERE id = ?', [normalized, id], (err) => {
    if (err) {
      console.error('DB error:', err);
      return res.status(500).json({ error: 'DB error' });
    }
    res.json({ ok: true });
  });
});

// Delete order (admin only)
app.delete('/api/orders/:id', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.session.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const id = Number(req.params.id);
  db.query('DELETE FROM orders WHERE id = ?', [id], (err) => {
    if (err) {
      console.error('DB error:', err);
      return res.status(500).json({ error: 'DB error' });
    }
    res.json({ ok: true });
  });
});

// Update order fields (admin only; not id/order_number)
app.put('/api/orders/:id', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.session.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const id = Number(req.params.id);
let { status, tanggal_pesan, tanggal_selesai, biaya_tambahan, diskon, catatan } = req.body;
  const normStatus = status ? canonicalStatus(status) : null;
  if (status && !normStatus) return res.status(400).json({ error: 'Invalid status' });

  // Build dynamic update
  const fields = [];
  const values = [];
  if (normStatus) { fields.push('status = ?'); values.push(normStatus); }
  if (tanggal_pesan) { fields.push('tanggal_pesan = ?'); values.push(tanggal_pesan); }
  if (tanggal_selesai !== undefined) { fields.push('tanggal_selesai = ?'); values.push(tanggal_selesai || null); }
  if (biaya_tambahan !== undefined) { fields.push('biaya_tambahan = ?'); values.push(Number(biaya_tambahan) || 0); }
  if (diskon !== undefined) { fields.push('diskon = ?'); values.push(Number(diskon) || 0); }
  if (catatan !== undefined) { fields.push('catatan = ?'); values.push(catatan || null); }

  if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });
  const sql = `UPDATE orders SET ${fields.join(', ')} WHERE id = ?`;
  values.push(id);
  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('DB error:', err);
      return res.status(500).json({ error: 'DB error' });
    }
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  });
});

// Admin: fix empty order statuses to 'pending'
app.post('/api/admin/fix-empty-order-status', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.session.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  db.query("UPDATE orders SET status='pending' WHERE status='' OR status IS NULL", (err, result) => {
    if (err) {
      console.error('DB error:', err);
      return res.status(500).json({ error: 'DB error' });
    }
    res.json({ ok: true, affected: result.affectedRows || 0 });
  });
});

// Dashboard summary (admin only)
app.get('/api/dashboard/summary', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.session.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const q1 = `SELECT status, COUNT(*) AS cnt FROM orders GROUP BY status`;
  const q2 = `SELECT COUNT(*) AS total_orders FROM orders`;
  const q3 = `SELECT COALESCE(SUM(total_harga),0) AS revenue_today FROM orders WHERE tanggal_pesan = CURDATE()`;
  db.query(q1, (e1, r1) => {
    if (e1) { console.error(e1); return res.status(500).json({ error: 'DB error' }); }
    db.query(q2, (e2, r2) => {
      if (e2) { console.error(e2); return res.status(500).json({ error: 'DB error' }); }
      db.query(q3, (e3, r3) => {
        if (e3) { console.error(e3); return res.status(500).json({ error: 'DB error' }); }
        res.json({
          by_status: r1,
          total_orders: (r2 && r2[0] && r2[0].total_orders) || 0,
          revenue_today: (r3 && r3[0] && r3[0].revenue_today) || 0
        });
      });
    });
  });
});

// Reports: sales by date range (admin only)
app.get('/api/reports/sales', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.session.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { start, end } = req.query;

  function toDateStr(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${da}`;
  }

  let startDate = start;
  let endDate = end;
  if (!startDate || !endDate) {
    const today = new Date();
    const past = new Date();
    past.setDate(today.getDate() - 30);
    startDate = toDateStr(past);
    endDate = toDateStr(today);
  }

  const sql = `
    SELECT 
      o.id, o.order_number, o.tanggal_pesan, o.status,
      u.nama AS customer_nama,
      COALESCE(SUM(oi.jumlah * oi.harga_satuan), 0) AS total_items,
      o.biaya_tambahan, o.diskon, o.total_harga
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    JOIN users u ON u.id = o.customer_id
    WHERE o.tanggal_pesan BETWEEN ? AND ?
    GROUP BY o.id, o.order_number, o.tanggal_pesan, o.status, u.nama, o.biaya_tambahan, o.diskon, o.total_harga
    ORDER BY o.tanggal_pesan ASC, o.id ASC
  `;

  db.query(sql, [startDate, endDate], (err, rows) => {
    if (err) {
      console.error('DB error:', err);
      return res.status(500).json({ error: 'DB error' });
    }
    res.json({ start: startDate, end: endDate, rows });
  });
});

// Public products (active only) for landing page
app.get('/api/public/products', (req, res) => {
  query("SELECT id, nama_produk, deskripsi, harga, satuan, status FROM products WHERE status = 'active' ORDER BY id DESC").then((results) => {
    res.json({ products: results });
  }).catch((err) => {
    console.error('DB error:', err);
    return res.status(500).json({ error: 'DB error' });
  });
});

app.listen(PORT, () => {
  console.log(`🚀 PKM Percetakan running at http://localhost:${PORT}`);
});