import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'dist')));

// In-memory Database Store
const products = [
  { code: 'TSEL5', name: 'Telkomsel 5.000', provider: 'Telkomsel', category: 'PULSA', price: 5500, commission: 150, isActive: true },
  { code: 'TSEL10', name: 'Telkomsel 10.000', provider: 'Telkomsel', category: 'PULSA', price: 10500, commission: 250, isActive: true },
  { code: 'TSEL20', name: 'Telkomsel 20.000', provider: 'Telkomsel', category: 'PULSA', price: 20300, commission: 400, isActive: true },
  { code: 'TSEL50', name: 'Telkomsel 50.000', provider: 'Telkomsel', category: 'PULSA', price: 50100, commission: 750, isActive: true },
  { code: 'TSEL100', name: 'Telkomsel 100.000', provider: 'Telkomsel', category: 'PULSA', price: 99500, commission: 1200, isActive: true },
  { code: 'ISAT5', name: 'Indosat 5.000', provider: 'Indosat', category: 'PULSA', price: 5450, commission: 150, isActive: true },
  { code: 'ISAT10', name: 'Indosat 10.000', provider: 'Indosat', category: 'PULSA', price: 10450, commission: 250, isActive: true },
  { code: 'ISAT25', name: 'Indosat 25.000', provider: 'Indosat', category: 'PULSA', price: 25150, commission: 500, isActive: true },
  { code: 'XL10', name: 'XL 10.000', provider: 'XL', category: 'PULSA', price: 10450, commission: 250, isActive: true },
  { code: 'XL25', name: 'XL 25.000', provider: 'XL', category: 'PULSA', price: 25200, commission: 500, isActive: true },
  { code: 'AXIS5', name: 'Axis 5.000', provider: 'Axis', category: 'PULSA', price: 5450, commission: 150, isActive: true },
  { code: 'AXIS25', name: 'Axis 25.000', provider: 'Axis', category: 'PULSA', price: 25100, commission: 600, isActive: true },
  { code: 'PLN20', name: 'Token PLN 20.000', provider: 'PLN', category: 'PLN', price: 20500, commission: 300, isActive: true },
  { code: 'PLN50', name: 'Token PLN 50.000', provider: 'PLN', category: 'PLN', price: 50500, commission: 300, isActive: true },
  { code: 'DANA25', name: 'Saldo DANA 25.000', provider: 'Dana', category: 'EWALLET', price: 25500, commission: 300, isActive: true },
  { code: 'OVO20', name: 'Saldo OVO 20.000', provider: 'Ovo', category: 'EWALLET', price: 20500, commission: 200, isActive: true },
  { code: 'GOPAY25', name: 'Saldo GoPay 25.000', provider: 'GoPay', category: 'EWALLET', price: 25500, commission: 300, isActive: true }
];

const providers = [
  { code: 'TSEL', name: 'Telkomsel', status: 'ACTIVE', balance: 50000000, avgLatencyMs: 240 },
  { code: 'ISAT', name: 'Indosat', status: 'ACTIVE', balance: 35000000, avgLatencyMs: 310 },
  { code: 'XL', name: 'XL', status: 'ACTIVE', balance: 30000000, avgLatencyMs: 280 },
  { code: 'AXIS', name: 'Axis', status: 'ACTIVE', balance: 20000000, avgLatencyMs: 350 },
  { code: 'PLN', name: 'PLN', status: 'ACTIVE', balance: 100000000, avgLatencyMs: 420 },
  { code: 'DANA', name: 'Dana', status: 'ACTIVE', balance: 40000000, avgLatencyMs: 190 },
  { code: 'OVO', name: 'Ovo', status: 'ACTIVE', balance: 40000000, avgLatencyMs: 210 },
  { code: 'GOPAY', name: 'GoPay', status: 'ACTIVE', balance: 50000000, avgLatencyMs: 200 }
];

let transactions = [
  {
    trxId: 'TRX2026072900001',
    productCode: 'TSEL10',
    productName: 'Telkomsel 10.000',
    destination: '081234567890',
    amount: 10500,
    commission: 250,
    status: 'SUCCESS',
    providerStatus: 'SUCCESS',
    providerMessage: 'Topup berhasil',
    serialNumber: 'SN89210982310',
    requestDate: new Date(Date.now() - 3600000).toISOString(),
    responseDate: new Date(Date.now() - 3599700).toISOString(),
    responseTime: 300,
    createdBy: 'operator1'
  },
  {
    trxId: 'TRX2026072900002',
    productCode: 'ISAT25',
    productName: 'Indosat 25.000',
    destination: '085712345678',
    amount: 25150,
    commission: 500,
    status: 'SUCCESS',
    providerStatus: 'SUCCESS',
    providerMessage: 'Topup berhasil',
    serialNumber: 'SN89210982311',
    requestDate: new Date(Date.now() - 1800000).toISOString(),
    responseDate: new Date(Date.now() - 1799600).toISOString(),
    responseTime: 400,
    createdBy: 'operator1'
  }
];

