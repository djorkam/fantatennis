import React, { useState } from 'react';
import { ADMIN_PASSWORD, validatePassword } from '../auth';
import { Btn, inputStyle } from '../ui';

export function AdminGate({ onUnlock }: { onUnlock: () => void }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');

  function attempt() {
    const policyError = validatePassword(pw);
    if (policyError) { setError(policyError); return; }
    if (pw !== ADMIN_PASSWORD) {
      setError('Wrong password');
      setPw('');
      return;
    }
    onUnlock();
  }

  return (
    <div style={{
      maxWidth: 360, margin: '60px auto', padding: 32,
      background: '#fff', border: '0.5px solid #e8e8e8',
      borderRadius: 16, textAlign: 'center',
    }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>🔐</div>
      <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>Admin access</div>
      <div style={{ fontSize: 12, color: '#999', marginBottom: 20 }}>
        Enter the admin password to continue
      </div>
      <input
        type="password"
        value={pw}
        onChange={e => { setPw(e.target.value); setError(''); }}
        onKeyDown={e => e.key === 'Enter' && attempt()}
        placeholder="Password"
        style={{ ...inputStyle, marginBottom: 8, textAlign: 'center', letterSpacing: 2 }}
        autoFocus
      />
      {error && (
        <div style={{ fontSize: 12, color: '#E24B4A', marginBottom: 8 }}>{error}</div>
      )}
      <div style={{ fontSize: 11, color: '#bbb', marginBottom: 16 }}>
        Min 8 chars · uppercase · number · special char
      </div>
      <Btn primary onClick={attempt} style={{ width: '100%' }}>
        Unlock admin
      </Btn>
    </div>
  );
}
