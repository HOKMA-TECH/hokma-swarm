'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Document } from '@/types/database'

const IMAGE_EXTS = new Set(['jpg','jpeg','png','gif','webp','heic','heif','avif','bmp','tiff','tif'])

function getExt(doc: Document) { return (doc.type ?? doc.name.split('.').pop() ?? '').toLowerCase() }
function isImageDoc(doc: Document) { return IMAGE_EXTS.has(getExt(doc)) }
function isHeicDoc(doc: Document) { return ['heic','heif'].includes(getExt(doc)) }
function isPdfDoc(doc: Document) { return getExt(doc) === 'pdf' }

/* ── Liquid progress bar ──────────────────────────────────── */
function LiquidProgressBar({ progress }: { progress: number }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: 48, borderRadius: 24, overflow: 'hidden', background: '#111', border: '1px solid #1c1c1c' }}>
      {/* Liquid fill */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: `${progress}%`,
        background: 'linear-gradient(90deg, #059669, #10b981, #34d399, #10b981, #059669)',
        backgroundSize: '300% 100%',
        animation: 'liquidShimmer 1.8s linear infinite',
        transition: 'width 0.35s cubic-bezier(0.4,0,0.2,1)',
        borderRadius: 24,
      }}>
        {/* Shine stripe */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '45%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 100%)',
          borderRadius: '24px 24px 0 0',
        }} />
      </div>
      {/* Percentage text */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, fontWeight: 800, letterSpacing: '0.04em',
        color: progress > 50 ? '#052e16' : '#10b981',
        textShadow: progress > 50 ? 'none' : '0 0 8px #10b98166',
        transition: 'color 0.3s',
      }}>
        {Math.round(progress)}%
      </div>
    </div>
  )
}

/* ── Crop area ────────────────────────────────────────────── */
type Crop = { x: number; y: number; w: number; h: number }

