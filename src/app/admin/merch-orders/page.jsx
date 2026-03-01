'use client';

import { useState, useEffect, useCallback } from 'react';

export default function AdminMerchOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [adminKey, setAdminKey] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const statusParam = filter !== 'all' ? `?status=${filter}` : '';
      const res = await fetch(`/api/admin/merch-orders${statusParam}`, {
        headers: { 'x-admin-key': adminKey },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch orders');
      setOrders(data.orders || []);
      setStats(data.stats || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [adminKey, filter]);

  useEffect(() => {
    if (authenticated) fetchOrders();
  }, [authenticated, filter, fetchOrders]);

  // Auto-auth from sessionStorage
  useEffect(() => {
    const stored = typeof window !== 'undefined' && sessionStorage.getItem('ADMIN_KEY');
    if (stored) {
      setAdminKey(stored);
      setAuthenticated(true);
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (adminKey.trim()) {
      sessionStorage.setItem('ADMIN_KEY', adminKey);
      setAuthenticated(true);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '--';
    return new Date(iso).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  };

  const formatCents = (cents) => {
    if (!cents) return '$0.00';
    return `$${(cents / 100).toFixed(2)}`;
  };

  const statusColor = (s) => {
    const colors = {
      fulfilled: '#10b981',
      partial: '#f59e0b',
      failed: '#ef4444',
      pending: '#3b82f6',
      manual: '#8b5cf6',
    };
    return colors[s] || '#94a3b8';
  };

  const providerStatusColor = (s) => {
    if (s === 'created' || s === 'fulfilled') return '#10b981';
    if (s === 'failed') return '#ef4444';
    if (s === 'pending') return '#f59e0b';
    if (s === 'none') return '#4b5563';
    return '#94a3b8';
  };

  // Login gate
  if (!authenticated) {
    return (
      <div style={{
        minHeight: '100vh', background: '#09090b', display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <form onSubmit={handleLogin} style={{
          background: '#111827', borderRadius: 16, padding: 40, maxWidth: 400,
          width: '90%', border: '1px solid #1e293b',
        }}>
          <h1 style={{ color: '#fff', fontSize: 24, margin: '0 0 8px', textAlign: 'center' }}>
            Merch Orders
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 14, margin: '0 0 24px', textAlign: 'center' }}>
            Enter admin key to view orders
          </p>
          <input
            type="password"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            placeholder="Admin key"
            style={{
              width: '100%', padding: '12px 16px', background: '#1e293b', border: '1px solid #334155',
              borderRadius: 8, color: '#fff', fontSize: 16, marginBottom: 16, outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <button type="submit" style={{
            width: '100%', padding: '12px 16px', background: '#D4AF37', color: '#000',
            border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: 'pointer',
          }}>
            View Orders
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#09090b', color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif', padding: '20px',
      maxWidth: 1200, margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>
          Merch Orders
        </h1>
        <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: 14 }}>
          Every merch order tracked — Printful + Printify
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 12, marginBottom: 24,
        }}>
          {[
            { label: 'Total', value: stats.total, color: '#3b82f6' },
            { label: 'Fulfilled', value: stats.fulfilled, color: '#10b981' },
            { label: 'Partial', value: stats.partial, color: '#f59e0b' },
            { label: 'Failed', value: stats.failed, color: '#ef4444' },
            { label: 'Pending', value: stats.pending, color: '#8b5cf6' },
            { label: 'Revenue', value: formatCents(stats.revenue), color: '#D4AF37' },
          ].map((s) => (
            <div key={s.label} style={{
              background: '#111827', borderRadius: 12, padding: '14px 16px',
              border: `1px solid ${s.color}33`,
            }}>
              <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['all', 'fulfilled', 'partial', 'failed', 'pending', 'manual'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, textTransform: 'capitalize',
              background: filter === f ? '#D4AF37' : '#1e293b',
              color: filter === f ? '#000' : '#94a3b8',
            }}
          >
            {f}
          </button>
        ))}
        <button onClick={fetchOrders} style={{
          padding: '8px 16px', borderRadius: 8, border: '1px solid #334155',
          background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: 13, marginLeft: 'auto',
        }}>
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: 16, background: '#450a0a', border: '1px solid #dc2626',
          borderRadius: 8, marginBottom: 16, color: '#fca5a5',
        }}>
          {error}
        </div>
      )}

      {/* Orders List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>Loading orders...</div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
          No {filter !== 'all' ? filter : ''} orders yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {orders.map((order) => (
            <div
              key={order.id}
              onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
              style={{
                background: '#111827', borderRadius: 12, padding: 20, cursor: 'pointer',
                border: `1px solid ${order.status === 'failed' ? '#dc262644' : order.status === 'partial' ? '#f59e0b33' : '#1e293b'}`,
                transition: 'border-color 0.2s',
              }}
            >
              {/* Order Header Row */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                flexWrap: 'wrap', gap: 8,
              }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>
                    {order.customer_name || 'Unknown'}
                    <span style={{
                      marginLeft: 10, fontSize: 11, padding: '2px 8px', borderRadius: 4,
                      background: `${statusColor(order.status)}22`,
                      color: statusColor(order.status),
                      textTransform: 'uppercase', fontWeight: 700,
                    }}>
                      {order.status}
                    </span>
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 2 }}>
                    {order.customer_email || ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#D4AF37' }}>
                    {formatCents(order.total_cents)}
                  </div>
                  <div style={{ color: '#64748b', fontSize: 12 }}>
                    {formatDate(order.created_at)}
                  </div>
                </div>
              </div>

              {/* Items Summary */}
              <div style={{ marginTop: 8, fontSize: 13, color: '#94a3b8' }}>
                {(order.items || []).map((item, i) => (
                  <span key={i}>
                    {i > 0 ? ' + ' : ''}
                    {item.quantity}x {item.name}
                  </span>
                ))}
              </div>

              {/* Provider Status Row */}
              <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 12 }}>
                {order.printful_status && order.printful_status !== 'none' && (
                  <span>
                    <span style={{ color: '#64748b' }}>Printful:</span>{' '}
                    <span style={{ color: providerStatusColor(order.printful_status), fontWeight: 600 }}>
                      {order.printful_status}
                    </span>
                    {order.printful_order_id && (
                      <span style={{ color: '#4b5563' }}> #{order.printful_order_id}</span>
                    )}
                  </span>
                )}
                {order.printify_status && order.printify_status !== 'none' && (
                  <span>
                    <span style={{ color: '#64748b' }}>Printify:</span>{' '}
                    <span style={{ color: providerStatusColor(order.printify_status), fontWeight: 600 }}>
                      {order.printify_status}
                    </span>
                    {order.printify_order_id && (
                      <span style={{ color: '#4b5563' }}> #{order.printify_order_id}</span>
                    )}
                  </span>
                )}
              </div>

              {/* Expanded Details */}
              {expandedOrder === order.id && (
                <div style={{
                  marginTop: 16, paddingTop: 16, borderTop: '1px solid #1e293b',
                  fontSize: 13,
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <div style={{ color: '#64748b', marginBottom: 4 }}>Stripe Session</div>
                      <div style={{ color: '#e2e8f0', wordBreak: 'break-all', fontSize: 11, fontFamily: 'monospace' }}>
                        {order.stripe_session_id}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#64748b', marginBottom: 4 }}>Shipping</div>
                      <div style={{ color: '#e2e8f0' }}>
                        {order.shipping_address ? (
                          <>
                            {order.shipping_address.line1}<br />
                            {order.shipping_address.line2 && <>{order.shipping_address.line2}<br /></>}
                            {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}<br />
                            {order.shipping_address.country}
                          </>
                        ) : (
                          <span style={{ color: '#ef4444' }}>No shipping address</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Error Messages */}
                  {order.printful_error && (
                    <div style={{ marginTop: 12, padding: 10, background: '#450a0a', borderRadius: 8, color: '#fca5a5', fontSize: 12 }}>
                      <strong>Printful Error:</strong> {order.printful_error}
                    </div>
                  )}
                  {order.printify_error && (
                    <div style={{ marginTop: 8, padding: 10, background: '#450a0a', borderRadius: 8, color: '#fca5a5', fontSize: 12 }}>
                      <strong>Printify Error:</strong> {order.printify_error}
                    </div>
                  )}

                  {/* Raw Items */}
                  {order.printful_items && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ color: '#64748b', marginBottom: 4 }}>Printful Items</div>
                      <pre style={{ color: '#94a3b8', fontSize: 11, background: '#0a0f1e', padding: 8, borderRadius: 6, overflow: 'auto', maxHeight: 120 }}>
                        {JSON.stringify(order.printful_items, null, 2)}
                      </pre>
                    </div>
                  )}
                  {order.printify_items && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ color: '#64748b', marginBottom: 4 }}>Printify Items</div>
                      <pre style={{ color: '#94a3b8', fontSize: 11, background: '#0a0f1e', padding: 8, borderRadius: 6, overflow: 'auto', maxHeight: 120 }}>
                        {JSON.stringify(order.printify_items, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
