import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AjoAPI - Payment & Topup Engine',
      version: '1.0.0',
      description: `
## Overview
AjoAPI adalah REST API untuk sistem pembayaran dan top-up yang menyediakan layanan pulsa, token listrik, dan e-wallet.

## Features
- **Products Management**: Mengelola produk yang tersedia (pulsa, PLN, e-wallet)
- **Provider Management**: Mengelola provider dan status operasional
- **Transaction Processing**: Memproses transaksi top-up/pembayaran
- **Statistics**: Statistik dan laporan transaksi
- **API Logs**: Monitoring log API

## Authentication
Saat ini API belum memerlukan autentikasi. Untuk production, disarankan menambahkan JWT/API Key.

## Rate Limiting
Tidak ada rate limiting saat ini. Untuk production, disarankan untuk menambahkan rate limiter.
      `,
      contact: {
        name: 'AjoAPI Support',
        email: 'support@ajoapi.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://your-production.vercel.app',
        description: 'Production server'
      }
    ],
    components: {
      schemas: {
        Product: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'Unique product code',
              example: 'TSEL10'
            },
            name: {
              type: 'string',
              description: 'Product name',
              example: 'Telkomsel 10.000'
            },
            provider: {
              type: 'string',
              description: 'Provider name',
              example: 'Telkomsel'
            },
            category: {
              type: 'string',
              enum: ['PULSA', 'PLN', 'EWALLET'],
              description: 'Product category',
              example: 'PULSA'
            },
            price: {
              type: 'integer',
              description: 'Product price in Rupiah',
              example: 10500
            },
            commission: {
              type: 'integer',
              description: 'Commission amount in Rupiah',
              example: 250
            },
            isActive: {
              type: 'boolean',
              description: 'Whether product is active',
              example: true
            }
          }
        },
        Provider: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'Provider code',
              example: 'TSEL'
            },
            name: {
              type: 'string',
              description: 'Provider name',
              example: 'Telkomsel'
            },
            status: {
              type: 'string',
              enum: ['ACTIVE', 'MAINTENANCE'],
              description: 'Provider status',
              example: 'ACTIVE'
            },
            balance: {
              type: 'integer',
              description: 'Provider balance in Rupiah',
              example: 50000000
            },
            avgLatencyMs: {
              type: 'integer',
              description: 'Average response latency in milliseconds',
              example: 240
            }
          }
        },
        Transaction: {
          type: 'object',
          properties: {
            trxId: {
              type: 'string',
              description: 'Unique transaction ID',
              example: 'TRX2026072900001'
            },
            productCode: {
              type: 'string',
              description: 'Product code',
              example: 'TSEL10'
            },
            productName: {
              type: 'string',
              description: 'Product name',
              example: 'Telkomsel 10.000'
            },
            destination: {
              type: 'string',
              description: 'Destination phone number or account',
              example: '081234567890'
            },
            amount: {
              type: 'integer',
              description: 'Transaction amount in Rupiah',
              example: 10500
            },
            commission: {
              type: 'integer',
              description: 'Commission amount in Rupiah',
              example: 250
            },
            status: {
              type: 'string',
              enum: ['SUCCESS', 'FAILED', 'PENDING'],
              description: 'Transaction status',
              example: 'SUCCESS'
            },
            providerStatus: {
              type: 'string',
              enum: ['SUCCESS', 'FAILED'],
              description: 'Provider response status',
              example: 'SUCCESS'
            },
            providerMessage: {
              type: 'string',
              description: 'Message from provider',
              example: 'Topup berhasil'
            },
            serialNumber: {
              type: 'string',
              nullable: true,
              description: 'Serial number from provider (if success)',
              example: 'SN89210982310'
            },
            requestDate: {
              type: 'string',
              format: 'date-time',
              description: 'Request timestamp',
              example: '2026-07-29T10:00:00.000Z'
            },
            responseDate: {
              type: 'string',
              format: 'date-time',
              description: 'Response timestamp',
              example: '2026-07-29T10:00:00.300Z'
            },
            responseTime: {
              type: 'integer',
              description: 'Response time in milliseconds',
              example: 300
            },
            createdBy: {
              type: 'string',
              description: 'User who created the transaction',
              example: 'operator1'
            }
          }
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'UP'
            },
            service: {
              type: 'string',
              example: 'AjoAPI Web API Engine (Vercel Serverless)'
            },
            version: {
              type: 'string',
              example: '1.0.0'
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        StatsResponse: {
          type: 'object',
          properties: {
            totalTrx: {
              type: 'integer',
              description: 'Total transactions',
              example: 100
            },
            successTrx: {
              type: 'integer',
              description: 'Successful transactions',
              example: 90
            },
            failedTrx: {
              type: 'integer',
              description: 'Failed transactions',
              example: 10
            },
            successRatePct: {
              type: 'integer',
              description: 'Success rate percentage',
              example: 90
            },
            totalVolume: {
              type: 'integer',
              description: 'Total volume in Rupiah',
              example: 950000
            },
            avgLatencyMs: {
              type: 'integer',
              description: 'Average latency in milliseconds',
              example: 250
            }
          }
        },
        ApiLog: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Log entry ID',
              example: 1
            },
            trxId: {
              type: 'string',
              description: 'Transaction ID (or error code)',
              example: 'TRX2026072900001'
            },
            logType: {
              type: 'string',
              description: 'Type of log entry',
              example: 'MVC_TO_API'
            },
            url: {
              type: 'string',
              description: 'API endpoint URL',
              example: '/api/transaction'
            },
            reqBody: {
              type: 'string',
              description: 'Request body as JSON string',
              example: '{"productCode":"TSEL10","destination":"081234567890"}'
            },
            statusCode: {
              type: 'integer',
              description: 'HTTP status code',
              example: 200
            },
            resBody: {
              type: 'string',
              description: 'Response body as JSON string',
              example: '{"statusCode":200,"message":"Success"}'
            },
            execTime: {
              type: 'integer',
              description: 'Execution time in milliseconds',
              example: 300
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Log timestamp'
            }
          }
        }
      },
      responses: {
        Success: {
          description: 'Success response',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  statusCode: {
                    type: 'integer',
                    example: 200
                  },
                  message: {
                    type: 'string',
                    example: 'Success'
                  },
                  data: {
                    type: 'object'
                  }
                }
              }
            }
          }
        },
        Error: {
          description: 'Error response',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  statusCode: {
                    type: 'integer',
                    example: 400
                  },
                  message: {
                    type: 'string',
                    example: 'Error message'
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  apis: ['./api/*.js']
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
