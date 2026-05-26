'use client'

import { useState, useRef, useCallback } from 'react'
import {
  imagesToPdf, mergePdfs, splitPdf, removePages, extractPages,
  addWatermark, pdfToImages, compressPdf,
  downloadBytes, downloadDataUrl, formatBytes,
} from '@/lib/conversor'

// ── Tool Definitions ──────────────────────────────────────────────────────────

const CATEGORY_COLOR: Record<string, string> = {
  'converter-em': '#f59e0b',
  'converter-de': '#3b82f6',
  'organizar':    '#8b5cf6',
  'otimizar':     '#10b981',
}

const TOOLS = [
  { id: 'images-to-pdf', label: 'Imagens → PDF',   desc: 'Converte JPG, PNG, HEIC, WebP em um PDF',      category: 'converter-em', emoji: '🖼️', accept: '.jpg,.jpeg,.png,.heic,.heif,.webp', multiple: true  },
  { id: 'pdf-to-image',  label: 'PDF → Imagem',    desc: 'Cada página do PDF em JPG ou PNG',             category: 'converter-de', emoji: '📸', accept: '.pdf',                             multiple: false },
  { id: 'merge-pdf',     label: 'Mesclar PDFs',    desc: 'Combina vários PDFs em um único arquivo',      category: 'organizar',    emoji: '🔗', accept: '.pdf',                             multiple: true  },
  { id: 'split-pdf',     label: 'Dividir PDF',     desc: 'Separa por página ou por intervalo',           category: 'organizar',    emoji: '✂️', accept: '.pdf',                             multiple: false },
  { id: 'remove-pages',  label: 'Remover páginas', desc: 'Exclui páginas específicas do PDF',            category: 'organizar',    emoji: '🗑️', accept: '.pdf',                             multiple: false },
  { id: 'extract-pages', label: 'Extrair páginas', desc: 'Salva páginas selecionadas em novo PDF',       category: 'organizar',    emoji: '📋', accept: '.pdf',                             multiple: false },
  { id: 'watermark',     label: 'Marca d\'água',   desc: 'Adiciona texto em diagonal em cada página',    category: 'organizar',    emoji: '💧', accept: '.pdf',                             multiple: false },
  { id: 'compress-pdf',  label: 'Comprimir PDF',   desc: 'Reduz o tamanho do arquivo PDF',               category: 'otimizar',     emoji: '📦', accept: '.pdf',                             multiple: false },
] as const

type ToolId = typeof TOOLS[number]['id']
type Tool = typeof TOOLS[number]

// ── Drop Zone ─────────────────────────────────────────────────────────────────

function DropZone({ accept, multiple, onFiles }: { accept: string; multiple: boolean; onFiles: (f: File[]) => void }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handle = useCallback((files: FileList | null) => {
    if (!files) return
    const arr = Array.from(files)
    onFiles(multiple ? arr : [arr[0]])
  }, [multiple, onFiles])

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files) }}
      style={{
        border: `2px dashed ${dragging ? '#10b981' : '#2a2a2a'}`,
        borderRadius: 12, padding: '36px 20px', textAlign: 'center', cursor: 'pointer',
        background: dragging ? '#10b98108' : '#0d0d0d', transition: 'all 0.2s',
        userSelect: 'none',
      }}
    >
      <input ref={inputRef} type="file" accept={accept} multiple={multiple} style={{ display: 'none' }}
        onChange={e => handle(e.target.files)} />
      <div style={{ fontSize: 32, marginBottom: 10 }}>📂</div>
      <div style={{ fontSize: 13, color: '#aaa', marginBottom: 4 }}>
        Arraste arquivos aqui ou <span style={{ color: '#10b981', fontWeight: 600 }}>clique para selecionar</span>
      </div>
      <div style={{ fontSize: 11, color: '#555' }}>{accept.replace(/,/g, ', ')}</div>
    </div>
  )
}

// ── File List ─────────────────────────────────────────────────────────────────

function FileList({ files, onRemove, onMoveUp, onMoveDown }: {
  files: File[]; onRemove: (i: number) => void
  onMoveUp?: (i: number) => void; onMoveDown?: (i: number) => void
}) {
  if (!files.length) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
      {files.map((f, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 8, padding: '8px 12px',
        }}>
          <span style={{ fontSize: 16 }}>📄</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: '#ccc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
            <div style={{ fontSize: 10, color: '#555' }}>{formatBytes(f.size)}</div>
          </div>
          {onMoveUp && (
            <button onClick={() => onMoveUp(i)} disabled={i === 0} style={iconBtnStyle(i === 0)} title="Mover para cima">↑</button>
          )}
          {onMoveDown && (
            <button onClick={() => onMoveDown(i)} disabled={i === files.length - 1} style={iconBtnStyle(i === files.length - 1)} title="Mover para baixo">↓</button>
          )}
          <button onClick={() => onRemove(i)} style={iconBtnStyle(false)} title="Remover">✕</button>
        </div>
      ))}
    </div>
  )
}

