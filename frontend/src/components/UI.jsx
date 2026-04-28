import { useState, useEffect, useCallback } from 'react'

/* ── Button ─────────────────────────────────────────────────────────────────── */
export function Button({ children, variant = 'primary', loading, disabled, className = '', ...props }) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    borderRadius: 'var(--radius)',
    border: 'none',
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    fontWeight: '700',
    letterSpacing: '0.04em',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all var(--transition)',
    whiteSpace: 'nowrap',
  }

  const variants = {
    primary: {
      background: 'var(--accent)',
      color: '#0a0a0b',
      opacity: disabled || loading ? 0.5 : 1,
    },
    secondary: {
      background: 'var(--bg-3)',
      color: 'var(--text-0)',
      border: '1px solid var(--border)',
      opacity: disabled || loading ? 0.5 : 1,
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-1)',
      border: '1px solid var(--border)',
      opacity: disabled || loading ? 0.5 : 1,
    },
    danger: {
      background: 'rgba(224,82,82,0.12)',
      color: 'var(--danger)',
      border: '1px solid rgba(224,82,82,0.3)',
      opacity: disabled || loading ? 0.5 : 1,
    },
  }

  return (
    <button
      style={{ ...base, ...variants[variant] }}
      disabled={disabled || loading}
      className={className}
      {...props}
    >
      {loading && <Spinner size={14} />}
      {children}
    </button>
  )
}

/* ── Input ──────────────────────────────────────────────────────────────────── */
export function Input({ label, error, className = '', style = {}, ...props }) {
  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    background: 'var(--bg-2)',
    border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
    borderRadius: 'var(--radius)',
    color: 'var(--text-0)',
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    outline: 'none',
    transition: 'border-color var(--transition)',
    ...style,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label style={{ fontSize: '11px', color: 'var(--text-1)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {label}
        </label>
      )}
      <input
        style={inputStyle}
        onFocus={e => (e.target.style.borderColor = error ? 'var(--danger)' : 'var(--accent)')}
        onBlur={e => (e.target.style.borderColor = error ? 'var(--danger)' : 'var(--border)')}
        className={className}
        {...props}
      />
      {error && <span style={{ fontSize: '12px', color: 'var(--danger)' }}>{error}</span>}
    </div>
  )
}

/* ── Textarea ────────────────────────────────────────────────────────────────── */
export function Textarea({ label, error, rows = 3, style = {}, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label style={{ fontSize: '11px', color: 'var(--text-1)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {label}
        </label>
      )}
      <textarea
        rows={rows}
        style={{
          width: '100%',
          padding: '10px 14px',
          background: 'var(--bg-2)',
          border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
          borderRadius: 'var(--radius)',
          color: 'var(--text-0)',
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
          outline: 'none',
          resize: 'vertical',
          transition: 'border-color var(--transition)',
          ...style,
        }}
        onFocus={e => (e.target.style.borderColor = error ? 'var(--danger)' : 'var(--accent)')}
        onBlur={e => (e.target.style.borderColor = error ? 'var(--danger)' : 'var(--border)')}
        {...props}
      />
      {error && <span style={{ fontSize: '12px', color: 'var(--danger)' }}>{error}</span>}
    </div>
  )
}

/* ── Range slider ────────────────────────────────────────────────────────────── */
export function Slider({ label, value, min, max, step = 1, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ fontSize: '11px', color: 'var(--text-1)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {label}
        </label>
        <span style={{ fontSize: '13px', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
          {value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{
          width: '100%',
          accentColor: 'var(--accent)',
          cursor: 'pointer',
          height: '4px',
        }}
      />
    </div>
  )
}

/* ── Spinner ─────────────────────────────────────────────────────────────────── */
export function Spinner({ size = 20, color = 'currentColor' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      style={{ animation: 'spin 0.7s linear infinite', flexShrink: 0 }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <circle cx="10" cy="10" r="8" fill="none" stroke={color} strokeWidth="2" strokeOpacity="0.2" />
      <path d="M10 2 A8 8 0 0 1 18 10" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

/* ── Progress bar ────────────────────────────────────────────────────────────── */
export function ProgressBar({ value, status }) {
  const colors = { running: 'var(--accent)', done: 'var(--success)', failed: 'var(--danger)' }
  return (
    <div style={{ width: '100%' }}>
      <div style={{
        height: '3px',
        background: 'var(--bg-3)',
        borderRadius: '2px',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${value}%`,
          background: colors[status] || 'var(--accent)',
          borderRadius: '2px',
          transition: 'width 0.4s ease, background 0.3s',
          boxShadow: status === 'running' ? `0 0 8px ${colors.running}` : 'none',
        }} />
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '4px',
        fontSize: '11px',
        color: 'var(--text-2)',
        fontFamily: 'var(--font-mono)',
      }}>
        <span style={{ color: colors[status] || 'var(--text-1)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {status}
        </span>
        <span>{value}%</span>
      </div>
    </div>
  )
}

/* ── Toast ───────────────────────────────────────────────────────────────────── */
let _addToast = null

export function useToast() {
  const toast = useCallback((message, type = 'info') => {
    if (_addToast) _addToast(message, type)
  }, [])
  return toast
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    _addToast = (message, type) => {
      const id = Date.now()
      setToasts(t => [...t, { id, message, type }])
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
    }
    return () => { _addToast = null }
  }, [])

  const colors = { success: 'var(--success)', error: 'var(--danger)', info: 'var(--accent)' }

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 9999 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          padding: '12px 16px',
          background: 'var(--bg-2)',
          border: `1px solid ${colors[t.type] || 'var(--border)'}`,
          borderRadius: 'var(--radius)',
          fontSize: '13px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-0)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          animation: 'slideIn 0.2s ease',
          maxWidth: '320px',
        }}>
          <style>{`@keyframes slideIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }`}</style>
          <span style={{ color: colors[t.type], marginRight: '8px' }}>
            {t.type === 'success' ? '✓' : t.type === 'error' ? '✗' : '→'}
          </span>
          {t.message}
        </div>
      ))}
    </div>
  )
}
