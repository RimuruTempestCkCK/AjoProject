// Self-contained OpenAPI 3.0.0 specification (no JSDoc required)
const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'AjoAPI - Payment & Topup Engine',
    version: '1.2.0',
    description: `
## Overview
AjoAPI adalah REST API untuk sistem pembayaran dan top-up yang menyediakan layanan pulsa, token listrik, dan e-wallet dengan backend Supabase PostgreSQL.

## Features
- **Products Management**: Mengelola produk yang tersedia (pulsa, PLN, e-wallet)
- **Provider Management**: Mengelola provider dan status operasional
- **Transaction Processing**: Memproses transaksi top-up/pembayaran dengan Supabase
- **Statistics**: Statistik dan laporan transaksi real-time
- **API Logs**: Monitoring log API dari database

## Authentication
Saat ini API belum memerlukan autentikasi. Untuk production, disarankan menambahkan JWT/API Key.
    `,
    contact: {
      name: 'AjoAPI Support',
      email: 'support@ajoapi.com'
    }
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Development server'
    }
  ],
  paths: {
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check endpoint',
        description: 'Returns the health status of AjoAPI service including database connectivity',
        responses: {
          '200': {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'UP' },
                    database: { type: 'string', example: 'ONLINE (Supabase PostgreSQL)' },
                    service: { type: 'string', example: 'AjoAPI Web API Engine' },
                    version: { type: 'string', example: '1.2.0' },
                    timestamp: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/products': {
      get: {
        tags: ['Products'],
        summary: 'Get all available products',
        description: 'Returns a list of all products from Supabase',
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    statusCode: { type: 'integer', example: 200 },
                    message: { type: 'string', example: 'Success' },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          code: { type: 'string', example: 'TSEL10' },
                          name: { type: 'string', example: 'Telkomsel 10.000' },
                          provider: { type: 'string', example: 'Telkomsel' },
                          category: { type: 'string', example: 'PULSA' },
                          price: { type: 'integer', example: 10500 },
                          commission: { type: 'integer', example: 250 },
                          isActive: { type: 'boolean', example: true }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/providers': {
      get: {
        tags: ['Providers'],
        summary: 'Get all providers',
        description: 'Returns a list of all payment providers from Supabase',
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    statusCode: { type: 'integer', example: 200 },
                    message: { type: 'string', example: 'Success' },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          code: { type: 'string', example: 'TSEL' },
                          name: { type: 'string', example: 'Telkomsel' },
                          status: { type: 'string', enum: ['ACTIVE', 'MAINTENANCE'], example: 'ACTIVE' },
                          balance: { type: 'integer', example: 50000000 },
                          avgLatencyMs: { type: 'integer', example: 240 }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/provider/toggle': {
      post: {
        tags: ['Providers'],
        summary: 'Toggle provider status',
        description: 'Toggle a provider status between ACTIVE and MAINTENANCE',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['providerCode'],
                properties: {
                  providerCode: {
                    type: 'string',
                    description: 'Provider code (TSEL, ISAT, XL, AXIS, PLN, DANA, OVO, GOPAY)',
                    example: 'TSEL'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Provider status updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    statusCode: { type: 'integer', example: 200 },
                    message: { type: 'string', example: 'Provider Telkomsel is now MAINTENANCE' },
                    data: {
                      type: 'object',
                      properties: {
                        code: { type: 'string', example: 'TSEL' },
                        status: { type: 'string', example: 'MAINTENANCE' }
                      }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Missing providerCode',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    statusCode: { type: 'integer', example: 400 },
                    message: { type: 'string', example: 'providerCode is required' }
                  }
                }
              }
            }
          },
          '404': {
            description: 'Provider not found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    statusCode: { type: 'integer', example: 404 },
                    message: { type: 'string', example: 'Provider not found in Supabase' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/transaction': {
      post: {
        tags: ['Transactions'],
        summary: 'Create a new transaction',
        description: 'Process a top-up or payment transaction and store it in Supabase',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['productCode', 'destination'],
                properties: {
                  productCode: {
                    type: 'string',
                    description: 'Product code to purchase',
                    example: 'TSEL10'
                  },
                  destination: {
                    type: 'string',
                    description: 'Destination phone number (must start with 0)',
                    example: '081234567890'
                  },
                  createdBy: {
                    type: 'string',
                    description: 'User who initiated the transaction',
                    example: 'operator1'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Transaction processed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    statusCode: { type: 'integer', example: 200 },
                    message: { type: 'string', example: 'Transaction processed and saved to Supabase successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        trxId: { type: 'string', example: 'TRX2026072900001' },
                        productCode: { type: 'string', example: 'TSEL10' },
                        productName: { type: 'string', example: 'Telkomsel 10.000' },
                        destination: { type: 'string', example: '081234567890' },
                        amount: { type: 'integer', example: 10500 },
                        commission: { type: 'integer', example: 250 },
                        status: { type: 'string', example: 'SUCCESS' },
                        serialNumber: { type: 'string', example: 'SN89210982310' },
                        requestDate: { type: 'string', format: 'date-time' },
                        responseDate: { type: 'string', format: 'date-time' },
                        responseTime: { type: 'integer', example: 300 }
                      }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid request',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    statusCode: { type: 'integer', example: 400 },
                    message: { type: 'string', example: 'Product Code and Destination are required' }
                  }
                }
              }
            }
          }
        }
      },
      get: {
        tags: ['Transactions'],
        summary: 'Get transactions list',
        description: 'Retrieve paginated list of transactions with optional filters',
        parameters: [
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['SUCCESS', 'FAILED', 'PENDING'] },
            description: 'Filter by status'
          },
          {
            name: 'productCode',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by product code'
          },
          {
            name: 'pageNumber',
            in: 'query',
            schema: { type: 'integer', default: 1 },
            description: 'Page number'
          },
          {
            name: 'pageSize',
            in: 'query',
            schema: { type: 'integer', default: 10 },
            description: 'Items per page'
          }
        ],
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    statusCode: { type: 'integer', example: 200 },
                    message: { type: 'string', example: 'Success' },
                    data: {
                      type: 'object',
                      properties: {
                        totalRecords: { type: 'integer', example: 100 },
                        pageNumber: { type: 'integer', example: 1 },
                        pageSize: { type: 'integer', example: 10 },
                        totalPages: { type: 'integer', example: 10 },
                        transactions: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              trxId: { type: 'string', example: 'TRX2026072900001' },
                              productCode: { type: 'string', example: 'TSEL10' },
                              destination: { type: 'string', example: '081234567890' },
                              amount: { type: 'integer', example: 10500 },
                              status: { type: 'string', example: 'SUCCESS' }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/transaction/{id}': {
      get: {
        tags: ['Transactions'],
        summary: 'Get transaction details with audit logs',
        description: 'Retrieve detailed transaction information with all audit logs',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Transaction ID (e.g., TRX2026072900001)'
          }
        ],
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    statusCode: { type: 'integer', example: 200 },
                    message: { type: 'string', example: 'Success' },
                    data: {
                      type: 'object',
                      properties: {
                        trxId: { type: 'string', example: 'TRX2026072900001' },
                        productCode: { type: 'string', example: 'TSEL10' },
                        destination: { type: 'string', example: '081234567890' },
                        amount: { type: 'integer', example: 10500 },
                        status: { type: 'string', example: 'SUCCESS' },
                        logs: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: { type: 'integer' },
                              logType: { type: 'string' },
                              url: { type: 'string' },
                              statusCode: { type: 'integer' },
                              execTime: { type: 'integer' },
                              timestamp: { type: 'string', format: 'date-time' }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          '404': {
            description: 'Transaction not found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    statusCode: { type: 'integer', example: 404 },
                    message: { type: 'string', example: 'Transaction not found in Supabase' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/stats': {
      get: {
        tags: ['Statistics'],
        summary: 'Get transaction statistics',
        description: 'Retrieve real-time statistics calculated from Supabase',
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    statusCode: { type: 'integer', example: 200 },
                    data: {
                      type: 'object',
                      properties: {
                        totalTrx: { type: 'integer', example: 100 },
                        successTrx: { type: 'integer', example: 90 },
                        failedTrx: { type: 'integer', example: 10 },
                        pendingTrx: { type: 'integer', example: 0 },
                        successRatePct: { type: 'integer', example: 90 },
                        totalVolume: { type: 'integer', example: 950000 },
                        totalCommission: { type: 'integer', example: 22500 },
                        avgLatencyMs: { type: 'integer', example: 250 }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/logs': {
      get: {
        tags: ['Logs'],
        summary: 'Get API logs',
        description: 'Retrieve last 50 API request/response logs from Supabase',
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    statusCode: { type: 'integer', example: 200 },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer', example: 1 },
                          trxId: { type: 'string', example: 'TRX2026072900001' },
                          logType: { type: 'string', example: 'MVC_TO_API' },
                          url: { type: 'string', example: '/api/transaction' },
                          statusCode: { type: 'integer', example: 200 },
                          execTime: { type: 'integer', example: 300 },
                          timestamp: { type: 'string', format: 'date-time' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};

export default swaggerSpec;
