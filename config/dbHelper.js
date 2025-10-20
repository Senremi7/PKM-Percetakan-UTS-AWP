const { pool, query } = require('./database');

// Helper function untuk menangani database operations dengan error handling
class DatabaseHelper {
  
  // Execute query dengan error handling
  static async executeQuery(sql, params = []) {
    try {
      const results = await query(sql, params);
      return { success: true, data: results };
    } catch (error) {
      console.error('Database query error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get connection dengan error handling
  static async getConnection() {
    try {
      const connection = await pool.getConnection();
      return { success: true, connection };
    } catch (error) {
      console.error('Database connection error:', error);
      return { success: false, error: error.message };
    }
  }

  // Execute query dengan connection
  static async executeWithConnection(connection, sql, params = []) {
    try {
      const results = await new Promise((resolve, reject) => {
        connection.execute(sql, params, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });
      return { success: true, data: results };
    } catch (error) {
      console.error('Database query with connection error:', error);
      return { success: false, error: error.message };
    }
  }

  // Release connection
  static releaseConnection(connection) {
    if (connection) {
      connection.release();
    }
  }

  // Test database connection
  static async testConnection() {
    try {
      const result = await this.executeQuery('SELECT 1 as test');
      return result.success;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  // Reconnect database
  static async reconnect() {
    try {
      // Close existing pool
      await pool.end();
      
      // Recreate pool (this would need to be implemented in database.js)
      console.log('Attempting to reconnect to database...');
      return true;
    } catch (error) {
      console.error('Database reconnection failed:', error);
      return false;
    }
  }
}

module.exports = DatabaseHelper;
