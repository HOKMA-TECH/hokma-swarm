'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { type Document } from '@/types/database'
import { formatDate } from '@/lib/utils'

interface Props {
  leadId: string
  initialDocs: Document[]
}

export function ClienteDocuments({ leadId, initialDocs }: Props) {
  const [docs, setDocs] = useState(initialDocs)
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)

    const ext = file.name.split('.').pop()
    const path = `${leadId}/${crypto.randomUUID()}-${file.name}`

    const { error: uploadError } = await supabase.storage
      .from('documentos')
      .upload(path, file)

    if (!uploadError) {
      const { data: doc } = await supabase.from('documents').insert({
        lead_id: leadId,
        name: file.name,
        type: ext ?? 'arquivo',
        storage_path: path,
        uploaded_by: 'corretor',
      }).select().single()

      if (doc) setDocs(prev => [...prev, doc as Document])
    }
    setUploading(false)
    e.target.value = ''
  }

  async function handleDownload(doc: Document) {
    const { data } = await supabase.storage
      .from('documentos')
      .createSignedUrl(doc.storage_path, 3600)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  return (
    <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 600 }}>Documentos</div>
        <label style={{
          background: '#10b98122', border: '1px solid #10b981', borderRadius: 8,
          padding: '5px 12px', fontSize: 11, color: '#10b981', cursor: 'pointer', fontWeight: 600,
        }}>
          {uploading ? 'Enviando...' : '+ Upload'}
          <input type="file" hidden onChange={handleUpload} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
        </label>
      </div>

      {docs.length === 0 && (
        <p style={{ fontSize: 12, color: '#555' }}>Nenhum documento enviado.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {docs.map(doc => (
          <div
            key={doc.id}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '9px 12px', background: '#161616', border: '1px solid #222',
              borderRadius: 8,
            }}
          >
            <div>
              <div style={{ fontSize: 12, color: '#f0f0f0' }}>{doc.name}</div>
              <div style={{ fontSize: 10, color: '#555' }}>{formatDate(doc.uploaded_at)}</div>
            </div>
            <button
              onClick={() => handleDownload(doc)}
              style={{
                background: 'none', border: '1px solid #222', borderRadius: 6,
                padding: '4px 10px', fontSize: 11, color: '#999', cursor: 'pointer',
              }}
            >
              ↓ Baixar
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
