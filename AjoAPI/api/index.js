import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from '../swagger.js';

const app = express();

app.use(cors());
app.use(express.json());

// Swagger UI
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'AjoAPI Documentation',
  swaggerOptions: {
    persistAuthorization: true
  }
}));

// Swagger JSON endpoint
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// In-memory / Cloud Data Store
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
  }
];

let apiLogs = [];
let trxCounter = transactions.length + 1;

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
  if (apiLogs.length > 200) apiLogs.pop();
  return logEntry;
}

// Health Check
/**
 * @swagger
 * /api/health:
 *   get:
 *     tags: [Health]
 *     summary: Health check endpoint
 *     description: Returns the health status of the AjoAPI service
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'AjoAPI Web API Engine (Vercel Serverless)',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// GET /api/products
/**
 * @swagger
 * /api/products:
 *   get:
 *     tags: [Products]
 *     summary: Get all available products
 *     description: Returns a list of all products including pulsa, PLN tokens, and e-wallet top-ups
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 */
app.get('/api/products', (req, res) => {
  res.json({ statusCode: 200, message: 'Success', data: products });
});

// GET /api/providers
/**
 * @swagger
 * /api/providers:
 *   get:
 *     tags: [Providers]
 *     summary: Get all providers
 *     description: Returns a list of all payment and top-up providers
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Provider'
 */
app.get('/api/providers', (req, res) => {
  res.json({ statusCode: 200, message: 'Success', data: providers });
});

// POST /api/provider/toggle
/**
 * @swagger
 * /api/provider/toggle:
 *   post:
 *     tags: [Providers]
 *     summary: Toggle provider status
 *     description: Toggle a provider's status between ACTIVE and MAINTENANCE
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - providerCode
 *             properties:
 *               providerCode:
 *                 type: string
 *                 description: Provider code (e.g., TSEL, ISAT, XL)
 *                 example: TSEL
 *     responses:
 *       200:
 *         description: Provider status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Provider Telkomsel is now MAINTENANCE
 *                 data:
 *                   $ref: '#/components/schemas/Provider'
 *       404:
 *         description: Provider not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 */
app.post('/api/provider/toggle', (req, res) => {
  const { providerCode } = req.body || {};
  const prov = providers.find(p => p.code === providerCode);
  if (!prov) {
    return res.status(404).json({ statusCode: 404, message: 'Provider not found' });
  }
  prov.status = prov.status === 'ACTIVE' ? 'MAINTENANCE' : 'ACTIVE';
  res.json({ statusCode: 200, message: `Provider ${prov.name} is now ${prov.status}`, data: prov });
});

// POST /api/transaction
/**
 * @swagger
 * /api/transaction:
 *   post:
 *     tags: [Transactions]
 *     summary: Create a new transaction
 *     description: Process a new top-up or payment transaction. The system simulates provider response with 90% success rate.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productCode
 *               - destination
 *             properties:
 *               productCode:
 *                 type: string
 *                 description: Product code to purchase
 *                 example: TSEL10
 *               destination:
 *                 type: string
 *                 description: Destination phone number (must start with 0, 8-13 digits)
 *                 example: '081234567890'
 *               createdBy:
 *                 type: string
 *                 description: User who initiated the transaction
 *                 example: operator1
 *     responses:
 *       200:
 *         description: Transaction processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Transaction processed successfully
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Invalid request (missing fields or validation error)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error'
 */
