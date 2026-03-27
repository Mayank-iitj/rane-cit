export default function Home() {
  return (
    <main className="login-page">
      <div className="login-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚙️</div>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>cnc.mayyanks.app</h1>
        <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
          CNC Intelligence & Predictive Automation Platform
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <a className="btn btn-primary" href="/login" style={{ textDecoration: 'none' }}>
            Sign In
          </a>
          <a className="btn btn-secondary" href="/dashboard" style={{ textDecoration: 'none' }}>
            Open Dashboard
          </a>
        </div>
      </div>
    </main>
  );
}