function CropArea({ objectUrl, crop, onChange }: {
  objectUrl: string
  crop: Crop
  onChange: (c: Crop) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState<'body' | 'nw' | 'ne' | 'sw' | 'se' | null>(null)
  const startRef = useRef({ mx: 0, my: 0, crop: { x: 0, y: 0, w: 100, h: 100 } })

  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

  function onMD(e: React.MouseEvent, handle: 'body' | 'nw' | 'ne' | 'sw' | 'se') {
    e.stopPropagation(); e.preventDefault()
    setDragging(handle)
    startRef.current = { mx: e.clientX, my: e.clientY, crop: { ...crop } }
  }

  useEffect(() => {
    if (!dragging) return
    const move = (e: MouseEvent) => {
      const el = containerRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const dx = ((e.clientX - startRef.current.mx) / r.width) * 100
      const dy = ((e.clientY - startRef.current.my) / r.height) * 100
      const s = startRef.current.crop
      let next: Crop
      if (dragging === 'body') {
        next = { x: clamp(s.x + dx, 0, 100 - s.w), y: clamp(s.y + dy, 0, 100 - s.h), w: s.w, h: s.h }
      } else if (dragging === 'se') {
        next = { x: s.x, y: s.y, w: clamp(s.w + dx, 5, 100 - s.x), h: clamp(s.h + dy, 5, 100 - s.y) }
      } else if (dragging === 'sw') {
        const nx = clamp(s.x + dx, 0, s.x + s.w - 5)
        next = { x: nx, y: s.y, w: s.x + s.w - nx, h: clamp(s.h + dy, 5, 100 - s.y) }
      } else if (dragging === 'ne') {
        const ny = clamp(s.y + dy, 0, s.y + s.h - 5)
        next = { x: s.x, y: ny, w: clamp(s.w + dx, 5, 100 - s.x), h: s.y + s.h - ny }
      } else {
        const nx = clamp(s.x + dx, 0, s.x + s.w - 5)
        const ny = clamp(s.y + dy, 0, s.y + s.h - 5)
        next = { x: nx, y: ny, w: s.x + s.w - nx, h: s.y + s.h - ny }
      }
      onChange(next)
    }
    const up = () => setDragging(null)
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
  }, [dragging, onChange])

  const cornerStyle = (pos: 'nw' | 'ne' | 'sw' | 'se'): React.CSSProperties => {
    const base: React.CSSProperties = { position: 'absolute', width: 14, height: 14, background: '#10b981', border: '2px solid #fff', borderRadius: 3, zIndex: 2 }
    if (pos === 'nw') return { ...base, top: -7, left: -7, cursor: 'nw-resize' }
    if (pos === 'ne') return { ...base, top: -7, right: -7, cursor: 'ne-resize' }
    if (pos === 'sw') return { ...base, bottom: -7, left: -7, cursor: 'sw-resize' }
    return { ...base, bottom: -7, right: -7, cursor: 'se-resize' }
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', userSelect: 'none', lineHeight: 0, borderRadius: 8, overflow: 'hidden' }}>
      <img src={objectUrl} alt="" style={{ width: '100%', display: 'block', maxHeight: 340, objectFit: 'contain' }} draggable={false} />

      {/* Dark mask — 4 rects around the crop */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: `${crop.y}%`, background: 'rgba(0,0,0,0.6)' }} />
        <div style={{ position: 'absolute', top: `${crop.y + crop.h}%`, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)' }} />
        <div style={{ position: 'absolute', top: `${crop.y}%`, left: 0, width: `${crop.x}%`, height: `${crop.h}%`, background: 'rgba(0,0,0,0.6)' }} />
        <div style={{ position: 'absolute', top: `${crop.y}%`, left: `${crop.x + crop.w}%`, right: 0, height: `${crop.h}%`, background: 'rgba(0,0,0,0.6)' }} />
      </div>

      {/* Crop rectangle */}
      <div
        onMouseDown={e => onMD(e, 'body')}
        style={{
          position: 'absolute',
          left: `${crop.x}%`, top: `${crop.y}%`,
          width: `${crop.w}%`, height: `${crop.h}%`,
          border: '2px solid #10b981',
          cursor: dragging === 'body' ? 'grabbing' : 'grab',
          boxSizing: 'border-box',
        }}
      >
        {/* Rule-of-thirds grid */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {[33.3, 66.6].map(p => (
            <div key={p} style={{ position: 'absolute', left: `${p}%`, top: 0, bottom: 0, borderLeft: '1px solid rgba(16,185,129,0.3)' }} />
          ))}
          {[33.3, 66.6].map(p => (
            <div key={p} style={{ position: 'absolute', top: `${p}%`, left: 0, right: 0, borderTop: '1px solid rgba(16,185,129,0.3)' }} />
          ))}
        </div>
        <div onMouseDown={e => onMD(e, 'nw')} style={cornerStyle('nw')} />
        <div onMouseDown={e => onMD(e, 'ne')} style={cornerStyle('ne')} />
        <div onMouseDown={e => onMD(e, 'sw')} style={cornerStyle('sw')} />
        <div onMouseDown={e => onMD(e, 'se')} style={cornerStyle('se')} />
      </div>
    </div>
  )
}

/* ── Main converter modal ─────────────────────────────────── */
interface Props {
  doc: Document
  onClose: () => void
  onConverted: (newDoc: Document) => void
}

type Phase = 'loading' | 'ready' | 'converting' | 'done' | 'error'

export function DocumentConverterModal({ doc, onClose, onConverted }: Props) {
  const supabase = createClient()
  const blobRef = useRef<Blob | null>(null)
  const urlRef = useRef('')
  const [phase, setPhase] = useState<Phase>('loading')
  const [objectUrl, setObjectUrl] = useState('')
  const [crop, setCrop] = useState<Crop>({ x: 0, y: 0, w: 100, h: 100 })
  const [progress, setProgress] = useState(0)
  const [errMsg, setErrMsg] = useState('')

  const isImg = isImageDoc(doc)
  const isHeic = isHeicDoc(doc)
  const isPdf = isPdfDoc(doc)

  const animProg = useCallback((from: number, to: number, ms: number): Promise<void> => {
    return new Promise(resolve => {
      const t0 = Date.now()
      const tick = () => {
        const pct = Math.min((Date.now() - t0) / ms, 1)
        setProgress(from + (to - from) * pct)
        if (pct < 1) requestAnimationFrame(tick)
        else resolve()
      }
      requestAnimationFrame(tick)
    })
  }, [])

  // Load file on mount
  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.storage.from('documentos').createSignedUrl(doc.storage_path, 7200)
      if (!data?.signedUrl) { setPhase('error'); setErrMsg('Erro ao carregar arquivo.'); return }

      const resp = await fetch(data.signedUrl)
      let blob = await resp.blob()

      // HEIC → JPEG
      if (isHeic) {
        const heic2any = (await import('heic2any')).default as (opts: object) => Promise<Blob | Blob[]>
        const result = await heic2any({ blob, toType: 'image/jpeg', quality: 0.92 })
        blob = Array.isArray(result) ? result[0] : result
      }

      blobRef.current = blob
      const url = URL.createObjectURL(blob)
      urlRef.current = url
      setObjectUrl(url)
      setPhase('ready')
    })().catch(err => { setPhase('error'); setErrMsg(err?.message ?? 'Erro ao carregar.') })

    return () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current) }
  }, [])

  async function handleConvert() {
    if (!blobRef.current) return
    setPhase('converting')
    setProgress(0)

    try {
      let resultBlob: Blob
      let newName: string
      let newType: string

      if (isImg || isHeic) {
        // ── Image → PDF ──
        await animProg(0, 20, 400)

        const img = new Image()
        img.src = objectUrl
        await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error('Falha ao carregar imagem.')) })

        const srcX = img.naturalWidth * (crop.x / 100)
        const srcY = img.naturalHeight * (crop.y / 100)
        const srcW = img.naturalWidth * (crop.w / 100)
        const srcH = img.naturalHeight * (crop.h / 100)
        if (srcW < 1 || srcH < 1) throw new Error('Área de corte muito pequena.')

        const canvas = document.createElement('canvas')
        canvas.width = Math.round(srcW)
        canvas.height = Math.round(srcH)
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Canvas não disponível.')
        ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, canvas.width, canvas.height)

        await animProg(20, 45, 400)

        const pngBlob = await new Promise<Blob>((res, rej) =>
          canvas.toBlob(b => b ? res(b) : rej(new Error('Erro ao gerar PNG.')), 'image/png')
        )

        await animProg(45, 65, 400)

        const { PDFDocument } = await import('pdf-lib')
        const pdfDoc = await PDFDocument.create()
        const pngImg = await pdfDoc.embedPng(await pngBlob.arrayBuffer())
        const page = pdfDoc.addPage([pngImg.width, pngImg.height])
        page.drawImage(pngImg, { x: 0, y: 0, width: pngImg.width, height: pngImg.height })

        await animProg(65, 88, 400)

        resultBlob = new Blob([new Uint8Array(await pdfDoc.save())], { type: 'application/pdf' })
        newName = doc.name.replace(/\.[^/.]+$/, '') + '.pdf'
        newType = 'pdf'

        await animProg(88, 95, 300)
      } else if (isPdf) {
        // ── PDF → PNG ──
        await animProg(0, 15, 300)

        const pdfBytes = new Uint8Array(await blobRef.current.arrayBuffer())

        await animProg(15, 35, 400)

        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

        const pdfDoc = await pdfjsLib.getDocument({ data: pdfBytes }).promise
        const page = await pdfDoc.getPage(1)
        const vp = page.getViewport({ scale: 2.5 })

        const canvas = document.createElement('canvas')
        canvas.width = Math.round(vp.width)
        canvas.height = Math.round(vp.height)
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Canvas não disponível.')

        await animProg(35, 65, 800)

        await page.render({ canvasContext: ctx as CanvasRenderingContext2D, viewport: vp, canvas } as Parameters<typeof page.render>[0]).promise

        await animProg(65, 88, 500)

        resultBlob = await new Promise<Blob>((res, rej) =>
          canvas.toBlob(b => b ? res(b) : rej(new Error('Erro ao gerar PNG.')), 'image/png')
        )
        newName = doc.name.replace(/\.pdf$/i, '') + '.png'
        newType = 'png'

        await animProg(88, 95, 200)
      } else {
        throw new Error('Tipo de arquivo não suportado para conversão.')
      }

      // ── Upload new file ──
      const newPath = doc.lead_id + '/' + crypto.randomUUID() + '-' + newName
      const { error: upErr } = await supabase.storage.from('documentos').upload(newPath, resultBlob)
      if (upErr) throw upErr

      // ── Update DB record (same id) ──
      const { data: updated, error: dbErr } = await supabase
        .from('documents')
        .update({ name: newName, type: newType, storage_path: newPath })
        .eq('id', doc.id)
        .select()
        .single()
      if (dbErr) throw dbErr

      // ── Delete old storage file ──
      await supabase.storage.from('documentos').remove([doc.storage_path])

      await animProg(95, 100, 300)

      onConverted(updated as Document)
      setPhase('done')
    } catch (err: unknown) {
      setPhase('error')
      setErrMsg((err as Error).message ?? 'Erro ao converter.')
    }
  }

  const btnLabel = isImg || isHeic ? 'Converter para PDF →' : 'Converter para PNG →'

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: '#111', border: '1px solid #222', borderRadius: 16, width: 560, maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 40px 100px rgba(0,0,0,0.9)', animation: 'fadeUp 0.2s ease both' }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1c1c1c', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f0f0' }}>Conversor de Documento</div>
            <div style={{ fontSize: 11, color: '#555', marginTop: 3 }}>
              {isImg || isHeic ? 'Imagem → PDF' : isPdf ? 'PDF → Imagem (PNG)' : 'Conversão'}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>×</button>
        </div>

        {/* Body */}
        <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {phase === 'loading' && (
            <div style={{ textAlign: 'center', padding: '50px 0', color: '#444', fontSize: 13 }}>
              Carregando arquivo...
            </div>
          )}

          {phase === 'ready' && (isImg || isHeic) && objectUrl && (
            <div>
              <div style={{ fontSize: 11, color: '#555', marginBottom: 12 }}>
                Arraste os cantos verdes para ajustar o corte antes de converter para PDF.
              </div>
              <CropArea objectUrl={objectUrl} crop={crop} onChange={setCrop} />
              <button
                onClick={() => setCrop({ x: 0, y: 0, w: 100, h: 100 })}
                style={{ marginTop: 10, background: 'none', border: '1px solid #222', borderRadius: 6, padding: '5px 12px', fontSize: 11, color: '#555', cursor: 'pointer' }}
              >
                Resetar corte
              </button>
            </div>
          )}

          {phase === 'ready' && isPdf && (
            <div style={{ textAlign: 'center', padding: '28px 0' }}>
              <div style={{ fontSize: 52, marginBottom: 14 }}>📄</div>
              <div style={{ fontSize: 14, color: '#f0f0f0', fontWeight: 600, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{doc.name}</div>
              <div style={{ fontSize: 12, color: '#555', lineHeight: 1.6 }}>
                A primeira página do PDF será convertida para PNG em alta resolução (2.5×).
              </div>
            </div>
          )}

          {phase === 'converting' && (
            <div style={{ padding: '28px 0' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f0f0', textAlign: 'center', marginBottom: 6 }}>Convertendo...</div>
              <div style={{ fontSize: 12, color: '#555', textAlign: 'center', marginBottom: 24 }}>
                {isImg || isHeic ? 'Gerando PDF a partir da imagem...' : 'Renderizando PDF em alta resolução...'}
              </div>
              <LiquidProgressBar progress={progress} />
            </div>
          )}

          {phase === 'done' && (
            <div style={{ textAlign: 'center', padding: '36px 0' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
              <div style={{ fontSize: 16, color: '#10b981', fontWeight: 700, marginBottom: 8 }}>Conversão concluída!</div>
              <div style={{ fontSize: 12, color: '#555', lineHeight: 1.6 }}>O arquivo original foi substituído automaticamente.</div>
            </div>
          )}

          {phase === 'error' && (
            <div style={{ padding: 20, background: '#ef535011', border: '1px solid #ef535033', borderRadius: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: '#ef5350', fontWeight: 600, marginBottom: 8 }}>Erro na conversão</div>
              <div style={{ fontSize: 12, color: '#ef5350' }}>{errMsg}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid #1c1c1c', display: 'flex', gap: 10, flexShrink: 0 }}>
          {phase === 'done' ? (
            <button onClick={onClose} style={{ flex: 1, background: '#10b981', border: 'none', borderRadius: 8, padding: '11px', color: '#000', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Concluído ✓
            </button>
          ) : (
            <>
              <button onClick={onClose} style={{ flex: 1, background: '#161616', border: '1px solid #222', borderRadius: 8, padding: '11px', color: '#999', fontSize: 13, cursor: 'pointer' }}>
                Cancelar
              </button>
              {phase === 'ready' && (
                <button onClick={handleConvert} style={{ flex: 2, background: '#10b981', border: 'none', borderRadius: 8, padding: '11px', color: '#000', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  {btnLabel}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