let apiLogs = [];
let trxCounter = transactions.length + 1;

// Logging Helper
function addLog(trxId, logType, url, reqBody, statusCode, resBody, execTime) {
  const logEntry = {
    id: apiLogs.length + 1,
    trxId,
    logType,
    url,
    reqBody: typeof reqBody === 'object' ? JSON.stringify(reqBody) : reqBody,
    statusCode,
    resBody: typeof resBody === 'object' ? JSON.stringify(resBody) : resBody,
    execTime,
    timestamp: new Date().toISOString()
  };
  apiLogs.unshift(logEntry);
  if (apiLogs.length > 200) apiLogs.pop(); // keep last 200 logs
  return logEntry;
}

// ------------------------------------------------------------------------------------
// REST API ENDPOINTS
// ------------------------------------------------------------------------------------

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'AjoAPI Web API Engine',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// GET /api/products - List products
app.get('/api/products', (req, res) => {
  res.json({
    statusCode: 200,
    message: 'Success',
    data: products
  });
});

// GET /api/providers - List providers status
app.get('/api/providers', (req, res) => {
  res.json({
    statusCode: 200,
    message: 'Success',
    data: providers
  });
});

// POST /api/provider/toggle - Toggle provider status
app.post('/api/provider/toggle', (req, res) => {
  const { providerCode } = req.body;
  const prov = providers.find(p => p.code === providerCode);
  if (!prov) {
    return res.status(404).json({ statusCode: 404, message: 'Provider not found' });
  }
  prov.status = prov.status === 'ACTIVE' ? 'MAINTENANCE' : 'ACTIVE';
  res.json({ statusCode: 200, message: `Provider ${prov.name} is now ${prov.status}`, data: prov });
});

// POST /api/transaction - Create Topup Transaction (Called by AjoTopup)
app.post('/api/transaction', async (req, res) => {
  const startTime = Date.now();
  const { productCode, destination, createdBy } = req.body;

  if (!productCode || !destination) {
    addLog('TRX_ERR', 'MVC_TO_API', '/api/transaction', req.body, 400, { message: 'ProductCode and Destination are required' }, 5);
    return res.status(400).json({
      statusCode: 400,
      message: 'Product Code and Destination are required'
    });
  }

  const product = products.find(p => p.code === productCode);
  if (!product) {
    addLog('TRX_ERR', 'MVC_TO_API', '/api/transaction', req.body, 400, { message: 'Product not found' }, 5);
    return res.status(400).json({
      statusCode: 400,
      message: `Product code '${productCode}' does not exist`
    });
  }

  if (!product.isActive) {
    addLog('TRX_ERR', 'MVC_TO_API', '/api/transaction', req.body, 400, { message: 'Product is inactive' }, 5);
    return res.status(400).json({
      statusCode: 400,
      message: 'Product is currently inactive'
    });
  }

  // Check destination format (8-13 digits)
  const destClean = destination.trim();
  if (!/^0[0-9]{7,12}$/.test(destClean)) {
    addLog('TRX_ERR', 'MVC_TO_API', '/api/transaction', req.body, 400, { message: 'Invalid destination' }, 5);
    return res.status(400).json({
      statusCode: 400,
      message: 'Destination number must be 8-13 digits starting with 0'
    });
  }

  // Check provider status
  const provider = providers.find(p => p.name === product.provider);
  if (provider && provider.status !== 'ACTIVE') {
    addLog('TRX_ERR', 'MVC_TO_API', '/api/transaction', req.body, 503, { message: 'Provider under maintenance' }, 10);
    return res.status(503).json({
      statusCode: 503,
      message: `Provider ${product.provider} is currently under maintenance`
    });
  }

  // Generate TrxId
  const dateStr = new Date().toISOString().slice(0,10).replace(/-/g,'');
  const trxId = `TRX${dateStr}${String(trxCounter++).padStart(5, '0')}`;

  addLog(trxId, 'MVC_TO_API', '/api/transaction', req.body, 200, 'Processing', 0);

  // Simulate Upstream Provider Processing Delay (150ms - 600ms)
  const simulatedDelay = Math.floor(Math.random() * 450) + 150;
  await new Promise(r => setTimeout(r, simulatedDelay));

  // 90% Success simulation
  const isSuccess = Math.random() < 0.90;
  const executionTime = Date.now() - startTime;

  let newTrx = {
    trxId,
    productCode: product.code,
    productName: product.name,
    destination: destClean,
    amount: product.price,
    commission: product.commission,
    status: isSuccess ? 'SUCCESS' : 'FAILED',
    providerStatus: isSuccess ? 'SUCCESS' : 'FAILED',
    providerMessage: isSuccess ? 'Topup berhasil' : 'Gagal: Provider Timeout / Balance Limit',
    serialNumber: isSuccess ? `SN${Math.floor(100000000000 + Math.random() * 900000000000)}` : null,
    requestDate: new Date(startTime).toISOString(),
    responseDate: new Date().toISOString(),
    responseTime: executionTime,
    createdBy: createdBy || 'operator1'
  };

  transactions.unshift(newTrx);

  // Log API & Provider trace
  addLog(trxId, 'API_TO_PROVIDER', `/provider/${product.provider.toLowerCase()}/topup`, { trxId, destination: destClean, productCode: product.code }, 200, 'OK', simulatedDelay);
  addLog(trxId, 'API_RESPONSE', '/api/transaction', '', 200, newTrx, executionTime);

  res.json({
    statusCode: 200,
    message: 'Transaction processed successfully',
    data: newTrx
  });
});

