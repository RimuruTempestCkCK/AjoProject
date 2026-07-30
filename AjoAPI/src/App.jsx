import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://ajo-project.vercel.app/api';

export default function App() {
  const [health, setHealth] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const healthRes = await fetch(`${API_BASE}/health`);
        const healthData = await healthRes.json();
        setHealth(healthData);

        const prodRes = await fetch(`${API_BASE}/products`);
        const prodData = await prodRes.json();
        setProducts(prodData.data || []);
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const isOnline = health?.status === 'UP';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0b0f19', color: '#f3f4f6', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#111827', padding: '16px 24px', borderRadius: '12px',
        border: '1px solid #1f2937', marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>
            AjoAPI <span style={{ color: '#3b82f6' }}>Dashboard</span>
          </h1>
          <p style={{ fontSize: '12px', color: '#9ca3af', margin: '4px 0 0' }}>Web API Engine for AjoTopup</p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 16px', borderRadius: '9999px',
          backgroundColor: isOnline ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${isOnline ? '#22c55e' : '#ef4444'}`
        }}>
          <span style={{
            width: '10px', height: '10px', borderRadius: '50%',
            backgroundColor: isOnline ? '#22c55e' : '#ef4444'
          }} />
          <span style={{ fontSize: '13px', fontWeight: '700', color: isOnline ? '#4ade80' : '#f87171' }}>
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>
      </header>

      {/* Status Card */}
      <div style={{
        backgroundColor: '#111827', padding: '24px', borderRadius: '12px',
        border: '1px solid #1f2937', marginBottom: '24px'
      }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>Server Status</h2>
        {loading ? (
          <p style={{ color: '#9ca3af' }}>Loading...</p>
        ) : health ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '4px' }}>STATUS</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: isOnline ? '#4ade80' : '#f87171' }}>
                {health.status}
              </div>
            </div>
            <div>
              <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '4px' }}>DATABASE</div>
              <div style={{ fontSize: '14px', fontWeight: '600' }}>{health.database}</div>
            </div>
            <div>
              <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '4px' }}>VERSION</div>
              <div style={{ fontSize: '14px', fontWeight: '600' }}>{health.version}</div>
            </div>
          </div>
        ) : (
          <p style={{ color: '#f87171' }}>Cannot connect to server</p>
        )}
      </div>

      {/* Products */}
      <div style={{
        backgroundColor: '#111827', padding: '24px', borderRadius: '12px',
        border: '1px solid #1f2937'
      }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>
          Products ({products.length})
        </h2>
        {products.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1f2937', color: '#9ca3af', textAlign: 'left' }}>
                  <th style={{ padding: '12px' }}>CODE</th>
                  <th style={{ padding: '12px' }}>NAME</th>
                  <th style={{ padding: '12px' }}>PROVIDER</th>
                  <th style={{ padding: '12px' }}>PRICE</th>
                  <th style={{ padding: '12px' }}>COMMISSION</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #1f2937' }}>
                    <td style={{ padding: '12px', fontWeight: '700', color: '#60a5fa' }}>{p.code}</td>
                    <td style={{ padding: '12px' }}>{p.name}</td>
                    <td style={{ padding: '12px' }}>{p.provider}</td>
                    <td style={{ padding: '12px', fontWeight: '600' }}>Rp {p.price?.toLocaleString('id-ID')}</td>
                    <td style={{ padding: '12px', color: '#4ade80' }}>Rp {p.commission?.toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: '#9ca3af' }}>No products available</p>
        )}
      </div>
    </div>
  );
}
