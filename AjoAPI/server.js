import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'dist')));

// ------------------------------------------------------------------------------------
// DATABASE CONNECTION (STRICT SUPABASE POSTGRESQL)
// ------------------------------------------------------------------------------------
// Clean DATABASE_URL by stripping any accidental newlines or whitespace
const rawDbUrl = process.env.DATABASE_URL ? process.env.DATABASE_URL.trim().replace(/\s+/g, '') : null;

if (!rawDbUrl) {
  console.warn('⚠️ WARNING: DATABASE_URL is not set in Environment Variables. Requests to database endpoints will fail until DATABASE_URL is configured.');
}

const pool = new Pool({
  connectionString: rawDbUrl || 'postgres://localhost:5432/dummy',
  ssl: rawDbUrl ? { rejectUnauthorized: false } : false
});

// Helper function to handle database queries cleanly
async function queryDb(text, params) {
  if (!rawDbUrl) {
    throw new Error('DATABASE_URL environment variable is missing. Please set your Supabase database URI in Vercel Environment Variables or .env file.');
  }
  return await pool.query(text, params);
}


// Log Writer Helper
async function addLog(trxId, logType, url, reqBody, statusCode, resBody, execTime) {
  const reqBodyStr = typeof reqBody === 'object' ? JSON.stringify(reqBody) : reqBody;
  const resBodyStr = typeof resBody === 'object' ? JSON.stringify(resBody) : resBody;

  try {
    await queryDb(
      `INSERT INTO transaction_logs (trx_id, log_type, request_url, request_body, response_status_code, response_body, execution_time) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [trxId, logType, url, reqBodyStr, statusCode, resBodyStr, execTime]
    );
  } catch (err) {
    console.error('Error writing audit log to Supabase:', err.message);
  }
}

// ------------------------------------------------------------------------------------
// REST API ENDPOINTS (STRICT SUPABASE DATA SOURCE)
// ------------------------------------------------------------------------------------

// Health Check
app.get('/api/health', async (req, res) => {
  try {
    await queryDb('SELECT 1');
    res.json({
      status: 'UP',
      database: 'ONLINE (Supabase PostgreSQL)',
      service: 'AjoAPI Web API Engine',
      version: '1.2.0',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      status: 'DOWN',
      database: `ERROR: ${err.message}`,
      service: 'AjoAPI Web API Engine',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/products - Get products list from Supabase
app.get('/api/products', async (req, res) => {
  try {
    const { rows } = await queryDb(
      `SELECT 
        product_code as code, 
        product_name as name, 
        provider, 
        category_code as category, 
        price::int, 
        commission::int, 
        is_active as "isActive" 
       FROM products 
       ORDER BY id ASC`
    );
    res.json({ statusCode: 200, message: 'Success', data: rows });
  } catch (err) {
    res.status(500).json({ statusCode: 500, message: `Supabase Error: ${err.message}` });
  }
});

// GET /api/providers - Get providers list from Supabase
app.get('/api/providers', async (req, res) => {
  try {
    const { rows } = await queryDb(
      `SELECT 
        provider_code as code, 
        provider_name as name, 
        status, 
        balance::int, 
        250 as "avgLatencyMs" 
       FROM providers 
       ORDER BY provider_id ASC`
    );
    res.json({ statusCode: 200, message: 'Success', data: rows });
  } catch (err) {
    res.status(500).json({ statusCode: 500, message: `Supabase Error: ${err.message}` });
  }
});

// POST /api/provider/toggle - Toggle provider maintenance status in Supabase
app.post('/api/provider/toggle', async (req, res) => {
  const { providerCode } = req.body;
  if (!providerCode) {
    return res.status(400).json({ statusCode: 400, message: 'providerCode is required' });
  }

  try {
    const { rows } = await queryDb('SELECT status, provider_name as name FROM providers WHERE provider_code = $1', [providerCode]);
    if (rows.length === 0) {
      return res.status(404).json({ statusCode: 404, message: 'Provider not found in Supabase' });
    }

    const newStatus = rows[0].status === 'ACTIVE' ? 'MAINTENANCE' : 'ACTIVE';
    await queryDb('UPDATE providers SET status = $1 WHERE provider_code = $2', [newStatus, providerCode]);

    res.json({
      statusCode: 200,
      message: `Provider ${rows[0].name} is now ${newStatus}`,
      data: { code: providerCode, status: newStatus }
    });
  } catch (err) {
    res.status(500).json({ statusCode: 500, message: `Supabase Error: ${err.message}` });
  }
});

// POST /api/transaction - Process topup transaction & store in Supabase
app.post('/api/transaction', async (req, res) => {
  const startTime = Date.now();
  const { productCode, destination, createdBy = 'operator1' } = req.body;

  if (!productCode || !destination) {
    await addLog('TRX_ERR', 'MVC_TO_API', '/api/transaction', req.body, 400, { message: 'ProductCode and Destination are required' }, 5);
    return res.status(400).json({ statusCode: 400, message: 'Product Code and Destination are required' });
  }

  const destClean = destination.trim();
  if (!/^0[0-9]{7,12}$/.test(destClean)) {
    await addLog('TRX_ERR', 'MVC_TO_API', '/api/transaction', req.body, 400, { message: 'Invalid destination' }, 5);
    return res.status(400).json({ statusCode: 400, message: 'Destination number must be 8-13 digits starting with 0' });
  }

  try {
    // 1. Fetch Product from Supabase
    const prodRes = await queryDb(
      `SELECT product_code as code, product_name as name, provider, price::int, commission::int, is_active as "isActive" 
       FROM products WHERE product_code = $1`,
      [productCode]
    );

    if (prodRes.rows.length === 0) {
      await addLog('TRX_ERR', 'MVC_TO_API', '/api/transaction', req.body, 400, { message: 'Product not found' }, 5);
      return res.status(400).json({ statusCode: 400, message: `Product code '${productCode}' does not exist in Supabase` });
    }

    const product = prodRes.rows[0];
    if (!product.isActive) {
      await addLog('TRX_ERR', 'MVC_TO_API', '/api/transaction', req.body, 400, { message: 'Product is inactive' }, 5);
      return res.status(400).json({ statusCode: 400, message: 'Product is currently inactive' });
    }

    // 2. Fetch Provider Status from Supabase
    const provRes = await queryDb('SELECT status FROM providers WHERE provider_name = $1', [product.provider]);
    if (provRes.rows.length > 0 && provRes.rows[0].status !== 'ACTIVE') {
      await addLog('TRX_ERR', 'MVC_TO_API', '/api/transaction', req.body, 503, { message: 'Provider under maintenance' }, 10);
      return res.status(503).json({ statusCode: 503, message: `Provider ${product.provider} is currently under maintenance` });
    }

    // 3. Generate TrxId
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const trxId = `TRX${dateStr}${String(Math.floor(Math.random() * 90000) + 10000)}`;

    await addLog(trxId, 'MVC_TO_API', '/api/transaction', req.body, 200, 'Processing', 0);

    // 4. Simulate Provider Processing Delay
    const simulatedDelay = Math.floor(Math.random() * 450) + 150;
    await new Promise(r => setTimeout(r, simulatedDelay));

    const isSuccess = Math.random() < 0.90;
    const executionTime = Date.now() - startTime;
    const serialNumber = isSuccess ? `SN${Math.floor(100000000000 + Math.random() * 900000000000)}` : null;
    const status = isSuccess ? 'SUCCESS' : 'FAILED';
    const providerMessage = isSuccess ? 'Topup berhasil' : 'Gagal: Provider Timeout / Balance Limit';

    const newTrx = {
      trxId,
      productCode: product.code,
      productName: product.name,
      destination: destClean,
      amount: product.price,
      commission: product.commission,
      status,
      providerStatus: status,
      providerMessage,
      serialNumber,
      requestDate: new Date(startTime).toISOString(),
      responseDate: new Date().toISOString(),
      responseTime: executionTime,
      createdBy
    };

    // 5. Store Transaction strictly in Supabase
    await queryDb(
      `INSERT INTO transactions 
        (trx_id, product_code, destination, amount, commission, status, provider_status, provider_message, serial_number, request_date, response_date, response_time, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [trxId, product.code, destClean, product.price, product.commission, status, status, providerMessage, serialNumber, newTrx.requestDate, newTrx.responseDate, executionTime, createdBy]
    );

    await addLog(trxId, 'API_TO_PROVIDER', `/provider/${product.provider.toLowerCase()}/topup`, { trxId, destination: destClean, productCode: product.code }, 200, 'OK', simulatedDelay);
    await addLog(trxId, 'API_RESPONSE', '/api/transaction', '', 200, newTrx, executionTime);

    res.json({
      statusCode: 200,
      message: 'Transaction processed and saved to Supabase successfully',
      data: newTrx
    });
  } catch (err) {
    res.status(500).json({ statusCode: 500, message: `Supabase Error: ${err.message}` });
  }
});

