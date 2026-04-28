import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { Spinner } from '../components/UI'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function SharePage() {
  const { token } = useParams()
  const [job, setJob] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    axios.get(`${API}/share/${token}`)
      .then(r => setJob(r.data))
      .catch(() => setError('Image not found or link expired'))
  }, [token])

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      <p style={{ color: 'var(--danger)', fontSize: '14px' }}>{error}</p>
      <Link to="/">← Back home</Link>
    </div>
  )

  if (!job) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spinner size={32} color="var(--accent)" />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-0)', padding: '40px 24px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ maxWidth: '720px', width: '100%' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '18px', color: 'var(--text-0)', textDecoration: 'none' }}>
            <span style={{ color: 'var(--accent)' }}>Pixel</span>Studio
          </Link>
          <span style={{ fontSize: '12px', color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>Shared image</span>
        </div>

        {/* Image */}
        <img
          src={`${API}${job.image_url}`}
          alt={job.positive_prompt}
          style={{ width: '100%', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'block', marginBottom: '20px' }}
        />

        {/* Meta */}
        <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <p style={{ fontSize: '11px', color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Prompt</p>
            <p style={{ fontSize: '14px', color: 'var(--text-0)' }}>{job.positive_prompt}</p>
          </div>
          {job.negative_prompt && (
            <div>
              <p style={{ fontSize: '11px', color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Negative</p>
              <p style={{ fontSize: '13px', color: 'var(--text-1)' }}>{job.negative_prompt}</p>
            </div>
          )}
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
            {[
              ['Size', `${job.width}×${job.height}`],
              ['Steps', job.steps],
              ['CFG', job.cfg],
              ['Sampler', job.sampler],
              ['Seed', job.seed],
            ].map(([k, v]) => (
              <div key={k}>
                <p style={{ fontSize: '10px', color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{k}</p>
                <p style={{ fontSize: '13px', color: 'var(--text-0)', fontFamily: 'var(--font-mono)' }}>{v}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <Link to="/register" style={{ fontSize: '13px', color: 'var(--text-2)' }}>
            Make your own with PixelStudio →
          </Link>
        </div>
      </div>
    </div>
  )
}
