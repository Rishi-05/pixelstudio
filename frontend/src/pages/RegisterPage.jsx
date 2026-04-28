import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Button, Input, useToast } from '../components/UI'

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [confirm, setConfirm] = useState('')
  const { register, loading, error } = useAuthStore()
  const navigate = useNavigate()
  const toast = useToast()

  const field = (key) => ({
    value: form[key],
    onChange: e => setForm(f => ({ ...f, [key]: e.target.value })),
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== confirm) return toast('Passwords do not match', 'error')
    const ok = await register(form.username, form.email, form.password)
    if (ok) {
      toast('Account created!', 'success')
      navigate('/generate')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-0)',
      padding: '24px',
    }}>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px),
                          linear-gradient(90deg, var(--border) 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
        opacity: 0.4,
      }} />

      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: '420px',
        background: 'var(--bg-1)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '40px',
      }}>
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            display: 'inline-block',
            padding: '4px 10px',
            background: 'var(--accent-dim)',
            border: '1px solid var(--accent-glow)',
            borderRadius: 'var(--radius)',
            fontSize: '11px',
            color: 'var(--accent)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '16px',
            fontFamily: 'var(--font-mono)',
          }}>
            PixelStudio
          </div>
          <h1 style={{ fontSize: '28px', marginBottom: '6px' }}>Create account</h1>
          <p style={{ color: 'var(--text-1)', fontSize: '13px' }}>
            Start generating images locally
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <Input label="Username" type="text" placeholder="cool_username" required autoFocus {...field('username')} />
          <Input label="Email" type="email" placeholder="you@example.com" required {...field('email')} />
          <Input label="Password" type="password" placeholder="min 8 chars" required {...field('password')} />
          <Input
            label="Confirm password"
            type="password"
            placeholder="repeat password"
            required
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            error={confirm && form.password !== confirm ? 'Passwords do not match' : ''}
          />

          {error && (
            <div style={{
              padding: '10px 14px',
              background: 'rgba(224,82,82,0.08)',
              border: '1px solid rgba(224,82,82,0.3)',
              borderRadius: 'var(--radius)',
              fontSize: '13px',
              color: 'var(--danger)',
            }}>
              {error}
            </div>
          )}

          <Button type="submit" loading={loading} style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }}>
            Create account
          </Button>
        </form>

        <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: 'var(--text-2)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