const iconBtnStyle = (disabled: boolean): React.CSSProperties => ({
  background: 'none', border: 'none', color: disabled ? '#333' : '#666',
  cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 13, padding: '2px 4px', borderRadius: 4,
  transition: 'color 0.15s',
})

// ── Shared form style ─────────────────────────────────────────────────────────

const inputSt: React.CSSProperties = {
  background: '#0d0d0d', border: '1px solid #2a2a2a', borderRadius: 7,
  color: '#e0e0e0', fontSize: 13, padding: '8px 12px', outline: 'none', width: '100%', boxSizing: 'border-box',
}
const labelSt: React.CSSProperties = {
  fontSize: 11, color: '#666', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 5,
}

// ── Tool Panel ────────────────────────────────────────────────────────────────

type Result = { type: 'bytes'; data: Uint8Array; name: string } | { type: 'images'; items: { dataUrl: string; page: number }[]; ext: string }

function ToolPanel({ tool, onBack }: { tool: Tool; onBack: () => void }) {
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Result | null>(null)

  // Options
  const [splitMode, setSplitMode] = useState<'each' | 'range'>('each')
  const [splitRange, setSplitRange] = useState('')
  const [pagesStr, setPagesStr] = useState('')
  const [rotAngle, setRotAngle] = useState<90 | 180 | 270>(90)
  const [wmText, setWmText] = useState('')
  const [wmOpacity, setWmOpacity] = useState(0.2)
  const [pdfPassword, setPdfPassword] = useState('')
  const [imgFormat, setImgFormat] = useState<'jpeg' | 'png'>('jpeg')
  const [imgScale, setImgScale] = useState(2)
  const [splitResults, setSplitResults] = useState<{ data: Uint8Array; name: string }[]>([])

  function addFiles(newFiles: File[]) {
    setError(null); setResult(null); setSplitResults([])
    if (tool.multiple) setFiles(prev => [...prev, ...newFiles])
    else setFiles(newFiles)
  }

  function removeFile(i: number) { setFiles(f => f.filter((_, idx) => idx !== i)) }
  function moveUp(i: number) { setFiles(f => { const a = [...f]; [a[i-1], a[i]] = [a[i], a[i-1]]; return a }) }
  function moveDown(i: number) { setFiles(f => { const a = [...f]; [a[i], a[i+1]] = [a[i+1], a[i]]; return a }) }

  async function process() {
    if (!files.length) return setError('Selecione ao menos um arquivo.')
    setLoading(true); setError(null); setResult(null); setSplitResults([])
    try {
      const f = files[0]
      switch (tool.id) {
        case 'images-to-pdf': {
          const data = await imagesToPdf(files)
          setResult({ type: 'bytes', data, name: 'imagens.pdf' })
          break
        }
        case 'merge-pdf': {
          if (files.length < 2) throw new Error('Selecione ao menos 2 arquivos PDF.')
          const data = await mergePdfs(files)
          setResult({ type: 'bytes', data, name: 'mesclado.pdf' })
          break
        }
        case 'split-pdf': {
          if (splitMode === 'range' && !splitRange.trim()) throw new Error('Informe os intervalos de páginas.')
          const parts = await splitPdf(f, splitMode, splitRange)
          setSplitResults(parts)
          break
        }
        case 'remove-pages': {
          if (!pagesStr.trim()) throw new Error('Informe as páginas a remover.')
          const data = await removePages(f, pagesStr)
          setResult({ type: 'bytes', data, name: f.name.replace(/\.pdf$/i, '_editado.pdf') })
          break
        }
        case 'extract-pages': {
          if (!pagesStr.trim()) throw new Error('Informe as páginas a extrair.')
          const data = await extractPages(f, pagesStr)
          setResult({ type: 'bytes', data, name: f.name.replace(/\.pdf$/i, '_extraido.pdf') })
          break
        }
        case 'watermark': {
          if (!wmText.trim()) throw new Error('Informe o texto da marca d\'água.')
          const data = await addWatermark(f, wmText, wmOpacity)
          setResult({ type: 'bytes', data, name: f.name.replace(/\.pdf$/i, '_marca.pdf') })
          break
        }
        case 'pdf-to-image': {
          const items = await pdfToImages(f, imgFormat, imgScale, pdfPassword || undefined)
          setResult({ type: 'images', items, ext: imgFormat === 'jpeg' ? 'jpg' : 'png' })
          break
        }
        case 'compress-pdf': {
          const before = f.size
          const data = await compressPdf(f)
          const after = data.length
          const pct = Math.round((1 - after / before) * 100)
          const name = f.name.replace(/\.pdf$/i, '_comprimido.pdf')
          setResult({ type: 'bytes', data, name })
          if (pct <= 0) setError(`Arquivo já otimizado. Redução: ${pct < 0 ? 0 : pct}% (${formatBytes(before)} → ${formatBytes(after)})`)
          else setError(`✓ Redução de ${pct}% (${formatBytes(before)} → ${formatBytes(after)})`)
          break
        }
      }
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao processar o arquivo.')
    }
    setLoading(false)
  }

  const catColor = CATEGORY_COLOR[tool.category] ?? '#10b981'

  return (
    <div style={{ padding: 24, maxWidth: 680, margin: '0 auto' }}>
      {/* Header */}
      <button onClick={onBack} style={{
        background: 'none', border: 'none', color: '#666', fontSize: 12, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, padding: 0,
      }}>
        <span style={{ fontSize: 16 }}>←</span> Voltar para ferramentas
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <span style={{ fontSize: 28 }}>{tool.emoji}</span>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f0f0f0' }}>{tool.label}</h2>
      </div>
      <p style={{ fontSize: 13, color: '#555', marginBottom: 24 }}>{tool.desc}</p>

      {/* Drop zone */}
      <DropZone accept={tool.accept} multiple={tool.multiple} onFiles={addFiles} />

      {files.length > 0 && (
        <FileList
          files={files}
          onRemove={removeFile}
          onMoveUp={tool.multiple ? moveUp : undefined}
          onMoveDown={tool.multiple ? moveDown : undefined}
        />
      )}

      {/* Tool-specific options */}
      {files.length > 0 && (
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* PDF password — only pdfjs (pdf-to-image) actually decrypts */}
          {tool.id === 'pdf-to-image' && (
            <div>
              <label style={labelSt}>Senha do PDF (se protegido)</label>
              <input style={inputSt} type="password" placeholder="Deixe em branco se não houver senha" value={pdfPassword} onChange={e => setPdfPassword(e.target.value)} />
            </div>
          )}

          {tool.id === 'split-pdf' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelSt}>Modo de divisão</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {([['each', 'Uma página por arquivo'], ['range', 'Por intervalo']] as const).map(([v, l]) => (
                    <button key={v} onClick={() => setSplitMode(v)} style={{
                      padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: 'none',
                      background: splitMode === v ? catColor : '#1a1a1a', color: splitMode === v ? '#000' : '#888',
                    }}>{l}</button>
                  ))}
                </div>
              </div>
              {splitMode === 'range' && (
                <div>
                  <label style={labelSt}>Intervalos (ex: 1-3, 4-6, 7-10)</label>
                  <input style={inputSt} placeholder="1-3, 4-6, 7-10" value={splitRange} onChange={e => setSplitRange(e.target.value)} />
                </div>
              )}
            </div>
          )}

          {(tool.id === 'remove-pages' || tool.id === 'extract-pages') && (
            <div>
              <label style={labelSt}>Páginas (ex: 1, 3, 5-8)</label>
              <input style={inputSt} placeholder="1, 3, 5-8" value={pagesStr} onChange={e => setPagesStr(e.target.value)} />
            </div>
          )}

          {tool.id === 'watermark' && (
            <>
              <div>
                <label style={labelSt}>Texto da marca d'água</label>
                <input style={inputSt} placeholder="CONFIDENCIAL" value={wmText} onChange={e => setWmText(e.target.value)} />
              </div>
              <div>
                <label style={labelSt}>Opacidade: {Math.round(wmOpacity * 100)}%</label>
                <input type="range" min="5" max="60" value={wmOpacity * 100}
                  onChange={e => setWmOpacity(Number(e.target.value) / 100)}
                  style={{ width: '100%', accentColor: catColor }} />
              </div>
            </>
          )}

          {tool.id === 'pdf-to-image' && (
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <label style={labelSt}>Formato</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['jpeg', 'png'] as const).map(f => (
                    <button key={f} onClick={() => setImgFormat(f)} style={{
                      padding: '7px 18px', borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none',
                      background: imgFormat === f ? catColor : '#1a1a1a', color: imgFormat === f ? '#000' : '#888',
                    }}>{f.toUpperCase()}</button>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelSt}>Qualidade</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {([1, 2, 3] as const).map(s => (
                    <button key={s} onClick={() => setImgScale(s)} style={{
                      padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: 'none',
                      background: imgScale === s ? catColor : '#1a1a1a', color: imgScale === s ? '#000' : '#888',
                    }}>{['72', '144', '216'][s-1]} dpi</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Process button */}
          <button
            onClick={process} disabled={loading}
            style={{
              background: loading ? '#1a4a35' : catColor, color: loading ? '#888' : '#000',
              border: 'none', borderRadius: 8, padding: '11px 24px', fontSize: 14,
              fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4,
              display: 'flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
              transition: 'all 0.2s',
            }}
          >
            {loading ? (
              <>
                <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #555', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Processando…
              </>
            ) : `Converter`}
          </button>
        </div>
      )}

      {/* Error / info message */}
      {error && (
        <div style={{
          marginTop: 14, padding: '10px 14px', borderRadius: 8, fontSize: 12,
          background: error.startsWith('✓') ? '#10b98118' : '#ef444418',
          color: error.startsWith('✓') ? '#10b981' : '#ef4444',
          border: `1px solid ${error.startsWith('✓') ? '#10b98133' : '#ef444433'}`,
        }}>{error}</div>
      )}

      {/* Single file result */}
      {result?.type === 'bytes' && (
        <div style={{ marginTop: 16, padding: 16, background: '#0d0d0d', border: '1px solid #10b98133', borderRadius: 10 }}>
          <div style={{ fontSize: 12, color: '#10b981', marginBottom: 10, fontWeight: 600 }}>✓ Arquivo pronto!</div>
          <button
            onClick={() => downloadBytes(result.data, result.name)}
            style={{
              background: '#10b981', color: '#000', border: 'none', borderRadius: 7,
              padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >
            ⬇ Baixar {result.name}
          </button>
          <span style={{ fontSize: 11, color: '#555', marginLeft: 12 }}>{formatBytes(result.data.length)}</span>
        </div>
      )}

      {/* Split results */}
      {splitResults.length > 0 && (
        <div style={{ marginTop: 16, padding: 16, background: '#0d0d0d', border: '1px solid #10b98133', borderRadius: 10 }}>
          <div style={{ fontSize: 12, color: '#10b981', marginBottom: 12, fontWeight: 600 }}>✓ {splitResults.length} arquivo{splitResults.length !== 1 ? 's' : ''} gerado{splitResults.length !== 1 ? 's' : ''}!</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {splitResults.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  onClick={() => downloadBytes(r.data, r.name)}
                  style={{ background: '#1a4a35', color: '#10b981', border: '1px solid #10b98133', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  ⬇ {r.name}
                </button>
                <span style={{ fontSize: 11, color: '#555' }}>{formatBytes(r.data.length)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image results */}
      {result?.type === 'images' && (
        <div style={{ marginTop: 16, padding: 16, background: '#0d0d0d', border: '1px solid #10b98133', borderRadius: 10 }}>
          <div style={{ fontSize: 12, color: '#10b981', marginBottom: 12, fontWeight: 600 }}>✓ {result.items.length} página{result.items.length !== 1 ? 's' : ''} convertida{result.items.length !== 1 ? 's' : ''}!</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {result.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                <img src={item.dataUrl} alt={`Página ${item.page}`} style={{ width: '100%', borderRadius: 6, border: '1px solid #222' }} />
                <button
                  onClick={() => downloadDataUrl(item.dataUrl, `pagina_${item.page}.${result.ext}`)}
                  style={{ background: '#1a4a35', color: '#10b981', border: '1px solid #10b98133', borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', width: '100%' }}
                >
                  ⬇ Página {item.page}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function ConversorClient() {
  const [activeTool, setActiveTool] = useState<ToolId | null>(null)

  if (activeTool) {
    const tool = TOOLS.find(t => t.id === activeTool)!
    return <ToolPanel tool={tool} onBack={() => setActiveTool(null)} />
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 16, fontWeight: 600, color: '#f0f0f0', marginBottom: 4 }}>Conversor de Arquivos</h1>
        <p style={{ fontSize: 12, color: '#555' }}>Ferramentas de PDF e conversão de documentos — processamento 100% no navegador</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {TOOLS.map(tool => {
          const color = CATEGORY_COLOR[tool.category] ?? '#10b981'
          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              style={{
                background: '#111', border: '1px solid #1e1e1e', borderRadius: 12,
                padding: '16px 18px', textAlign: 'left', cursor: 'pointer',
                transition: 'all 0.18s', display: 'flex', flexDirection: 'column', gap: 8,
              }}
              onMouseEnter={e => {
                const el = e.currentTarget
                el.style.borderColor = color + '66'
                el.style.transform = 'translateY(-2px)'
                el.style.boxShadow = `0 8px 24px ${color}12`
              }}
              onMouseLeave={e => {
                const el = e.currentTarget
                el.style.borderColor = '#1e1e1e'
                el.style.transform = 'none'
                el.style.boxShadow = 'none'
              }}
            >
              <span style={{ fontSize: 24 }}>{tool.emoji}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e0e0e0', marginBottom: 3 }}>{tool.label}</div>
                <div style={{ fontSize: 11, color: '#555', lineHeight: 1.5 }}>{tool.desc}</div>
              </div>
              <div style={{ fontSize: 10, color, fontWeight: 600, letterSpacing: '0.05em' }}>USAR →</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