// GET /api/transaction - Query transaction history
app.get('/api/transaction', (req, res) => {
  const { status, productCode, pageNumber = 1, pageSize = 10 } = req.query;

  let filtered = [...transactions];
  if (status) {
    filtered = filtered.filter(t => t.status.toUpperCase() === status.toUpperCase());
  }
  if (productCode) {
    filtered = filtered.filter(t => t.productCode === productCode);
  }

  const page = parseInt(pageNumber);
  const size = parseInt(pageSize);
  const offset = (page - 1) * size;
  const pagedList = filtered.slice(offset, offset + size);
  const totalPages = Math.ceil(filtered.length / size) || 1;

  res.json({
    statusCode: 200,
    message: 'Success',
    data: {
      totalRecords: filtered.length,
      pageNumber: page,
      pageSize: size,
      totalPages,
      transactions: pagedList
    }
  });
});

// GET /api/transaction/:id - Detail & Logs
app.get('/api/transaction/:id', (req, res) => {
  const { id } = req.params;
  const trx = transactions.find(t => t.trxId === id);

  if (!trx) {
    return res.status(404).json({ statusCode: 404, message: 'Transaction not found' });
  }

  const logs = apiLogs.filter(l => l.trxId === id);

  res.json({
    statusCode: 200,
    message: 'Success',
    data: {
      ...trx,
      logs
    }
  });
});

// GET /api/stats - Real-time metrics
app.get('/api/stats', (req, res) => {
  const totalTrx = transactions.length;
  const successTrx = transactions.filter(t => t.status === 'SUCCESS').length;
  const failedTrx = transactions.filter(t => t.status === 'FAILED').length;
  const pendingTrx = transactions.filter(t => t.status === 'PENDING').length;

  const totalVolume = transactions.reduce((acc, t) => t.status === 'SUCCESS' ? acc + t.amount : acc, 0);
  const totalCommission = transactions.reduce((acc, t) => t.status === 'SUCCESS' ? acc + t.commission : acc, 0);

  const avgLatency = totalTrx > 0 
    ? Math.round(transactions.reduce((acc, t) => acc + (t.responseTime || 0), 0) / totalTrx)
    : 0;

  res.json({
    statusCode: 200,
    data: {
      totalTrx,
      successTrx,
      failedTrx,
      pendingTrx,
      successRatePct: totalTrx > 0 ? Math.round((successTrx / totalTrx) * 100) : 100,
      totalVolume,
      totalCommission,
      avgLatencyMs: avgLatency
    }
  });
});

// GET /api/logs - Live Integration Logs Stream
app.get('/api/logs', (req, res) => {
  res.json({
    statusCode: 200,
    data: apiLogs.slice(0, 50)
  });
});

// Fallback for React Single Page Application
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ statusCode: 404, message: 'Endpoint not found' });
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start Web API Server
app.listen(PORT, () => {
  console.log(`🚀 AjoAPI Web API Engine running on http://localhost:${PORT}`);
  console.log(`📡 Endpoints available: /api/transaction, /api/products, /api/providers, /api/stats, /api/health`);
  console.log(`💻 React JS Dashboard available at: http://localhost:${PORT}`);
});
