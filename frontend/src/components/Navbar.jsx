import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Button } from './UI'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navLink = (to, label) => (
    <Link
      to={to}
      style={{
        fontSize: '12px',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: location.pathname === to ? 'var(--accent)' : 'var(--text-1)',
        textDecoration: 'none',
        transition: 'color var(--transition)',
        fontFamily: 'var(--font-mono)',
      }}
    >
      {label}
    </Link>
  )

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      height: '56px',
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg-1)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '28px', height: '28px',
          background: 'var(--accent)',
          borderRadius: '4px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', fontWeight: '700', color: '#0a0a0b',
          fontFamily: 'var(--font-display)',
        }}>P</div>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '16px', color: 'var(--text-0)', letterSpacing: '-0.01em' }}>
          PixelStudio
        </span>
      </Link>

      {/* Nav links */}
      {user && (
        <div style={{ display: 'flex', gap: '28px', alignItems: 'center' }}>
          {navLink('/generate', 'Generate')}
          {navLink('/gallery', 'Gallery')}
        </div>
      )}

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {user ? (
          <>
            <span style={{ fontSize: '12px', color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>
              {user.username}
            </span>
            <Button variant="ghost" onClick={handleLogout} style={{ padding: '6px 14px', fontSize: '12px' }}>
              Logout
            </Button>
          </>
        ) : (
          <>
            <Link to="/login" style={{ fontSize: '12px', color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>
              Login
            </Link>
            <Button variant="primary" onClick={() => navigate('/register')} style={{ padding: '6px 14px', fontSize: '12px' }}>
              Register
            </Button>
          </>
        )}
      </div>
    </nav>
  )
}
