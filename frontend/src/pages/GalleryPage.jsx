import { useState, useEffect } from 'react'
import { imagesApi } from '../api/client'
import { Button, Spinner, useToast } from '../components/UI'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function ImageCard({ job, onDelete }) {
  const [sharing, setSharing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const toast = useToast()

  const imageUrl = `${API}${job.image_url}`

  const handleShare = async (e) => {
    e.stopPropagation()
    setSharing(true)
    try {
      const { data } = await imagesApi.share(job.id)
      await navigator.clipboard.writeText(data.share_url)
      toast('Share link copied!', 'success')
    } catch {
      toast('Failed to share', 'error')
    } finally {
      setSharing(false)
    }
  }

  const handleDelete = async (e) => {
    e.stopPropagation()
    if (!window.confirm('Delete this image?')) return
    setDeleting(true)
    try {
      await imagesApi.delete(job.id)
      onDelete(job.id)
      toast('Image deleted', 'info')
    } catch {
      toast('Failed to delete', 'error')
      setDeleting(false)
    }
  }

  const handleDownload = (e) => {
    e.stopPropagation()
    window.open(`${API}/api/images/${job.id}/download`, '_blank')
  }

  return (
    <>
      <div
        onClick={() => setExpanded(true)}
        style={{
          background: 'var(--bg-1)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'border-color var(--transition), transform var(--transition)',
          display: 'flex',
          flexDirection: 'column',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hi)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}
      >
        <img
          src={imageUrl}
          alt={job.positive_prompt}
          loading="lazy"
          style={{ width: '100%', aspectRatio: `${job.width}/${job.height}`, objectFit: 'cover', display: 'block' }}
        />
        <div style={{ padding: '10px 12px' }}>
          <p style={{
            fontSize: '12px', color: 'var(--text-1)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            marginBottom: '8px',
          }}>
            {job.positive_prompt}
          </p>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-2)', flex: 1 }}>
              {job.width}×{job.height} · {job.steps}s · CFG {job.cfg}
            </span>
            <button onClick={handleDownload} title="Download" style={iconBtnStyle}>↓</button>
            <button onClick={handleShare} title="Share" style={iconBtnStyle} disabled={sharing}>⎘</button>
            <button onClick={handleDelete} title="Delete" style={{ ...iconBtnStyle, color: 'var(--danger)' }} disabled={deleting}>✕</button>
          </div>
        </div>
      </div>

      {/* Expanded lightbox */}
      {expanded && (
        <div
          onClick={() => setExpanded(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <img src={imageUrl} alt="" style={{ width: '100%', borderRadius: 'var(--radius)', display: 'block' }} />
            <div style={{ background: 'var(--bg-2)', borderRadius: 'var(--radius)', padding: '14px', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-0)', marginBottom: '6px' }}>{job.positive_prompt}</p>
              <p style={{ fontSize: '12px', color: 'var(--text-2)' }}>
                {job.width}×{job.height} · {job.steps} steps · CFG {job.cfg} · {job.sampler} · seed {job.seed}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button onClick={handleDownload} variant="primary">↓ Download</Button>
              <Button onClick={handleShare} variant="secondary" loading={sharing}>⎘ Share</Button>
              <Button onClick={() => setExpanded(false)} variant="ghost">Close</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const iconBtnStyle = {
  background: 'var(--bg-3)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  color: 'var(--text-1)',
  fontSize: '13px',
  cursor: 'pointer',
  padding: '4px 8px',
  fontFamily: 'var(--font-mono)',
  transition: 'color var(--transition)',
}

export default function GalleryPage() {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    imagesApi.list()
      .then(r => setImages(r.data))
      .catch(() => setError('Failed to load images'))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = (id) => setImages(imgs => imgs.filter(i => i.id !== id))

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <Spinner size={32} color="var(--accent)" />
    </div>
  )

  if (error) return (
    <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--danger)' }}>{error}</div>
  )

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '26px', marginBottom: '4px' }}>Gallery</h1>
          <p style={{ color: 'var(--text-1)', fontSize: '13px' }}>{images.length} image{images.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {images.length === 0 ? (
        <div style={{
          border: '1px dashed var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '80px 24px',
          textAlign: 'center',
          color: 'var(--text-2)',
          fontSize: '14px',
        }}>
          <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.3 }}>◻ ◻ ◻</div>
          <p>No images yet. Head to Generate to create your first one.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '16px',
        }}>
          {images.map(job => (
            <ImageCard key={job.id} job={job} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
