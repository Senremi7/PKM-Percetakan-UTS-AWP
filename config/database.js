const mysql = require('mysql2');

// Konfigurasi database dengan fallback values
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'percetakan',
  
  // Pengaturan untuk menangani timeout dan reconnection
  connectionLimit: 10,           // Maksimal 10 koneksi dalam pool
  acquireTimeout: 60000,        // 60 detik timeout untuk mendapatkan koneksi
  timeout: 60000,                // 60 detik timeout untuk query
  reconnect: true,               // Otomatis reconnect jika koneksi terputus
  idleTimeout: 300000,           // 5 menit idle timeout
  maxReconnects: 3,             // Maksimal 3 kali reconnect
  
  // Pengaturan MySQL untuk mencegah timeout
  wait_timeout: 28800,          // 8 jam wait timeout
  interactive_timeout: 28800,    // 8 jam interactive timeout
  
  // Pengaturan untuk menjaga koneksi tetap hidup
  keepAliveInitialDelay: 0,
  enableKeepAlive: true,
  
  // Pengaturan charset
  charset: 'utf8mb4',
  
  // Pengaturan SSL (opsional)
  ssl: false
};

// Buat connection pool
const pool = mysql.createPool(dbConfig);

// Event handlers untuk monitoring koneksi
pool.on('connection', (connection) => {
  console.log('New MySQL connection established');
});

pool.on('error', (err) => {
  console.error('MySQL pool error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('MySQL connection lost, will reconnect automatically');
  }
});

// Test koneksi awal
pool.getConnection((err, connection) => {
  if (err) {
    console.error("Koneksi Gagal:", err);
  } else {
    console.log('Connected to MySQL database');
    connection.release();
  }
});

// Fungsi untuk test koneksi secara berkala
setInterval(() => {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Connection test failed:', err);
    } else {
      connection.ping((err) => {
        if (err) {
          console.error('Ping failed:', err);
        } else {
          console.log('MySQL connection is alive');
        }
        connection.release();
      });
    }
  });
}, 300000); // Test setiap 5 menit

// Fungsi untuk mendapatkan koneksi dengan error handling
const getConnection = () => {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error getting connection:', err);
        reject(err);
      } else {
        resolve(connection);
      }
    });
  });
};

// Fungsi untuk menjalankan query dengan error handling
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    pool.execute(sql, params, (err, results, fields) => {
      if (err) {
        console.error('Query error:', err);
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

// Fungsi untuk menjalankan query dengan connection
const queryWithConnection = (connection, sql, params = []) => {
  return new Promise((resolve, reject) => {
    connection.execute(sql, params, (err, results, fields) => {
      if (err) {
        console.error('Query error:', err);
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

module.exports = {
  pool,
  getConnection,
  query,
  queryWithConnection
};
