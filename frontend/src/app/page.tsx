import Link from 'next/link';

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
          <Link href="/dashboard" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            Open Dashboard
          </Link>
          <Link href="/login" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
