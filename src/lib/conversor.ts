import { PDFDocument, degrees, rgb, StandardFonts } from 'pdf-lib'

// ── Helpers ───────────────────────────────────────────────────────────────────

export function downloadBytes(data: Uint8Array, filename: string) {
  const blob = new Blob([data.buffer as ArrayBuffer], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a')
  a.href = dataUrl; a.download = filename
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
}

function toBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result as ArrayBuffer)
    r.onerror = rej; r.readAsArrayBuffer(file)
  })
}

async function toDataUrl(file: File): Promise<string> {
  let blob: Blob = file
  if (/heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name)) {
    const mod = await import('heic2any')
    const heic2any = (mod as any).default ?? mod
    const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 })
    blob = Array.isArray(result) ? result[0] : result
  }
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result as string)
    r.onerror = rej; r.readAsDataURL(blob)
  })
}

let _pdfjsVersion: string | null = null
async function getPdfjs() {
  const lib = await import('pdfjs-dist')
  if (!_pdfjsVersion) {
    lib.GlobalWorkerOptions.workerSrc =
      `https://unpkg.com/pdfjs-dist@${lib.version}/build/pdf.worker.min.mjs`
    _pdfjsVersion = lib.version
  }
  return lib
}

function parsePageList(str: string, total: number): number[] {
  const result: number[] = []
  for (const part of str.split(',')) {
    const t = part.trim()
    if (t.includes('-')) {
      const [a, b] = t.split('-').map(Number)
      for (let n = Math.max(1, a); n <= Math.min(total, b); n++) result.push(n)
    } else {
      const n = parseInt(t)
      if (n >= 1 && n <= total) result.push(n)
    }
  }
  return [...new Set(result)].sort((a, b) => a - b)
}

// ── API ───────────────────────────────────────────────────────────────────────

export async function imagesToPdf(files: File[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  for (const file of files) {
    const dataUrl = await toDataUrl(file)
    const base64 = dataUrl.split(',')[1]
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
    const isPng = dataUrl.startsWith('data:image/png')
    const image = isPng ? await doc.embedPng(bytes) : await doc.embedJpg(bytes)
    const { width, height } = image.scale(1)
    const page = doc.addPage([width, height])
    page.drawImage(image, { x: 0, y: 0, width, height })
  }
  return doc.save()
}

export async function mergePdfs(files: File[]): Promise<Uint8Array> {
  const merged = await PDFDocument.create()
  for (const file of files) {
    const buf = await toBuffer(file)
    const src = await PDFDocument.load(buf, { ignoreEncryption: true })
    const pages = await merged.copyPages(src, src.getPageIndices())
    pages.forEach(p => merged.addPage(p))
  }
  return merged.save()
}

export async function splitPdf(
  file: File, mode: 'each' | 'range', rangeStr: string
): Promise<{ data: Uint8Array; name: string }[]> {
  const buf = await toBuffer(file)
  const src = await PDFDocument.load(buf, { ignoreEncryption: true })
  const total = src.getPageCount()
  const base = file.name.replace(/\.pdf$/i, '')

  const groups: number[][] = mode === 'each'
    ? Array.from({ length: total }, (_, i) => [i])
    : rangeStr.split(',').map(part => {
        const [a, b] = part.trim().split('-').map(Number)
        const s = Math.max(1, a || 1) - 1
        const e = Math.min(total, b || a || total) - 1
        return Array.from({ length: e - s + 1 }, (_, i) => s + i)
      })

  return Promise.all(groups.map(async (indices, gi) => {
    const d = await PDFDocument.create()
    const pages = await d.copyPages(src, indices)
    pages.forEach(p => d.addPage(p))
    return { data: await d.save(), name: `${base}_parte${gi + 1}.pdf` }
  }))
}

export async function removePages(file: File, pagesStr: string): Promise<Uint8Array> {
  const buf = await toBuffer(file)
  const src = await PDFDocument.load(buf, { ignoreEncryption: true })
  const total = src.getPageCount()
  const removeSet = new Set(parsePageList(pagesStr, total).map(n => n - 1))
  const keep = Array.from({ length: total }, (_, i) => i).filter(i => !removeSet.has(i))
  const d = await PDFDocument.create()
  const pages = await d.copyPages(src, keep)
  pages.forEach(p => d.addPage(p))
  return d.save()
}

export async function extractPages(file: File, pagesStr: string): Promise<Uint8Array> {
  const buf = await toBuffer(file)
  const src = await PDFDocument.load(buf, { ignoreEncryption: true })
  const total = src.getPageCount()
  const indices = parsePageList(pagesStr, total).map(n => n - 1)
  const d = await PDFDocument.create()
  const pages = await d.copyPages(src, indices)
  pages.forEach(p => d.addPage(p))
  return d.save()
}

export async function rotatePdf(file: File, angle: 90 | 180 | 270): Promise<Uint8Array> {
  const buf = await toBuffer(file)
  const doc = await PDFDocument.load(buf, { ignoreEncryption: true })
  doc.getPages().forEach(p => p.setRotation(degrees((p.getRotation().angle + angle) % 360)))
  return doc.save()
}

export async function addWatermark(file: File, text: string, opacity = 0.2): Promise<Uint8Array> {
  const buf = await toBuffer(file)
  const doc = await PDFDocument.load(buf, { ignoreEncryption: true })
  const font = await doc.embedFont(StandardFonts.HelveticaBold)
  const size = 52
  for (const page of doc.getPages()) {
    const { width, height } = page.getSize()
    page.drawText(text, {
      x: width / 2 - text.length * size * 0.28,
      y: height / 2,
      size, font,
      color: rgb(0.75, 0.75, 0.75),
      opacity,
      rotate: degrees(45),
    })
  }
  return doc.save()
}

export async function pdfToImages(
  file: File, format: 'jpeg' | 'png' = 'jpeg', scale = 2, password?: string
): Promise<{ dataUrl: string; page: number }[]> {
  const lib = await getPdfjs()
  const buf = await toBuffer(file)
  const task = lib.getDocument({ data: new Uint8Array(buf), password: password ?? '' })
  const pdf = await task.promise
  const results: { dataUrl: string; page: number }[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const vp = page.getViewport({ scale })
    const canvas = document.createElement('canvas')
    canvas.width = vp.width; canvas.height = vp.height
    await page.render({ canvas, viewport: vp }).promise
    results.push({ dataUrl: canvas.toDataURL(`image/${format}`, 0.92), page: i })
  }
  return results
}

export async function compressPdf(file: File): Promise<Uint8Array> {
  const buf = await toBuffer(file)
  const doc = await PDFDocument.load(buf, { ignoreEncryption: true })
  return doc.save({ useObjectStreams: true })
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}