app.post('/api/transaction', async (req, res) => {
  const startTime = Date.now();
  const { productCode, destination, createdBy } = req.body || {};

  if (!productCode || !destination) {
    addLog('TRX_ERR', 'MVC_TO_API', '/api/transaction', req.body, 400, { message: 'ProductCode and Destination are required' }, 5);
    return res.status(400).json({ statusCode: 400, message: 'Product Code and Destination are required' });
  }

  const product = products.find(p => p.code === productCode);
  if (!product) {
    addLog('TRX_ERR', 'MVC_TO_API', '/api/transaction', req.body, 400, { message: 'Product not found' }, 5);
    return res.status(400).json({ statusCode: 400, message: `Product code '${productCode}' does not exist` });
  }

  const destClean = destination.trim();
  if (!/^0[0-9]{7,12}$/.test(destClean)) {
    addLog('TRX_ERR', 'MVC_TO_API', '/api/transaction', req.body, 400, { message: 'Invalid destination' }, 5);
    return res.status(400).json({ statusCode: 400, message: 'Destination number must be 8-13 digits starting with 0' });
  }

  const dateStr = new Date().toISOString().slice(0,10).replace(/-/g,'');
  const trxId = `TRX${dateStr}${String(trxCounter++).padStart(5, '0')}`;

  const simulatedDelay = Math.floor(Math.random() * 300) + 100;
  await new Promise(r => setTimeout(r, simulatedDelay));

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
    providerMessage: isSuccess ? 'Topup berhasil' : 'Gagal: Provider Timeout',
    serialNumber: isSuccess ? `SN${Math.floor(100000000000 + Math.random() * 900000000000)}` : null,
    requestDate: new Date(startTime).toISOString(),
    responseDate: new Date().toISOString(),
    responseTime: executionTime,
    createdBy: createdBy || 'operator1'
  };

  transactions.unshift(newTrx);
  addLog(trxId, 'MVC_TO_API', '/api/transaction', req.body, 200, newTrx, executionTime);

  res.json({
    statusCode: 200,
    message: 'Transaction processed successfully',
    data: newTrx
  });
});

// GET /api/transaction
/**
 * @swagger
 * /api/transaction:
 *   get:
 *     tags: [Transactions]
 *     summary: Get transactions list
 *     description: Retrieve a paginated list of transactions with optional filters
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [SUCCESS, FAILED, PENDING]
 *         description: Filter by transaction status
 *       - in: query
 *         name: productCode
 *         schema:
 *           type: string
 *         description: Filter by product code
 *       - in: query
 *         name: pageNumber
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Success
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalRecords:
 *                       type: integer
 *                       example: 100
 *                     pageNumber:
 *                       type: integer
 *                       example: 1
 *                     pageSize:
 *                       type: integer
 *                       example: 10
 *                     totalPages:
 *                       type: integer
 *                       example: 10
 *                     transactions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Transaction'
 */
app.get('/api/transaction', (req, res) => {
  const { status, productCode, pageNumber = 1, pageSize = 10 } = req.query;
  let filtered = [...transactions];
  if (status) filtered = filtered.filter(t => t.status.toUpperCase() === status.toUpperCase());
  if (productCode) filtered = filtered.filter(t => t.productCode === productCode);

  const page = parseInt(pageNumber);
  const size = parseInt(pageSize);
  const offset = (page - 1) * size;

  res.json({
    statusCode: 200,
    message: 'Success',
    data: {
      totalRecords: filtered.length,
      pageNumber: page,
      pageSize: size,
      totalPages: Math.ceil(filtered.length / size) || 1,
      transactions: filtered.slice(offset, offset + size)
    }
  });
});

// GET /api/stats
/**
 * @swagger
 * /api/stats:
 *   get:
 *     tags: [Statistics]
 *     summary: Get transaction statistics
 *     description: Retrieve summary statistics including transaction counts, success rate, and total volume
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   $ref: '#/components/schemas/StatsResponse'
 */
app.get('/api/stats', (req, res) => {
  const totalTrx = transactions.length;
  const successTrx = transactions.filter(t => t.status === 'SUCCESS').length;
  const failedTrx = transactions.filter(t => t.status === 'FAILED').length;
  const totalVolume = transactions.reduce((acc, t) => t.status === 'SUCCESS' ? acc + t.amount : acc, 0);

  res.json({
    statusCode: 200,
    data: {
      totalTrx,
      successTrx,
      failedTrx,
      successRatePct: totalTrx > 0 ? Math.round((successTrx / totalTrx) * 100) : 100,
      totalVolume,
      avgLatencyMs: 250
    }
  });
});

// GET /api/logs
/**
 * @swagger
 * /api/logs:
 *   get:
 *     tags: [Logs]
 *     summary: Get API logs
 *     description: Retrieve the last 50 API request/response logs
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ApiLog'
 */
app.get('/api/logs', (req, res) => {
  res.json({ statusCode: 200, data: apiLogs.slice(0, 50) });
});

export default app;
