import { useEffect, useRef, useState } from 'react'
import { generateApi } from '../api/client'

const WS_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000')
  .replace(/^http/, 'ws')

/**
 * Connects to /ws/{jobId}?token=<JWT> and returns live progress state.
 * Falls back to HTTP polling when WebSocket closes to catch final status.
 */
export function useJobProgress(jobId, initialStatus = 'pending') {
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState(initialStatus)
  const [imageUrl, setImageUrl] = useState(null)
  const wsRef = useRef(null)
  const pollRef = useRef(null)

  useEffect(() => {
    if (!jobId) return
    if (initialStatus === 'done' || initialStatus === 'failed') return

    const token = localStorage.getItem('ps_token')
    if (!token) return

    // Poll the job API to get final status + image_url
    const pollJobStatus = async () => {
      try {
        const { data } = await generateApi.getJob(jobId)
        setProgress(data.progress)
        setStatus(data.status)
        if (data.image_url) setImageUrl(data.image_url)

        // Keep polling if still running
        if (data.status === 'running' || data.status === 'pending') {
          pollRef.current = setTimeout(pollJobStatus, 2000)
        }
      } catch {
        // ignore
      }
    }

    // Connect WebSocket for real-time updates
    const url = `${WS_BASE}/ws/${jobId}?token=${token}`
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        if (msg.progress !== undefined) setProgress(msg.progress)
        if (msg.status) setStatus(msg.status)
      } catch { /* ignore */ }
    }

    ws.onerror = () => {
      // WS failed — fall back to polling
      pollJobStatus()
    }

    ws.onclose = () => {
      // WS closed — poll once to get final status and image_url
      pollJobStatus()
    }

    return () => {
      ws.close()
      if (pollRef.current) clearTimeout(pollRef.current)
    }
  }, [jobId, initialStatus])

  return { progress, status, imageUrl }
}
