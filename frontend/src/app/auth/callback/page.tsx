'use client';

import { useEffect } from 'react';
import { setAuth } from '@/lib/api';

export default function AuthCallback() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const isNew = params.get('new_user') === 'True';

    if (accessToken && refreshToken) {
      setAuth({
        access_token: accessToken,
        refresh_token: refreshToken,
        user: { id: '', email: '', name: '', role: 'admin', org_id: '' },
      });
      window.location.href = isNew ? '/dashboard?welcome=true' : '/dashboard';
    } else {
      window.location.href = '/login?error=oauth_failed';
    }
  }, []);

  return (
    <div className="login-page">
      <div className="login-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚙️</div>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Authenticating...</h2>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Completing Google sign-in to cnc.mayyanks.app</p>
      </div>
    </div>
  );
}
