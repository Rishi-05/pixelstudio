import { useState } from 'react'
import { generateApi, imagesApi } from '../api/client'
import { useJobProgress } from '../hooks/useJobProgress'
import { Button, Textarea, Input, Slider, ProgressBar, useToast } from '../components/UI'

const SAMPLERS = ['dpmpp_2m', 'euler', 'euler_ancestral', 'dpm_2', 'ddim']

const DEFAULT_PARAMS = {
  positive_prompt: '',
  negative_prompt: 'blurry, low quality, distorted face, bad anatomy, extra fingers, overexposed',
  width: 512,
  height: 512,
  steps: 20,
  cfg: 7,
  sampler: 'dpmpp_2m',
  seed: -1,
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function JobResult({ job, onReset }) {
  // imageUrl from hook catches the URL even after WS closes
  const { progress, status, imageUrl: hookImageUrl } = useJobProgress(job.id, job.status)
  const toast = useToast()
  const [sharing, setSharing] = useState(false)
  const [shareUrl, setShareUrl] = useState(null)

  const liveStatus = ['done', 'failed'].includes(status)
    ? status
    : job.status === 'done' ? 'done' : status

  const liveProgress = liveStatus === 'done' ? 100 : progress

  // Use hook's imageUrl (from polling) OR job's imageUrl (if already set)
  const rawImageUrl = hookImageUrl || job.image_url
  const fullImageUrl = rawImageUrl ? `${API_BASE}${rawImageUrl}` : null

  const handleShare = async () => {
    setSharing(true)
    try {
      const { data } = await imagesApi.share(job.id)
      setShareUrl(data.share_url)
      await navigator.clipboard.writeText(data.share_url)
      toast('Share link copied to clipboard!', 'success')
    } catch {
      toast('Failed to create share link', 'error')
    } finally {
      setSharing(false)
    }
  }

  const handleDownload = () => {
    window.open(`${API_BASE}/api/images/${job.id}/download`, '_blank')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <ProgressBar value={liveProgress} status={liveStatus} />

      {liveStatus === 'failed' && (
        <div style={{
          padding: '14px', background: 'rgba(224,82,82,0.08)',
          border: '1px solid rgba(224,82,82,0.25)', borderRadius: 'var(--radius)',
          fontSize: '13px', color: 'var(--danger)',
        }}>
          {job.error_message || 'Generation failed. Is ComfyUI running?'}
        </div>
      )}

      {fullImageUrl && liveStatus === 'done' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <img
            src={fullImageUrl}
            alt="Generated"
            style={{
              width: '100%',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              display: 'block',
            }}
          />
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Button variant="primary" onClick={handleDownload}>
              ↓ Download
            </Button>
            <Button variant="secondary" onClick={handleShare} loading={sharing}>
              ⎘ Copy share link
            </Button>
            {shareUrl && (
              <span style={{ fontSize: '11px', color: 'var(--text-2)', alignSelf: 'center', fontFamily: 'var(--font-mono)' }}>
                {shareUrl}
              </span>
            )}
          </div>
        </div>
      )}

      {(liveStatus === 'done' || liveStatus === 'failed') && (
        <Button variant="ghost" onClick={onReset} style={{ alignSelf: 'flex-start' }}>
          ← Generate another
        </Button>
      )}
    </div>
  )
}

export default function GeneratePage() {
  const [params, setParams] = useState(DEFAULT_PARAMS)
  const [job, setJob] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const toast = useToast()

  const set = (key) => (value) => setParams(p => ({ ...p, [key]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!params.positive_prompt.trim()) return toast('Prompt cannot be empty', 'error')
    setSubmitting(true)
    try {
      const { data } = await generateApi.submit(params)
      setJob(data)
    } catch (err) {
      toast(err.response?.data?.detail || 'Failed to submit job', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px', display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
      {/* Left: Form */}
      <div style={{ flex: '1', minWidth: '300px' }}>
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '26px', marginBottom: '4px' }}>Generate</h1>
          <p style={{ color: 'var(--text-1)', fontSize: '13px' }}>SD 1.5 via ComfyUI on Colab</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Textarea
            label="Positive prompt"
            rows={4}
            value={params.positive_prompt}
            onChange={e => set('positive_prompt')(e.target.value)}
            placeholder="a beautiful mountain landscape, cinematic lighting, photorealistic…"
          />
          <Textarea
            label="Negative prompt"
            rows={2}
            value={params.negative_prompt}
            onChange={e => set('negative_prompt')(e.target.value)}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-1)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Width</label>
              <select
                value={params.width}
                onChange={e => set('width')(parseInt(e.target.value))}
                style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-0)', fontFamily: 'var(--font-mono)', fontSize: '13px', outline: 'none' }}
              >
                {[512, 640, 768].map(v => <option key={v} value={v}>{v}px</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-1)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Height</label>
              <select
                value={params.height}
                onChange={e => set('height')(parseInt(e.target.value))}
                style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-0)', fontFamily: 'var(--font-mono)', fontSize: '13px', outline: 'none' }}
              >
                {[512, 640, 768].map(v => <option key={v} value={v}>{v}px</option>)}
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced(v => !v)}
            style={{ background: 'none', border: 'none', color: 'var(--text-2)', fontSize: '12px', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', padding: 0 }}
          >
            {showAdvanced ? '▾' : '▸'} Advanced settings
          </button>

          {showAdvanced && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', padding: '16px', background: 'var(--bg-2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <Slider label="Steps" value={params.steps} min={1} max={50} onChange={set('steps')} />
              <Slider label="CFG scale" value={params.cfg} min={1} max={20} step={0.5} onChange={set('cfg')} />
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-1)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Sampler</label>
                <select
                  value={params.sampler}
                  onChange={e => set('sampler')(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-0)', fontFamily: 'var(--font-mono)', fontSize: '13px', outline: 'none' }}
                >
                  {SAMPLERS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <Input
                label="Seed (-1 = random)"
                type="number"
                value={params.seed}
                onChange={e => set('seed')(parseInt(e.target.value))}
              />
            </div>
          )}

          <Button
            type="submit"
            loading={submitting}
            disabled={!!job && (job.status === 'running' || job.status === 'pending')}
            style={{ justifyContent: 'center', padding: '14px', fontSize: '14px' }}
          >
            Generate image
          </Button>
        </form>
      </div>

      {/* Right: Result */}
      <div style={{ flex: '1', minWidth: '280px' }}>
        {job ? (
          <JobResult job={job} onReset={() => setJob(null)} />
        ) : (
          <div style={{
            height: '300px',
            border: '1px dashed var(--border)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '10px',
            color: 'var(--text-2)',
            fontSize: '13px',
          }}>
            <div style={{ fontSize: '32px', opacity: 0.3 }}>◻</div>
            <span>Your image will appear here</span>
          </div>
        )}
      </div>
    </div>
  )
}
