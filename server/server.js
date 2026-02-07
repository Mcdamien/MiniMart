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

// Define generateID to fix undefined error
const generateID = (prefix) => {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yy = String(now.getFullYear()).slice(-2);

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let random = '';
  for (let i = 0; i < 4; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `${prefix}${dd}${mm}${yy}${random}`;
};

// HELPER: Generate Receipt ID (RCPTDDMMYYXXXX)
const generateReceiptID = () => {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yy = String(now.getFullYear()).slice(-2); // Last 2 digits for receipt
  const random = Math.floor(1000 + Math.random() * 9000);
  return `RCPT${dd}${mm}${yy}${random}`;
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
// Update 'user' and 'password' if your PostgreSQL setup is different
const pool = new Pool({
  user: 'postgres',        // default postgres user
  host: 'localhost',
  database: 'minimart_db', // The DB we created in Step 1
  password: 'm1n1m@rt',    // PUT YOUR POSTGRES PASSWORD HERE
  port: 5432,
});

// Test DB Connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error('Database connection error', err.stack);
  else console.log('Database connected successfully at', res.rows[0].now);
});

// --- ROUTES ---

// 2. GET ALL PRODUCTS (Used by Inventory & POS)
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// 3. ADD/UPDATE PRODUCT (Single Item)
app.post('/api/products', async (req, res) => {
  const { name, barcode, price, cost, quantity } = req.body;
  
  try {
    let finalBarcode = barcode;
    if (!finalBarcode || finalBarcode.trim() === '') {
      finalBarcode = generateShortBarcode();
    }

    const checkResult = await pool.query('SELECT * FROM products WHERE barcode = $1', [finalBarcode]);

    if (checkResult.rows.length > 0) {
      // Update existing (Do not change Batch ID)
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
      const batchId = generateBatchID(); // Renamed from generateInventoryID
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

// 4. BULK IMPORT (Assigns SINGLE Batch ID to all items in file)
app.post('/api/products/import', async (req, res) => {
  const { items } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // GENERATE ONE BATCH ID FOR THE WHOLE FILE
    const currentBatchID = generateBatchID(); 

    for (const item of items) {
      let itemBarcode = (item.barcode || '').trim();
      if (!itemBarcode) {
        itemBarcode = generateShortBarcode();
      }

      // Use the SINGLE Batch ID generated above
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
          inventory_id = products.inventory_id -- Keep original Batch ID for updates
      `;
      
      const values = [
        item.name,
        itemBarcode,
        item.price,
        item.cost || 0,
        item.quantity || 0,
        currentBatchID, // <-- The same Batch ID for all items
        dateAdded
      ];

      await client.query(queryText, values);
    }

    await client.query('COMMIT');
    res.json({ success: true, message: `${items.length} items imported under Batch: ${currentBatchID}.` });

  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
    res.status(500).json({ success: false, error: e.message });
  } finally {
    client.release();
  }
});

// 5. CHECKOUT (Uses Receipt ID Helper)
app.post('/api/checkout', async (req, res) => {
  const { items } = req.body;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const total = items.reduce((acc, item) => acc + (item.price * item.qty), 0);

    // Generate RECEIPT ID
    const invoiceId = generateReceiptID(); 

    const saleRes = await client.query(
      'INSERT INTO sales (total_amount, invoice_id) VALUES ($1, $2) RETURNING id', 
      [total, invoiceId]
    );
    const saleId = saleRes.rows[0].id;

    console.log("Sale inserted with ID:", saleId, "and Invoice ID:", invoiceId);
    console.log("Total amount:", total);

    // Debug log to verify the items included in the sale
    console.log("Items in the sale:", items);

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
    res.json({ success: true, saleId, total, invoiceId });

  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
    res.status(500).json({ success: false, error: e.message });
  } finally {
    client.release();
  }
});

// 6. ACCOUNTING: ADD EXPENSE
app.post('/api/expenses', async (req, res) => {
  const { description, amount } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO expenses (description, amount) VALUES ($1, $2) RETURNING *',
      [description, amount]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

app.get('/api/accounting/profit-loss', async (req, res) => {
  try {
    // User definition: Revenue = SUM(qty * (price - cost))
    const revResult = await pool.query(`
      SELECT COALESCE(SUM(si.qty * (si.price_at_sale - p.cost)), 0) as revenue
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
    `);
    
    const expResult = await pool.query('SELECT COALESCE(SUM(amount), 0) as expenses FROM expenses');
    
    const revenue = parseFloat(revResult.rows[0].revenue);
    const expenses = parseFloat(expResult.rows[0].expenses);
    const profit = revenue - expenses;
    
    res.json({ revenue, expenses, profit });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// --- NEW ROUTE: BULK IMPORT ---
app.post('/api/products/import', async (req, res) => {
  const { items } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const item of items) {
      // If no inventory_id provided in Excel, generate one
      const invId = item.inventory_id || generateID('INV');
      const dateAdded = new Date().toISOString(); // Today's Date

      // Insert with Inventory ID and Date
      // If barcode conflicts, update stock but keep original date/id
      const queryText = `
        INSERT INTO products (name, barcode, price, cost, quantity, inventory_id, date_added)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (barcode) 
        DO UPDATE SET 
          name = EXCLUDED.name,
          price = EXCLUDED.price,
          cost = EXCLUDED.cost,
          quantity = products.quantity + EXCLUDED.quantity
      `;
      
      const values = [
        item.name,
        item.barcode,
        item.price,
        item.cost || 0,
        item.quantity || 0,
        invId,
        dateAdded
      ];

      await client.query(queryText, values);
    }

    await client.query('COMMIT');
    res.json({ success: true, message: `{items.length} items imported with IDs and Dates.` });

  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
    res.status(500).json({ success: false, error: e.message });
  } finally {
    client.release();
  }
});

// --- DASHBOARD: LOW STOCK CARD (0 to 10) ---
app.get('/api/dashboard/low-stock', async (req, res) => {
  try {
    // Fetch items with quantity <= 10, sorted by quantity ascending
    const query = 'SELECT name, quantity FROM products WHERE quantity <= 10 ORDER BY quantity ASC';
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// --- DASHBOARD STATS (DYNAMIC PERIOD) ---
app.get('/api/dashboard/stats/:period', async (req, res) => {
  const { period } = req.params;
  let query = '';
  let params = [];

  // Adjust query based on period
  if (period === 'daily') {
    query = `
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_sales, 
        COUNT(id) as total_orders 
      FROM sales 
      WHERE DATE(sale_time) = CURRENT_DATE`;
  } else if (period === 'monthly') {
    query = `
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_sales, 
        COUNT(id) as total_orders 
      FROM sales 
      WHERE DATE_TRUNC('month', sale_time) = DATE_TRUNC('month', CURRENT_DATE)`;
  } else if (period === 'yearly') {
    query = `
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_sales, 
        COUNT(id) as total_orders 
      FROM sales 
      WHERE EXTRACT(YEAR FROM sale_time) = EXTRACT(YEAR FROM CURRENT_DATE)`;
  }

  try {
    const result = await pool.query(query, params);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

app.get('/api/dashboard/recent-sales', async (req, res) => {
  try {
    // Get last 10 sales with total revenue (total_amount - costs)
    const query = `
      SELECT 
        s.id, 
        s.invoice_id, 
        s.total_amount, 
        s.sale_time,
        COALESCE(SUM(si.qty * (si.price_at_sale - p.cost)), 0) as total_revenue
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.sale_id
      LEFT JOIN products p ON si.product_id = p.id
      GROUP BY s.id
      ORDER BY s.sale_time DESC 
      LIMIT 10
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
      SELECT 
        p.name, 
        SUM(si.qty) as total_sold,
        SUM(si.qty * si.price_at_sale) as total_sales,
        SUM(si.qty * (si.price_at_sale - p.cost)) as total_revenue
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      JOIN sales s ON si.sale_id = s.id
      GROUP BY p.id, p.name
      ORDER BY total_revenue DESC
      LIMIT 1
    `;
    const result = await pool.query(query);
    res.json(result.rows[0] || null);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// --- DASHBOARD: INVENTORY BATCH HISTORY ---
// Get list of unique batches
app.get('/api/dashboard/batches', async (req, res) => {
  try {
    const query = `
      SELECT 
        inventory_id, 
        MIN(date_added) as date_added, 
        COUNT(*) as item_count,
        SUM(price * quantity) as total_value
      FROM products 
      WHERE inventory_id IS NOT NULL
      GROUP BY inventory_id 
      ORDER BY date_added DESC 
      LIMIT 20
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get specific items for a batch
app.get('/api/dashboard/batch-items/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;
    const query = 'SELECT * FROM products WHERE inventory_id = $1 ORDER BY id ASC';
    const result = await pool.query(query, [batchId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET items for a specific sale
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
  console.log(`Server running on port {port}`);
});