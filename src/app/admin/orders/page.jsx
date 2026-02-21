'use client';

/**
 * MYTICKETSLIVE - Admin Orders Dashboard
 * View, approve, and manage ticket orders
 * Protected by AUDIO_SECRET admin key
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [adminKey, setAdminKey] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // order_ref being actioned
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const statusParam = filter !== 'all' ? `&status=${filter}` : '';
      const res = await fetch(`/api/tickets/orders?key=${adminKey}${statusParam}`);
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

  const handleLogin = (e) => {
    e.preventDefault();
    if (adminKey.trim()) setAuthenticated(true);
  };

  const handleApprove = async (order_ref) => {
    if (!confirm(`Approve order ${order_ref}? This will generate tickets and QR codes.`)) return;
    setActionLoading(order_ref);
    try {
      const res = await fetch('/api/tickets/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ order_ref, approved_by: 'admin' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Approve failed');
      toast.success(`Order ${order_ref} approved! ${data.quantity} ticket(s) generated.`);
      fetchOrders();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (order_ref) => {
    if (!confirm(`Reject order ${order_ref}? This cannot be undone.`)) return;
    setActionLoading(order_ref);
    try {
      const res = await fetch('/api/tickets/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ order_ref, action: 'reject' }),
      });
      fetchOrders();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  };

  const statusColor = (s) => {
    const colors = {
      pending: '#f59e0b',
      approved: '#10b981',
      rejected: '#ef4444',
      expired: '#6b7280',
      cancelled: '#6b7280',
    };
    return colors[s] || '#94a3b8';
  };

  // Login gate
  if (!authenticated) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0a0f1e', display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <form onSubmit={handleLogin} style={{
          background: '#111827', borderRadius: 16, padding: 40, maxWidth: 400,
          width: '90%', border: '1px solid #1e293b',
        }}>
          <h1 style={{ color: '#fff', fontSize: 24, margin: '0 0 8px', textAlign: 'center' }}>
            MyTicketsLive Admin
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 14, margin: '0 0 24px', textAlign: 'center' }}>
            Enter admin key to manage orders
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
            width: '100%', padding: '12px 16px', background: '#3b82f6', color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer',
          }}>
            Enter Dashboard
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0f1e', color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif', padding: '20px',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 24, flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>
            MyTicketsLive Admin
          </h1>
          <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: 14 }}>
            Order Management Dashboard
          </p>
        </div>
        <a href="/admin/check-in" style={{
          padding: '10px 20px', background: '#10b981', color: '#fff', borderRadius: 8,
          textDecoration: 'none', fontWeight: 600, fontSize: 14, display: 'inline-block',
        }}>
          QR Scanner
        </a>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12, marginBottom: 24,
        }}>
          {[
            { label: 'Total Orders', value: stats.total, color: '#3b82f6' },
            { label: 'Pending', value: stats.pending, color: '#f59e0b' },
            { label: 'Approved', value: stats.approved, color: '#10b981' },
            { label: 'Revenue', value: `$${(stats.total_revenue || 0).toLocaleString()}`, color: '#8b5cf6' },
          ].map((s) => (
            <div key={s.label} style={{
              background: '#111827', borderRadius: 12, padding: '16px 20px',
              border: `1px solid ${s.color}33`,
            }}>
              <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['all', 'pending', 'approved', 'rejected', 'expired'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, textTransform: 'capitalize',
              background: filter === f ? '#3b82f6' : '#1e293b',
              color: filter === f ? '#fff' : '#94a3b8',
            }}
          >
            {f} {f === 'pending' && stats ? `(${stats.pending})` : ''}
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
          No {filter !== 'all' ? filter : ''} orders found.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {orders.map((order) => (
            <div
              key={order.order_ref}
              style={{
                background: '#111827', borderRadius: 12, padding: 20,
                border: `1px solid ${order.status === 'pending' ? '#f59e0b33' : '#1e293b'}`,
              }}
            >
              {/* Order Header */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                marginBottom: 12, flexWrap: 'wrap', gap: 8,
              }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>
                    {order.order_ref}
                    <span style={{
                      marginLeft: 10, fontSize: 12, padding: '3px 8px', borderRadius: 4,
                      background: `${statusColor(order.status)}22`,
                      color: statusColor(order.status),
                      textTransform: 'uppercase', fontWeight: 700,
                    }}>
                      {order.status}
                    </span>
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
                    {order.event?.name || 'Unknown Event'} &middot; {order.ticket_type?.name || 'Unknown Type'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#10b981' }}>
                    ${(order.total_amount || 0).toFixed(2)}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: 12 }}>
                    {order.quantity}x @ ${order.ticket_type?.price || 0}
                  </div>
                </div>
              </div>

              {/* Buyer Info */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 8, marginBottom: 12, fontSize: 13,
              }}>
                <div><span style={{ color: '#64748b' }}>Name:</span> <span style={{ color: '#e2e8f0' }}>{order.purchaser_name}</span></div>
                <div><span style={{ color: '#64748b' }}>Email:</span> <span style={{ color: '#e2e8f0' }}>{order.purchaser_email}</span></div>
                <div><span style={{ color: '#64748b' }}>Phone:</span> <span style={{ color: '#e2e8f0' }}>{order.purchaser_phone || '—'}</span></div>
                <div><span style={{ color: '#64748b' }}>Payment:</span> <span style={{ color: '#e2e8f0', textTransform: 'capitalize' }}>{order.payment_method}</span></div>
                <div><span style={{ color: '#64748b' }}>Ordered:</span> <span style={{ color: '#e2e8f0' }}>{formatDate(order.created_at)}</span></div>
                <div><span style={{ color: '#64748b' }}>Expires:</span> <span style={{ color: '#e2e8f0' }}>{formatDate(order.expires_at)}</span></div>
              </div>

              {/* Screenshot */}
              {order.payment_screenshot_url && (
                <div style={{ marginBottom: 12 }}>
                  <a
                    href={order.payment_screenshot_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '8px 14px', background: '#1e293b', borderRadius: 8,
                      color: '#3b82f6', textDecoration: 'none', fontSize: 13, fontWeight: 600,
                    }}
                  >
                    View Payment Screenshot
                  </a>
                </div>
              )}

              {/* Actions */}
              {order.status === 'pending' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleApprove(order.order_ref)}
                    disabled={actionLoading === order.order_ref}
                    style={{
                      padding: '10px 24px', background: '#10b981', color: '#fff', border: 'none',
                      borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer',
                      opacity: actionLoading === order.order_ref ? 0.5 : 1,
                    }}
                  >
                    {actionLoading === order.order_ref ? 'Approving...' : 'Approve & Generate Tickets'}
                  </button>
                  <button
                    onClick={() => handleReject(order.order_ref)}
                    disabled={actionLoading === order.order_ref}
                    style={{
                      padding: '10px 24px', background: '#450a0a', color: '#ef4444', border: '1px solid #dc2626',
                      borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer',
                      opacity: actionLoading === order.order_ref ? 0.5 : 1,
                    }}
                  >
                    Reject
                  </button>
                </div>
              )}

              {/* Approved info */}
              {order.status === 'approved' && order.approved_at && (
                <div style={{ fontSize: 12, color: '#10b981' }}>
                  Approved {formatDate(order.approved_at)} by {order.approved_by || 'admin'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
