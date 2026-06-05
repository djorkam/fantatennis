import React, { useEffect } from 'react';
import { TIER_COLORS, ROUND_LABELS } from './constants';

export const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '7px 10px',
  borderRadius: 8,
  border: '0.5px solid #ccc',
  fontSize: 13,
  boxSizing: 'border-box',
};

export function Toast({ msg, ok, onDone }: { msg: string; ok: boolean; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div style={{
      position: 'fixed', top: 16, right: 16,
      padding: '10px 18px', borderRadius: 8,
      background: ok ? '#1D9E75' : '#E24B4A',
      color: '#fff', fontWeight: 500, fontSize: 13,
      zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    }}>
      {msg}
    </div>
  );
}

export function Btn({
  primary, danger, small, onClick, disabled, children, style = {},
}: {
  primary?: boolean;
  danger?: boolean;
  small?: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: small ? '5px 12px' : '8px 16px',
      borderRadius: 8, border: '0.5px solid',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize: small ? 12 : 13, fontWeight: 500,
      opacity: disabled ? 0.5 : 1,
      borderColor: primary ? '#0F6E56' : danger ? '#A32D2D' : '#ddd',
      background: primary ? '#1D9E75' : danger ? '#FCEBEB' : 'transparent',
      color: primary ? '#fff' : danger ? '#A32D2D' : '#444',
      ...style,
    }}>
      {children}
    </button>
  );
}

export function RoundBadge({ round }: { round?: string }) {
  if (!round) return null;
  const color = TIER_COLORS[round] || '#888';
  return (
    <span style={{
      display: 'inline-block', padding: '1px 7px', borderRadius: 20,
      fontSize: 10, fontWeight: 600,
      background: color + '22', color, border: `1px solid ${color}44`,
    }}>
      {ROUND_LABELS[round]}
    </span>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: '#fff', border: '0.5px solid #e8e8e8',
      borderRadius: 12, padding: 16, marginBottom: 16,
    }}>
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  );
}