// GET /api/transaction - Fetch transaction history from Supabase with pagination & filters
app.get('/api/transaction', async (req, res) => {
  const { status, productCode, pageNumber = 1, pageSize = 10 } = req.query;
  const page = parseInt(pageNumber);
  const size = parseInt(pageSize);
  const offset = (page - 1) * size;

  try {
    let query = `
      SELECT 
        trx_id as "trxId", 
        product_code as "productCode", 
        destination, 
        amount::int, 
        commission::int, 
        status, 
        provider_status as "providerStatus", 
        provider_message as "providerMessage", 
        serial_number as "serialNumber", 
        request_date as "requestDate", 
        response_date as "responseDate", 
        response_time as "responseTime", 
        created_by as "createdBy" 
      FROM transactions 
      WHERE 1=1`;
    
    const params = [];

    if (status) {
      params.push(status.toUpperCase());
      query += ` AND UPPER(status) = $${params.length}`;
    }
    if (productCode) {
      params.push(productCode);
      query += ` AND product_code = $${params.length}`;
    }

    const countRes = await queryDb(`SELECT COUNT(*) FROM (${query}) as filtered`, params);
    const totalRecords = parseInt(countRes.rows[0].count);

    params.push(size, offset);
    query += ` ORDER BY request_date DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const { rows } = await queryDb(query, params);

    res.json({
      statusCode: 200,
      message: 'Success',
      data: {
        totalRecords,
        pageNumber: page,
        pageSize: size,
        totalPages: Math.ceil(totalRecords / size) || 1,
        transactions: rows
      }
    });
  } catch (err) {
    res.status(500).json({ statusCode: 500, message: `Supabase Error: ${err.message}` });
  }
});

// GET /api/transaction/:id - Detail & Audit Logs from Supabase
app.get('/api/transaction/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const trxRes = await queryDb(
      `SELECT 
        trx_id as "trxId", 
        product_code as "productCode", 
        destination, 
        amount::int, 
        commission::int, 
        status, 
        provider_status as "providerStatus", 
        provider_message as "providerMessage", 
        serial_number as "serialNumber", 
        request_date as "requestDate", 
        response_date as "responseDate", 
        response_time as "responseTime", 
        created_by as "createdBy" 
       FROM transactions WHERE trx_id = $1`,
      [id]
    );

    if (trxRes.rows.length === 0) {
      return res.status(404).json({ statusCode: 404, message: 'Transaction not found in Supabase' });
    }

    const logsRes = await queryDb(
      `SELECT 
        id, 
        trx_id as "trxId", 
        log_type as "logType", 
        request_url as "url", 
        request_body as "reqBody", 
        response_status_code as "statusCode", 
        response_body as "resBody", 
        execution_time as "execTime", 
        created_date as timestamp 
       FROM transaction_logs WHERE trx_id = $1 ORDER BY id ASC`,
      [id]
    );

    res.json({
      statusCode: 200,
      message: 'Success',
      data: {
        ...trxRes.rows[0],
        logs: logsRes.rows
      }
    });
  } catch (err) {
    res.status(500).json({ statusCode: 500, message: `Supabase Error: ${err.message}` });
  }
});

// GET /api/stats - Real-time metrics calculated strictly from Supabase
app.get('/api/stats', async (req, res) => {
  try {
    const statsRes = await queryDb(`
      SELECT 
        COUNT(*)::int as "totalTrx",
        COUNT(*) FILTER (WHERE status = 'SUCCESS')::int as "successTrx",
        COUNT(*) FILTER (WHERE status = 'FAILED')::int as "failedTrx",
        COUNT(*) FILTER (WHERE status = 'PENDING')::int as "pendingTrx",
        COALESCE(SUM(amount) FILTER (WHERE status = 'SUCCESS'), 0)::int as "totalVolume",
        COALESCE(SUM(commission) FILTER (WHERE status = 'SUCCESS'), 0)::int as "totalCommission",
        COALESCE(AVG(response_time), 0)::int as "avgLatencyMs"
      FROM transactions
    `);

    const data = statsRes.rows[0];
    data.successRatePct = data.totalTrx > 0 ? Math.round((data.successTrx / data.totalTrx) * 100) : 100;

    res.json({ statusCode: 200, data });
  } catch (err) {
    res.status(500).json({ statusCode: 500, message: `Supabase Error: ${err.message}` });
  }
});

// GET /api/logs - Live Integration Logs Stream from Supabase
app.get('/api/logs', async (req, res) => {
  try {
    const { rows } = await queryDb(
      `SELECT 
        id, 
        trx_id as "trxId", 
        log_type as "logType", 
        request_url as "url", 
        request_body as "reqBody", 
        response_status_code as "statusCode", 
        response_body as "resBody", 
        execution_time as "execTime", 
        created_date as timestamp 
       FROM transaction_logs 
       ORDER BY id DESC LIMIT 50`
    );
    res.json({ statusCode: 200, data: rows });
  } catch (err) {
    res.status(500).json({ statusCode: 500, message: `Supabase Error: ${err.message}` });
  }
});

// Fallback SPA Router
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ statusCode: 404, message: 'Endpoint not found' });
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Production Serverless Handler Export
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 AjoAPI Web API Engine running on http://localhost:${PORT}`);
    console.log(`📡 Connected strictly to Supabase PostgreSQL Database`);
  });
}

export default app;
