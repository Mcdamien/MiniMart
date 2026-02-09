const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 5000;

// HELPER: Generate Batch ID (Format: B + DDMMYY + 4 Alphanumeric)
const generateBatchID = () => {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yy = String(now.getFullYear()).slice(-2);
  
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let random = '';
  for (let i = 0; i < 4; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return `B${dd}${mm}${yy}${random}`;
};

// HELPER: Generate Transaction ID (Prefix + DDMMYY + 3 Alphanumeric)
// Usage: STR, ETR, ITR
const generateTransactionID = (prefix) => {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yy = String(now.getFullYear()).slice(-2);
  
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let random = '';
  for (let i = 0; i < 3; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return `${prefix}${dd}${mm}${yy}${random}`;
};

// Helper: Generate Short Barcode (BAR + 5 Alphanumeric)
const generateShortBarcode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'BAR-';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Middleware
app.use(cors());
app.use(bodyParser.json());

// 1. DATABASE CONNECTION
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'minimart_db',
  password: 'm1n1m@rt',
  port: 5432,
});

// Test DB Connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error('Database connection error', err.stack);
  else console.log('Database connected successfully at', res.rows[0].now);
});

// --- ROUTES ---

// 2. GET ALL PRODUCTS
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// 3. ADD/UPDATE PRODUCT (Single Item - Used by Manual Entry)
app.post('/api/products', async (req, res) => {
  const { name, barcode, price, cost, quantity } = req.body;
  
  try {
    let finalBarcode = barcode;
    if (!finalBarcode || finalBarcode.trim() === '') {
      finalBarcode = generateShortBarcode();
    }

    const checkResult = await pool.query('SELECT * FROM products WHERE barcode = $1', [finalBarcode]);

    if (checkResult.rows.length > 0) {
      // Update existing (Keep original Batch ID)
      const updateQuery = `
        UPDATE products 
        SET name = $1, price = $2, cost = $3, quantity = quantity + $4 
        WHERE barcode = $5
        RETURNING *`;
      const values = [name, price, cost, quantity, finalBarcode];
      const result = await pool.query(updateQuery, values);
      res.json(result.rows[0]);
    } else {
      // Insert new (Generate NEW Batch ID)
      const batchId = generateBatchID(); 
      const dateAdded = new Date().toISOString();

      const insertQuery = `
        INSERT INTO products (name, barcode, price, cost, quantity, inventory_id, date_added) 
        VALUES ($1, $2, $3, $4, $5, $6, $7) 
        RETURNING *`;
      const values = [name, finalBarcode, price, cost, quantity, batchId, dateAdded];
      const result = await pool.query(insertQuery, values);
      res.json(result.rows[0]);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// NEW: UPDATE SPECIFIC PRODUCT BY ID (Fixes Inventory.jsx Update Button)
app.put('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const { name, barcode, price, cost, quantity } = req.body;
  try {
    const result = await pool.query(
      'UPDATE products SET name = $1, barcode = $2, price = $3, cost = $4, quantity = $5 WHERE id = $6 RETURNING *',
      [name, barcode, price, cost, quantity, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// 4. BULK IMPORT (Assigns SINGLE Batch ID to all items in file)
app.post('/api/products/import', async (req, res) => {
  const { items } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const currentBatchID = generateBatchID(); // ONE BATCH FOR ALL

    for (const item of items) {
      let itemBarcode = (item.barcode || '').trim();
      if (!itemBarcode) itemBarcode = generateShortBarcode();
      const dateAdded = new Date().toISOString();

      const queryText = `
        INSERT INTO products (name, barcode, price, cost, quantity, inventory_id, date_added)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (barcode) 
        DO UPDATE SET 
          name = EXCLUDED.name,
          price = EXCLUDED.price,
          cost = EXCLUDED.cost,
          quantity = products.quantity + EXCLUDED.quantity,
          inventory_id = products.inventory_id -- Preserve original batch ID on conflict
      `;
      
      await client.query(queryText, [
        item.name, itemBarcode, item.price, item.cost || 0, item.quantity || 0, currentBatchID, dateAdded
      ]);
    }

    await client.query('COMMIT');
    res.json({ success: true, batchId: currentBatchID, message: `${items.length} items imported under Batch: ${currentBatchID}.` });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
    res.status(500).json({ success: false, error: e.message });
  } finally {
    client.release();
  }
});

// 5. CHECKOUT (Uses STR prefix and saves to transaction_id)
app.post('/api/checkout', async (req, res) => {
  const { items } = req.body;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const total = items.reduce((acc, item) => acc + (item.price * item.qty), 0);

    // GENERATE TRANSACTION ID (Prefix STR)
    const transactionId = generateTransactionID('STR'); 

    // FIXED: Using 'transaction_id' column instead of invoice_id
    const saleRes = await client.query(
      'INSERT INTO sales (total_amount, transaction_id) VALUES ($1, $2) RETURNING id', 
      [total, transactionId]
    );
    const saleId = saleRes.rows[0].id;

    console.log("Sale inserted with Transaction ID:", transactionId);

    for (const item of items) {
      await client.query(
        'INSERT INTO sale_items (sale_id, product_id, qty, price_at_sale) VALUES ($1, $2, $3, $4)',
        [saleId, item.id, item.qty, item.price]
      );

      const updateStock = await client.query(
        'UPDATE products SET quantity = quantity - $1 WHERE id = $2',
        [item.qty, item.id]
      );

      if (updateStock.rowCount === 0) {
        throw new Error(`Stock error for product ${item.name}`);
      }
    }

    await client.query('COMMIT');
    
    // FIXED: Returning 'transactionId' key to match the new logic
    res.json({ success: true, saleId, total, transactionId });

  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
    res.status(500).json({ success: false, error: e.message });
  } finally {
    client.release();
  }
});

// 6. ACCOUNTING: ADD EXPENSE (Uses ETR prefix)
app.post('/api/expenses', async (req, res) => {
  const { description, amount } = req.body;
  
  try {
    // GENERATE TRANSACTION ID (Prefix ETR)
    const transactionId = generateTransactionID('ETR');

    // NOTE: Ensure your 'expenses' table has a 'transaction_id' column.
    const result = await pool.query(
      'INSERT INTO expenses (transaction_id, description, amount) VALUES ($1, $2, $3) RETURNING *',
      [transactionId, description, amount]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// 7. ACCOUNTING: ADD INCOME (Uses ITR prefix) - PREPARED FOR FUTURE USE
app.post('/api/income', async (req, res) => {
  const { description, amount } = req.body;
  
  try {
    // GENERATE TRANSACTION ID (Prefix ITR)
    const transactionId = generateTransactionID('ITR');

    // NOTE: Ensure you have an 'income' table with a 'transaction_id' column.
    const result = await pool.query(
      'INSERT INTO income (transaction_id, description, amount) VALUES ($1, $2, $3) RETURNING *',
      [transactionId, description, amount]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

app.get('/api/accounting/profit-loss', async (req, res) => {
  try {
    const revResult = await pool.query(`
      SELECT COALESCE(SUM(si.qty * (si.price_at_sale - p.cost)), 0) as revenue
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
    `);
    const expResult = await pool.query('SELECT COALESCE(SUM(amount), 0) as expenses FROM expenses');
    const revenue = parseFloat(revResult.rows[0].revenue);
    const expenses = parseFloat(expResult.rows[0].expenses);
    res.json({ revenue, expenses, profit: revenue - expenses });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// --- NEW ROUTE: GET ITEMS BY BATCH ID (For Batch Transaction Receipt) ---
app.get('/api/batch-items/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;
    
    // Fetch all items belonging to this batch
    const query = `
      SELECT * FROM products 
      WHERE inventory_id = $1
      ORDER BY id ASC
    `;
    
    const result = await pool.query(query, [batchId]);
    
    // Map results to match the expected frontend structure
    const items = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      barcode: row.barcode,
      price: row.price,
      cost: row.cost,
      quantity: row.quantity
    }));

    res.json(items);
  } catch (err) {
    console.error("BATCH ITEMS ERROR:", err);
    res.status(500).send('Server Error: ' + err.message);
  }
});

// --- NEW ROUTE: GET ALL BATCHES (Summarized) ---
app.get('/api/batches', async (req, res) => {
  try {
    const query = `
      SELECT 
        inventory_id as batch_id, 
        DATE(date_added) as date,
        SUM(price * quantity) as total_price,
        SUM(cost * quantity) as total_cost
      FROM products
      WHERE inventory_id IS NOT NULL
      GROUP BY inventory_id, DATE(date_added)
      ORDER BY date DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// DASHBOARD ROUTES
app.get('/api/dashboard/low-stock', async (req, res) => {
  try {
    const query = 'SELECT name, quantity FROM products WHERE quantity <= 10 ORDER BY quantity ASC';
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

app.get('/api/dashboard/stats/:period', async (req, res) => {
  const { period } = req.params;
  let query = '';
  if (period === 'daily') {
    query = 'SELECT COALESCE(SUM(total_amount), 0) as total_sales, COUNT(id) as total_orders FROM sales WHERE DATE(sale_time) = CURRENT_DATE';
  } else if (period === 'monthly') {
    query = 'SELECT COALESCE(SUM(total_amount), 0) as total_sales, COUNT(id) as total_orders FROM sales WHERE DATE_TRUNC(\'month\', sale_time) = DATE_TRUNC(\'month\', CURRENT_DATE)';
  } else if (period === 'yearly') {
    query = 'SELECT COALESCE(SUM(total_amount), 0) as total_sales, COUNT(id) as total_orders FROM sales WHERE EXTRACT(YEAR FROM sale_time) = EXTRACT(YEAR FROM CURRENT_DATE)';
  }
  try {
    const result = await pool.query(query);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// --- NEW ROUTE: GET ALL SALES TRANSACTIONS (For Dashboard History) ---
app.get('/api/sales/all', async (req, res) => {
  try {
    // Correctly using s.transaction_id
    const query = `
      SELECT s.id, s.transaction_id, s.total_amount, s.sale_time
      FROM sales s
      ORDER BY s.sale_time DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

app.get('/api/dashboard/recent-sales', async (req, res) => {
  try {
    // FIXED: Changed 's.invoice_id' to 's.transaction_id' to match new column
    const query = `
      SELECT s.id, s.transaction_id, s.total_amount, s.sale_time,
      COALESCE(SUM(si.qty * (si.price_at_sale - p.cost)), 0) as total_revenue
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.sale_id
      LEFT JOIN products p ON si.product_id = p.id
      GROUP BY s.id ORDER BY s.sale_time DESC LIMIT 10
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

app.get('/api/dashboard/best-seller', async (req, res) => {
  try {
    const query = `
      SELECT p.name, SUM(si.qty) as total_sold
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      GROUP BY p.id, p.name
      ORDER BY total_sold DESC LIMIT 1
    `;
    const result = await pool.query(query);
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// --- GET ITEMS FOR A SPECIFIC SALE (Used for Reprint Details) ---
app.get('/api/sales/:saleId/items', async (req, res) => {
  try {
    const { saleId } = req.params;
    const query = `
      SELECT si.*, p.name, p.cost
      FROM sale_items si 
      JOIN products p ON si.product_id = p.id 
      WHERE si.sale_id = $1
    `;
    const result = await pool.query(query, [saleId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});