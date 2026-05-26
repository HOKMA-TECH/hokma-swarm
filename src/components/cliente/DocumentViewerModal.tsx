'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Document } from '@/types/database'

const IMAGE_EXTS = new Set(['jpg','jpeg','png','gif','webp','heic','heif','avif','bmp','tiff','tif','svg'])

function ext(doc: Document) { return (doc.type ?? doc.name.split('.').pop() ?? '').toLowerCase() }
function isImg(doc: Document) { return IMAGE_EXTS.has(ext(doc)) }
function isPdf(doc: Document) { return ext(doc) === 'pdf' }

async function downloadBlob(url: string, filename: string) {
  const res = await fetch(url)
  const blob = await res.blob()
  const blobUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = filename
  a.click()
  URL.revokeObjectURL(blobUrl)
}

export function DocumentViewerModal({ doc, onClose }: { doc: Document; onClose: () => void }) {
  const supabase = createClient()
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    supabase.storage.from('documentos').createSignedUrl(doc.storage_path, 7200)
      .then(({ data }) => { setUrl(data?.signedUrl ?? null); setLoading(false) })
  }, [doc.storage_path])

  const image = isImg(doc)
  const pdf = isPdf(doc)

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: '#0d0d0d', border: '1px solid #222', borderRadius: 16,
        width: pdf ? '90vw' : 'auto', maxWidth: pdf ? 980 : '88vw',
        height: pdf ? '90vh' : 'auto', maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 40px 100px rgba(0,0,0,0.9)',
        animation: 'fadeUp 0.2s ease both',
      }}>
        {/* Header */}
        <div style={{ padding: '12px 18px', borderBottom: '1px solid #1c1c1c', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <span style={{ fontSize: 20 }}>{pdf ? '📄' : '🖼'}</span>
          <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#f0f0f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {doc.name}
          </span>
          {url && (
            <button
              onClick={async () => {
                setDownloading(true)
                await downloadBlob(url, doc.name)
                setDownloading(false)
              }}
              disabled={downloading}
              style={{ background: '#10b98122', border: '1px solid #10b98144', borderRadius: 8, padding: '6px 14px', fontSize: 12, color: '#10b981', fontWeight: 600, flexShrink: 0, cursor: downloading ? 'not-allowed' : 'pointer', opacity: downloading ? 0.6 : 1 }}
            >
              {downloading ? 'Baixando...' : '↓ Download'}
            </button>
          )}
          <button
            onClick={onClose}
            style={{ background: '#161616', border: '1px solid #222', borderRadius: 8, padding: '6px 12px', color: '#888', cursor: 'pointer', fontSize: 16, flexShrink: 0 }}
          >×</button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080808', borderRadius: '0 0 16px 16px', position: 'relative' }}>
          {loading && (
            <div style={{ color: '#444', fontSize: 13 }}>Carregando...</div>
          )}
          {!loading && !url && (
            <div style={{ color: '#ef5350', fontSize: 13 }}>Erro ao carregar o arquivo.</div>
          )}
          {!loading && url && pdf && (
            <iframe
              src={url + '#toolbar=1&navpanes=0'}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title={doc.name}
            />
          )}
          {!loading && url && image && (
            <img
              src={url}
              alt={doc.name}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block', borderRadius: 4 }}
            />
          )}
          {!loading && url && !pdf && !image && (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>📄</div>
              <div style={{ fontSize: 13, color: '#555', marginBottom: 16 }}>Pré-visualização não disponível para este tipo de arquivo.</div>
              <a href={url} download={doc.name} style={{ color: '#10b981', fontSize: 13 }}>Baixar arquivo</a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
