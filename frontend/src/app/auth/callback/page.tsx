'use client';

import { useEffect } from 'react';
import { setAuth } from '../../_shared/api';

export default function AuthCallback() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const isNew = params.get('new_user') === 'True';

    if (error) {
      window.location.href = `/login?error=${encodeURIComponent(error)}`;
      return;
    }

    const completeLogin = async () => {
      if (!accessToken || !refreshToken) {
        window.location.href = '/login?error=oauth_failed';
        return;
      }

      let user = { id: '', email: '', name: '', role: 'admin', org_id: '' };
      try {
        const meRes = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: 'no-store',
        });

        if (meRes.ok) {
          const me = await meRes.json();
          user = {
            id: me.id || '',
            email: me.email || '',
            name: me.full_name || me.name || '',
            role: me.role || 'admin',
            org_id: me.org_id || '',
          };
        }
      } catch {
        // Keep fallback user payload so sign-in can still complete.
      }

      setAuth({
        access_token: accessToken,
        refresh_token: refreshToken,
        user,
      });

      window.location.href = isNew ? '/dashboard?welcome=true' : '/dashboard';
    };

    void completeLogin();
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
