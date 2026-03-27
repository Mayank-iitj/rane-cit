'use client';

import { useEffect } from 'react';
import { getAuth } from '@/lib/api';

export default function Home() {
  useEffect(() => {
    const auth = getAuth();
    window.location.href = auth.isAuthenticated ? '/dashboard' : '/login';
  }, []);

  return (
    <div className="login-page">
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#94a3b8' }}>Loading cnc.mayyanks.app...</p>
      </div>
    </div>
  );
}
