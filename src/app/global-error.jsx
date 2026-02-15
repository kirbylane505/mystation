'use client';

export default function GlobalError({ error, reset }) {
  return (
    <html>
      <body style={{ backgroundColor: '#0a0a0a', color: '#fff', fontFamily: 'system-ui' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Something went wrong</h2>
            <p style={{ color: '#999', marginBottom: '2rem' }}>MyStation encountered an unexpected error.</p>
            <button
              onClick={reset}
              style={{ padding: '0.75rem 1.5rem', backgroundColor: '#3B82F6', color: '#fff', border: 'none', borderRadius: '0.75rem', fontWeight: '600', cursor: 'pointer' }}
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
