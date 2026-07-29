import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000/api';

// Inline SVG Icon components
const ServerIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
    <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
    <line x1="6" y1="6" x2="6.01" y2="6"></line>
    <line x1="6" y1="18" x2="6.01" y2="18"></line>
  </svg>
);

const RefreshIcon = ({ spinning }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: spinning ? 'spin 1s linear infinite' : 'none' }}>
    <polyline points="23 4 23 10 17 10"></polyline>
    <polyline points="1 20 1 14 7 14"></polyline>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
  </svg>
);

const ActivityIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
  </svg>
);

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

const DatabaseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
  </svg>
);

const CodeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6"></polyline>
    <polyline points="8 6 2 12 8 18"></polyline>
  </svg>
);

export default function App() {
  const [activeTab, setActiveTab] = useState('monitor');
  const [health, setHealth] = useState(null);
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [products, setProducts] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Sandbox form state
  const [testProduct, setTestProduct] = useState('TSEL10');
  const [testDestination, setTestDestination] = useState('081234567890');
  const [testResponse, setTestResponse] = useState(null);
  const [sendingTest, setSendingTest] = useState(false);

  // Selected Log Modal
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const healthRes = await fetch(`${API_BASE}/health`).then(r => r.json()).catch(() => null);
      setHealth(healthRes);

      const statsRes = await fetch(`${API_BASE}/stats`).then(r => r.json()).catch(() => null);
      if (statsRes) setStats(statsRes.data);

      const logsRes = await fetch(`${API_BASE}/logs`).then(r => r.json()).catch(() => null);
      if (logsRes) setLogs(logsRes.data || []);

      const prodRes = await fetch(`${API_BASE}/products`).then(r => r.json()).catch(() => null);
      if (prodRes) setProducts(prodRes.data || []);

      const provRes = await fetch(`${API_BASE}/providers`).then(r => r.json()).catch(() => null);
      if (provRes) setProviders(provRes.data || []);

    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchData, 3000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleToggleProvider = async (providerCode) => {
    try {
      await fetch(`${API_BASE}/provider/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerCode })
      });
      fetchData();
    } catch (err) {
      alert('Gagal me-toggle provider: ' + err.message);
    }
  };

  const handleRunTestTransaction = async (e) => {
    e.preventDefault();
    setSendingTest(true);
    setTestResponse(null);
    try {
      const res = await fetch(`${API_BASE}/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productCode: testProduct,
          destination: testDestination,
          createdBy: 'ReactSandboxUser'
        })
      });
      const data = await res.json();
      setTestResponse(data);
      fetchData();
    } catch (err) {
      setTestResponse({ statusCode: 500, message: err.message });
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0b0f19', color: '#f3f4f6', padding: '24px' }}>
      
      {/* CSS Keyframe for Spin */}
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>

      {/* Header Bar */}
      <header style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        backgroundColor: '#111827', padding: '16px 24px', borderRadius: '16px', 
        border: '1px solid #1f2937', marginBottom: '24px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '42px', height: '42px', borderRadius: '12px', 
            backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' 
          }}>
            <ServerIcon />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px' }}>
              AjoAPI <span style={{ color: '#3b82f6' }}>Web Engine (React JS)</span>
            </h1>
            <p style={{ fontSize: '12px', color: '#9ca3af' }}>RESTful Engine Service for AjoTopup</p>
          </div>
        </div>

        {/* Server Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', 
            backgroundColor: health?.status === 'UP' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)', 
            padding: '8px 16px', borderRadius: '9999px', 
            border: `1px solid ${health?.status === 'UP' ? '#22c55e' : '#ef4444'}` 
          }}>
            <span style={{ 
              width: '10px', height: '10px', borderRadius: '50%', 
              backgroundColor: health?.status === 'UP' ? '#22c55e' : '#ef4444',
              boxShadow: health?.status === 'UP' ? '0 0 10px #22c55e' : 'none'
            }} />
            <span style={{ fontSize: '13px', fontWeight: '700', color: health?.status === 'UP' ? '#4ade80' : '#f87171' }}>
              {health?.status === 'UP' ? 'ONLINE (PORT 5000)' : 'SERVER OFFLINE'}
            </span>
          </div>

          <button 
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '6px', 
              backgroundColor: autoRefresh ? 'rgba(59, 130, 246, 0.15)' : '#1f2937', 
              color: autoRefresh ? '#60a5fa' : '#9ca3af', 
              border: 'none', padding: '8px 16px', borderRadius: '100px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' 
            }}
          >
            <RefreshIcon spinning={loading && autoRefresh} />
            {autoRefresh ? 'Live Syncing' : 'Paused'}
          </button>
        </div>
      </header>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#111827', padding: '20px', borderRadius: '16px', border: '1px solid #1f2937' }}>
          <div style={{ color: '#9ca3af', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>TOTAL API REQUESTS</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#ffffff' }}>{stats?.totalTrx || 0}</div>
          <div style={{ fontSize: '12px', color: '#3b82f6', marginTop: '4px' }}>Transactions processed</div>
        </div>

        <div style={{ backgroundColor: '#111827', padding: '20px', borderRadius: '16px', border: '1px solid #1f2937' }}>
          <div style={{ color: '#9ca3af', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>SUCCESS RATE SLA</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#4ade80' }}>{stats?.successRatePct || 100}%</div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>{stats?.successTrx || 0} Successful / {stats?.failedTrx || 0} Failed</div>
        </div>

        <div style={{ backgroundColor: '#111827', padding: '20px', borderRadius: '16px', border: '1px solid #1f2937' }}>
          <div style={{ color: '#9ca3af', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>AVG RESPONSE TIME</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#f59e0b' }}>{stats?.avgLatencyMs || 0} ms</div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>Provider roundtrip latency</div>
        </div>

        <div style={{ backgroundColor: '#111827', padding: '20px', borderRadius: '16px', border: '1px solid #1f2937' }}>
          <div style={{ color: '#9ca3af', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>TOTAL TRANSACTION VOLUME</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#38bdf8' }}>
            Rp {(stats?.totalVolume || 0).toLocaleString('id-ID')}
          </div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>Gross GMV Topup</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #1f2937', marginBottom: '24px' }}>
        {[
          { id: 'monitor', label: 'Live Integration Monitor', Icon: ActivityIcon },
          { id: 'sandbox', label: 'API Sandbox & Tester', Icon: SendIcon },
          { id: 'providers', label: 'Products & Providers', Icon: DatabaseIcon },
          { id: 'docs', label: 'API Integration Docs', Icon: CodeIcon }
        ].map(tab => {
          const Icon = tab.Icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '12px 20px', border: 'none', background: 'none',
                color: isActive ? '#3b82f6' : '#9ca3af',
                borderBottom: isActive ? '2px solid #3b82f6' : '2px solid transparent',
                fontWeight: isActive ? '700' : '500',
                cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s'
              }}
            >
              <Icon />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: LIVE INTEGRATION MONITOR */}
      {activeTab === 'monitor' && (
        <div style={{ backgroundColor: '#111827', borderRadius: '16px', border: '1px solid #1f2937', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '700' }}>Live HTTP Request Audit Trail</h2>
              <p style={{ fontSize: '13px', color: '#9ca3af' }}>Incoming REST API calls from AjoTopup application</p>
            </div>
            <span style={{ fontSize: '12px', backgroundColor: '#1f2937', padding: '6px 12px', borderRadius: '100px', color: '#9ca3af' }}>
              Showing {logs.length} latest entries
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1f2937', color: '#9ca3af' }}>
                  <th style={{ padding: '12px' }}>TIMESTAMP</th>
                  <th style={{ padding: '12px' }}>TRX ID</th>
                  <th style={{ padding: '12px' }}>LOG TYPE</th>
                  <th style={{ padding: '12px' }}>URL / ENDPOINT</th>
                  <th style={{ padding: '12px' }}>STATUS</th>
                  <th style={{ padding: '12px' }}>LATENCY</th>
                  <th style={{ padding: '12px' }}>PAYLOAD</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                      Belum ada log request. Lakukan transaksi dari AjoTopup atau luncurkan tes dari tab Sandbox.
                    </td>
                  </tr>
                ) : (
                  logs.map(log => (
                    <tr key={log.id} style={{ borderBottom: '1px solid #1f2937' }}>
                      <td style={{ padding: '12px', color: '#9ca3af', fontFamily: 'monospace' }}>
                        {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour12: false })}
                      </td>
                      <td style={{ padding: '12px', fontWeight: '700', color: '#60a5fa' }}>{log.trxId}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ 
                          padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: '700',
                          backgroundColor: log.logType === 'MVC_TO_API' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                          color: log.logType === 'MVC_TO_API' ? '#c084fc' : '#60a5fa'
                        }}>
                          {log.logType}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontFamily: 'monospace', color: '#e5e7eb' }}>{log.url}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ 
                          padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: '700',
                          backgroundColor: log.statusCode === 200 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: log.statusCode === 200 ? '#4ade80' : '#f87171'
                        }}>
                          {log.statusCode || '200 OK'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: '#f59e0b', fontWeight: '600' }}>
                        {log.execTime ? `${log.execTime} ms` : '-'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <button 
                          onClick={() => setSelectedLog(log)}
                          style={{ backgroundColor: '#1f2937', color: '#f3f4f6', border: 'none', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          Inspect JSON
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: API SANDBOX & TESTER */}
      {activeTab === 'sandbox' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div style={{ backgroundColor: '#111827', borderRadius: '16px', border: '1px solid #1f2937', padding: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Test API Endpoint</h2>
            <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '20px' }}>
              POST <code style={{ color: '#60a5fa' }}>http://localhost:5000/api/transaction</code>
            </p>

            <form onSubmit={handleRunTestTransaction}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#9ca3af', marginBottom: '6px' }}>Pilih Produk</label>
                <select 
                  value={testProduct}
                  onChange={e => setTestProduct(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', backgroundColor: '#1f2937', border: '1px solid #374151', color: '#ffffff', borderRadius: '8px' }}
                >
                  {products.map(p => (
                    <option key={p.code} value={p.code}>
                      {p.code} - {p.name} (Rp {p.price.toLocaleString('id-ID')})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#9ca3af', marginBottom: '6px' }}>Nomor Tujuan / HP</label>
                <input 
                  type="text" 
                  value={testDestination}
                  onChange={e => setTestDestination(e.target.value)}
                  placeholder="081234567890"
                  style={{ width: '100%', padding: '10px 14px', backgroundColor: '#1f2937', border: '1px solid #374151', color: '#ffffff', borderRadius: '8px' }}
                />
              </div>

              <button 
                type="submit"
                disabled={sendingTest}
                style={{ 
                  width: '100%', padding: '12px', backgroundColor: '#3b82f6', color: '#ffffff', 
                  border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                <SendIcon />
                {sendingTest ? 'Sending Request...' : 'Kirim Request API'}
              </button>
            </form>
          </div>

          <div style={{ backgroundColor: '#111827', borderRadius: '16px', border: '1px solid #1f2937', padding: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>JSON Response</h2>
            <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '16px' }}>Response dari Web API Server</p>

            <pre style={{ 
              backgroundColor: '#090d16', padding: '16px', borderRadius: '12px', 
              border: '1px solid #1f2937', color: '#34d399', fontSize: '13px', minHeight: '260px', overflowX: 'auto' 
            }}>
              {testResponse ? JSON.stringify(testResponse, null, 2) : '// Tekan "Kirim Request API" untuk melihat respon'}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 3: PRODUCTS & PROVIDERS */}
      {activeTab === 'providers' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
          {/* Provider Status Controls */}
          <div style={{ backgroundColor: '#111827', borderRadius: '16px', border: '1px solid #1f2937', padding: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Provider SLA & Controls</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {providers.map(p => (
                <div key={p.code} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#1f2937', borderRadius: '10px' }}>
                  <div>
                    <div style={{ fontWeight: '700' }}>{p.name}</div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>Avg Latency: {p.avgLatencyMs} ms</div>
                  </div>
                  <button 
                    onClick={() => handleToggleProvider(p.code)}
                    style={{ 
                      padding: '6px 12px', borderRadius: '100px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '700',
                      backgroundColor: p.status === 'ACTIVE' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: p.status === 'ACTIVE' ? '#4ade80' : '#f87171'
                    }}
                  >
                    {p.status}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Master Product Grid */}
          <div style={{ backgroundColor: '#111827', borderRadius: '16px', border: '1px solid #1f2937', padding: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Katalog Produk API</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1f2937', color: '#9ca3af', textAlign: 'left' }}>
                    <th style={{ padding: '10px' }}>KODE</th>
                    <th style={{ padding: '10px' }}>NAMA PRODUK</th>
                    <th style={{ padding: '10px' }}>PROVIDER</th>
                    <th style={{ padding: '10px' }}>HARGA</th>
                    <th style={{ padding: '10px' }}>KOMISI</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.code} style={{ borderBottom: '1px solid #1f2937' }}>
                      <td style={{ padding: '10px', fontWeight: '700', color: '#60a5fa' }}>{p.code}</td>
                      <td style={{ padding: '10px' }}>{p.name}</td>
                      <td style={{ padding: '10px' }}>{p.provider}</td>
                      <td style={{ padding: '10px', fontWeight: '600' }}>Rp {p.price.toLocaleString('id-ID')}</td>
                      <td style={{ padding: '10px', color: '#4ade80' }}>Rp {p.commission.toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: API INTEGRATION DOCS */}
      {activeTab === 'docs' && (
        <div style={{ backgroundColor: '#111827', borderRadius: '16px', border: '1px solid #1f2937', padding: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '12px' }}>Dokumentasi Integrasi Web API (AjoAPI)</h2>
          <p style={{ color: '#9ca3af', marginBottom: '24px', lineHeight: '1.6' }}>
            Proyek <strong>AjoTopup (ASP.NET MVC)</strong> memanggil Web API yang berjalan pada port <code>http://localhost:5000</code>.
          </p>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '15px', color: '#60a5fa', marginBottom: '8px' }}>1. Endpoint Topup Transaksi</h3>
            <pre style={{ backgroundColor: '#090d16', padding: '16px', borderRadius: '8px', color: '#f3f4f6', fontSize: '13px' }}>
{`POST http://localhost:5000/api/transaction
Content-Type: application/json

Request Body:
{
  "productCode": "TSEL10",
  "destination": "081234567890",
  "createdBy": "operator1"
}

Response (200 OK):
{
  "statusCode": 200,
  "message": "Transaction processed successfully",
  "data": {
    "trxId": "TRX2026072900001",
    "productCode": "TSEL10",
    "productName": "Telkomsel 10.000",
    "destination": "081234567890",
    "amount": 10500,
    "status": "SUCCESS",
    "providerMessage": "Topup berhasil",
    "serialNumber": "SN89210982310"
  }
}`}
            </pre>
          </div>
        </div>
      )}

      {/* Payload Inspection Modal */}
      {selectedLog && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 
        }}>
          <div style={{ backgroundColor: '#111827', width: '600px', borderRadius: '16px', border: '1px solid #1f2937', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Inspect JSON Payload - {selectedLog.trxId}</h3>
              <button onClick={() => setSelectedLog(null)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>
            
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>Request Body</div>
              <pre style={{ backgroundColor: '#090d16', padding: '12px', borderRadius: '8px', fontSize: '12px', color: '#60a5fa', marginTop: '4px' }}>
                {selectedLog.reqBody || '// Empty'}
              </pre>
            </div>

            <div>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>Response Body</div>
              <pre style={{ backgroundColor: '#090d16', padding: '12px', borderRadius: '8px', fontSize: '12px', color: '#34d399', marginTop: '4px' }}>
                {selectedLog.resBody || '// Empty'}
              </pre>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
