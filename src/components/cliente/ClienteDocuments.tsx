'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { type Document } from '@/types/database'
import { formatDate } from '@/lib/utils'
import { validateFile, sanitizeFileName } from '@/lib/upload'
import { ArrowLeftRight, Download, Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { DocumentViewerModal } from './DocumentViewerModal'
import { DocumentConverterModal } from './DocumentConverterModal'

interface Props {
  leadId: string
  initialDocs: Document[]
}

const menuItemStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  background: 'transparent',
  border: 'none',
  borderRadius: 6,
  padding: '8px 10px',
  fontSize: 12,
  color: '#cfcfcf',
  cursor: 'pointer',
  textAlign: 'left',
}

export function ClienteDocuments({ leadId, initialDocs }: Props) {
  const [docs, setDocs] = useState(initialDocs)
  const [uploading, setUploading] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [busyDocId, setBusyDocId] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [viewingDoc, setViewingDoc] = useState<Document | null>(null)
  const [convertingDoc, setConvertingDoc] = useState<Document | null>(null)
  const supabase = createClient()

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return

    for (const file of files) {
      const validationError = validateFile(file)
      if (validationError) { alert(validationError); continue }
    }

    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser()

    for (const file of files) {
      if (validateFile(file)) continue
      const safeName = sanitizeFileName(file.name)
      const ext = safeName.split('.').pop()
      const path = `${leadId}/${crypto.randomUUID()}-${safeName}`

      const { error: uploadError } = await supabase.storage
        .from('documentos')
        .upload(path, file)

      if (!uploadError) {
        const { data: doc } = await supabase.from('documents').insert({
          lead_id: leadId,
          name: safeName,
          type: ext ?? 'arquivo',
          storage_path: path,
          uploaded_by: user?.id ?? 'unknown',
        }).select().single()

        if (doc) setDocs(prev => [...prev, doc as Document])
      }
    }

    setUploading(false)
    e.target.value = ''
  }

  async function handleDownload(doc: Document) {
    setOpenMenuId(null)
    const { data } = await supabase.storage
      .from('documentos')
      .createSignedUrl(doc.storage_path, 3600)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  function startRename(doc: Document) {
    setOpenMenuId(null)
    setRenamingId(doc.id)
    setRenameValue(doc.name)
  }

  async function handleRename(doc: Document) {
    const nextName = renameValue.trim()
    if (!nextName || nextName === doc.name) {
      setRenamingId(null)
      setRenameValue('')
      return
    }

    setBusyDocId(doc.id)

    const { data, error } = await supabase
      .from('documents')
      .update({
        name: nextName,
        type: nextName.split('.').pop() || doc.type,
      })
      .eq('id', doc.id)
      .select()
      .single()

    if (!error && data) {
      setDocs(prev => prev.map(item => item.id === doc.id ? data as Document : item))
      setRenamingId(null)
      setRenameValue('')
    }

    setBusyDocId(null)
  }

  async function handleDelete(doc: Document) {
    setOpenMenuId(null)
    const confirmed = window.confirm(`Excluir o documento "${doc.name}"?`)
    if (!confirmed) return

    setBusyDocId(doc.id)

    const { error: storageError } = await supabase.storage
      .from('documentos')
      .remove([doc.storage_path])

    if (!storageError) {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', doc.id)

      if (!error) setDocs(prev => prev.filter(item => item.id !== doc.id))
    }

    setBusyDocId(null)
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
          <input
            type="file"
            hidden
            onChange={handleUpload}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            disabled={uploading}
            multiple
          />
        </label>
      </div>

      {docs.length === 0 && (
        <p style={{ fontSize: 12, color: '#555' }}>Nenhum documento enviado.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {docs.map(doc => {
          const isRenaming = renamingId === doc.id
          const isBusy = busyDocId === doc.id

          return (
            <div
              key={doc.id}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 12, padding: '9px 12px', background: '#161616', border: '1px solid #222',
                borderRadius: 8, position: 'relative',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                {isRenaming ? (
                  <input
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleRename(doc)
                      if (e.key === 'Escape') {
                        setRenamingId(null)
                        setRenameValue('')
                      }
                    }}
                    autoFocus
                    style={{
                      width: '100%',
                      background: '#111',
                      border: '1px solid #333',
                      borderRadius: 6,
                      color: '#f0f0f0',
                      fontSize: 12,
                      padding: '6px 8px',
                      outline: 'none',
                    }}
                  />
                ) : (
                  <div
                    onClick={() => setViewingDoc(doc)}
                    style={{ fontSize: 12, color: '#f0f0f0', wordBreak: 'break-word', cursor: 'pointer' }}
                    title="Clique para visualizar"
                  >{doc.name}</div>
                )}
                <div style={{ fontSize: 10, color: '#555', marginTop: 3 }}>{formatDate(doc.uploaded_at)}</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                {isRenaming ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleRename(doc)}
                      disabled={isBusy}
                      style={{
                        background: '#10b98122',
                        border: '1px solid #10b98155',
                        borderRadius: 6,
                        padding: '5px 10px',
                        fontSize: 11,
                        color: '#10b981',
                        cursor: isBusy ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={() => { setRenamingId(null); setRenameValue('') }}
                      disabled={isBusy}
                      style={{
                        background: 'none',
                        border: '1px solid #222',
                        borderRadius: 6,
                        padding: '5px 10px',
                        fontSize: 11,
                        color: '#999',
                        cursor: isBusy ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <button
                      type="button"
                      aria-label={`Ações do documento ${doc.name}`}
                      title="Ações"
                      onClick={(event) => {
                        event.stopPropagation()
                        setOpenMenuId(openMenuId === doc.id ? null : doc.id)
                      }}
                      disabled={isBusy}
                      style={{
                        width: 30,
                        height: 30,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#111',
                        border: '1px solid #2a2a2a',
                        borderRadius: 8,
                        color: '#999',
                        cursor: isBusy ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    {openMenuId === doc.id && (
                      <div style={{
                        position: 'absolute',
                        top: 34,
                        right: 0,
                        zIndex: 20,
                        width: 150,
                        background: '#0d0d0d',
                        border: '1px solid #2a2a2a',
                        borderRadius: 10,
                        padding: 6,
                        boxShadow: '0 18px 40px #00000088',
                      }}>
                        <button type="button" onClick={() => { setOpenMenuId(null); setViewingDoc(doc) }} style={menuItemStyle}>
                          <Eye size={14} />
                          Visualizar
                        </button>
                        <button type="button" onClick={() => handleDownload(doc)} style={menuItemStyle}>
                          <Download size={14} />
                          Baixar
                        </button>
                        <button type="button" onClick={() => { setOpenMenuId(null); setConvertingDoc(doc) }} style={menuItemStyle}>
                          <ArrowLeftRight size={14} />
                          Converter
                        </button>
                        <button type="button" onClick={() => startRename(doc)} style={menuItemStyle}>
                          <Pencil size={14} />
                          Renomear
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(doc)}
                          style={{ ...menuItemStyle, color: '#ef5350' }}
                        >
                          <Trash2 size={14} />
                          Excluir
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {viewingDoc && (
        <DocumentViewerModal doc={viewingDoc} onClose={() => setViewingDoc(null)} />
      )}

      {convertingDoc && (
        <DocumentConverterModal
          doc={convertingDoc}
          onClose={() => setConvertingDoc(null)}
          onConverted={(newDoc) => {
            setDocs(prev => prev.map(d => d.id === newDoc.id ? newDoc : d))
            setConvertingDoc(null)
          }}
        />
      )}
    </div>
  )
}
