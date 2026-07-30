# AjoAPI - Swagger/OpenAPI Integration

## Overview

AjoAPI telah terintegrasi dengan Swagger/OpenAPI untuk dokumentasi API interaktif. Anda dapat mengakses Swagger UI di endpoint `/api/docs`.

## Quick Start

### 1. Run the Server

```bash
cd AjoAPI
npm run api
```

The API server will start on `http://localhost:3000`

### 2. Access Swagger UI

Open your browser and navigate to:

```
http://localhost:3000/api/docs
```

You'll see the interactive Swagger UI documentation with all API endpoints.

### 3. Access OpenAPI Spec (JSON)

The OpenAPI 3.0.0 specification is available at:

```
http://localhost:3000/api/docs.json
```

## Available Endpoints

### Health
- `GET /api/health` - Health check endpoint

### Products
- `GET /api/products` - Get all available products

### Providers
- `GET /api/providers` - Get all providers
- `POST /api/provider/toggle` - Toggle provider status (ACTIVE/MAINTENANCE)

### Transactions
- `POST /api/transaction` - Create a new transaction
- `GET /api/transaction` - Get transactions list (with pagination and filters)

### Statistics
- `GET /api/stats` - Get transaction statistics

### Logs
- `GET /api/logs` - Get API request/response logs

## Using Swagger UI

### Try It Out Feature

1. Click on any endpoint to expand it
2. Click the **"Try it out"** button
3. Fill in the required parameters
4. Click **"Execute"** to make a real API call
5. View the response in the UI

### Example: Creating a Transaction

1. Expand `POST /api/transaction`
2. Click **"Try it out"**
3. Enter the request body:
   ```json
   {
     "productCode": "TSEL10",
     "destination": "081234567890",
     "createdBy": "operator1"
   }
   ```
4. Click **"Execute"**
5. View the transaction result

### Example: Getting Products

1. Expand `GET /api/products`
2. Click **"Try it out"**
3. Click **"Execute"**
4. View all available products

### Filtering Transactions

Use query parameters to filter transactions:

```
GET /api/transaction?status=SUCCESS&productCode=TSEL10&pageNumber=1&pageSize=10
```

## API Response Format

All responses follow this structure:

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": { ... }
}
```

## Data Models

### Product
- `code` - Unique product code (e.g., TSEL10)
- `name` - Product name
- `provider` - Provider name
- `category` - Category (PULSA, PLN, EWALLET)
- `price` - Price in Rupiah
- `commission` - Commission amount
- `isActive` - Whether product is available

### Provider
- `code` - Provider code (e.g., TSEL)
- `name` - Provider name
- `status` - Status (ACTIVE/MAINTENANCE)
- `balance` - Provider balance
- `avgLatencyMs` - Average response latency

### Transaction
- `trxId` - Unique transaction ID
- `productCode` - Product code
- `destination` - Phone number or account
- `amount` - Transaction amount
- `status` - Status (SUCCESS/FAILED/PENDING)
- `serialNumber` - Serial number from provider (if success)
- `responseTime` - Response time in ms

## Configuration

### Custom Swagger Styling

The Swagger UI is customized to hide the default topbar and display a custom title. To modify:

Edit `api/index.js`:
```javascript
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'AjoAPI Documentation',
  swaggerOptions: {
    persistAuthorization: true
  }
}));
```

### Production Deployment

For production deployment to Vercel, update the server URL in `swagger.js`:

```javascript
servers: [
  {
    url: 'https://your-app.vercel.app',
    description: 'Production server'
  }
]
```

## Integration with Other Tools

### Import into Postman

1. Go to `http://localhost:3000/api/docs.json`
2. Copy the JSON
3. In Postman: File → Import → Paste Raw Text
4. Postman will automatically create a collection

### Import into Insomnia

1. Go to `http://localhost:3000/api/docs.json`
2. Copy the JSON
3. In Insomnia: Application → Preferences → Import
4. Select "OpenAPI 3.0" and paste the JSON

### Generate Client SDKs

Use the OpenAPI spec to generate client libraries:

```bash
# Example with openapi-generator
openapi-generator generate \
  -i http://localhost:3000/api/docs.json \
  -g javascript \
  -o ./client-sdk
```

## Troubleshooting

### Swagger UI Not Loading

1. Ensure the API server is running: `npm run api`
2. Check that ports are not blocked
3. Verify `/api/docs` endpoint is accessible

### Documentation Not Showing

1. Ensure JSDoc comments are properly formatted
2. Check that all tags are defined in swagger.js
3. Verify the OpenAPI spec at `/api/docs.json`

### CORS Issues

The API is configured to allow all origins for development. For production, update CORS settings in `api/index.js`:

```javascript
app.use(cors({
  origin: ['https://your-production-domain.com'],
  credentials: true
}));
```

## Next Steps

Consider adding:
- **Authentication**: JWT/API Key authentication
- **Rate Limiting**: Request rate limiting
- **Webhooks**: Event notification system
- **Versioning**: API versioning (v1, v2)
- **Error Tracking**: Sentry/LogRocket integration

## Resources

- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger.js Documentation](https://github.com/scottie1984/swagger-jsdoc)
